package com.example.myapplication

import android.net.Uri
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.lifecycleScope
import com.example.myapplication.ui.theme.MyApplicationTheme
import com.google.android.fhir.FhirEngineProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import net.openid.appauth.AuthorizationRequest
import net.openid.appauth.AuthorizationResponse
import net.openid.appauth.AuthorizationService
import net.openid.appauth.AuthorizationServiceConfiguration
import net.openid.appauth.ResponseTypeValues
import org.hl7.fhir.r4.model.HumanName
import org.hl7.fhir.r4.model.Patient
import java.net.HttpURLConnection
import java.net.URL

class MainActivity : ComponentActivity() {

    companion object {
        var savedAuthRequest: AuthorizationRequest? = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val uri = intent?.data
        if (uri != null && uri.toString().startsWith("fjuhealth://callback")) {
            val code = uri.getQueryParameter("code")
            if (code != null) {
                Log.d("FHIR_AUTH", "✅ 攔截到 Code: $code，準備交換 Token...")
                exchangeCodeForToken(code)
            } else {
                Log.e("FHIR_AUTH", "❌ 攔截到網址，但沒有 Code: $uri")
            }
        }

        setContent {
            MyApplicationTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding),
                        contentAlignment = Alignment.Center
                    ) {
                        Button(onClick = { startSmartLogin() }) {
                            Text("開始 SMART on FHIR 登入")
                        }
                    }
                }
            }
        }
    }

    // ==========================================
    // 🚀 SMART OAuth 2.0 授權登入
    // ==========================================
    private fun startSmartLogin() {
        val serviceConfig = AuthorizationServiceConfiguration(
            Uri.parse("https://iol2auth.interop.community/authorize"),
            Uri.parse("https://iol2auth.interop.community/token")
        )

        val authRequestBuilder = AuthorizationRequest.Builder(
            serviceConfig,
            "ca124a9b-d082-421d-aa3a-2ca42ed281fe",
            ResponseTypeValues.CODE,
            Uri.parse("fjuhealth://callback")
        )

        val additionalParams = mapOf(
            "aud" to "https://gw.interop.community/fjuhealthpassport/data"
        )

        val authRequest = authRequestBuilder
            .setScope("launch/patient openid profile patient/*.write")
            .setAdditionalParameters(additionalParams)
            .build()

        savedAuthRequest = authRequest

        val authService = AuthorizationService(this)
        val authIntent = authService.getAuthorizationRequestIntent(authRequest)

        startActivity(authIntent)
    }

    // ==========================================
    // 🔑 交換 Token，並取得授權的病患 ID
    // ==========================================
    private fun exchangeCodeForToken(code: String) {
        val request = savedAuthRequest
        if (request == null) return

        val authResponse = AuthorizationResponse.Builder(request)
            .setAuthorizationCode(code)
            .build()

        val tokenRequest = authResponse.createTokenExchangeRequest()
        val authService = AuthorizationService(this)

        authService.performTokenRequest(tokenRequest) { response, ex ->
            if (response != null) {
                val accessToken = response.accessToken ?: return@performTokenRequest
                val patientId = response.additionalParameters["patient"] ?: return@performTokenRequest

                Log.d("FHIR_TOKEN", "🎉 成功取得 Access Token！")
                Log.d("FHIR_TOKEN", "🩺 授權病患 ID: $patientId，準備上傳健康數據...")

                // 👉 直接呼叫上傳健康數據 (Observation) 的函式
                lifecycleScope.launch {
                    uploadHealthDataToMeldSandbox(accessToken, patientId)
                }

            } else {
                Log.e("FHIR_TOKEN", "❌ 交換 Token 失敗: ${ex?.message}")
            }
        }
    }

    // ==========================================
    // ☁️ 帶著 Token 上傳「健康數據 (Observation)」到 Meld Sandbox
    // ==========================================
    private suspend fun uploadHealthDataToMeldSandbox(accessToken: String, patientId: String) {
        withContext(Dispatchers.IO) {
            try {
                // 👉 1. 將網址改為上傳健康數據的 /Observation 端點
                val url = URL("https://gw.interop.community/fjuhealthpassport/data/Observation")
                val connection = url.openConnection() as HttpURLConnection

                // 👉 2. 使用 POST (新增一筆數據)
                connection.requestMethod = "POST"
                connection.setRequestProperty("Content-Type", "application/fhir+json")
                connection.setRequestProperty("Authorization", "Bearer $accessToken")
                connection.doOutput = true

                // 👉 3. 建立一筆「步數 (Step Count)」的健康數據，並綁定給該名病患
                val jsonString = """
                    {
                      "resourceType": "Observation",
                      "status": "final",
                      "category": [
                        {
                          "coding": [
                            {
                              "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                              "code": "activity",
                              "display": "Activity"
                            }
                          ]
                        }
                      ],
                      "code": {
                        "coding": [
                          {
                            "system": "http://loinc.org",
                            "code": "41950-7",
                            "display": "Number of steps in 24 hour Measured"
                          }
                        ]
                      },
                      "subject": {
                        "reference": "Patient/$patientId"
                      },
                      "valueQuantity": {
                        "value": 8500,
                        "unit": "steps",
                        "system": "http://unitsofmeasure.org",
                        "code": "{steps}"
                      }
                    }
                """.trimIndent()

                val input = jsonString.toByteArray(Charsets.UTF_8)
                connection.outputStream.use { os ->
                    os.write(input, 0, input.size)
                }

                val responseCode = connection.responseCode
                if (responseCode in 200..299) {
                    Log.d("FHIR_API", "✅ 太神啦！成功上傳【健康數據】到 Meld 沙盒！狀態碼：$responseCode")
                } else {
                    val errorMsg = connection.errorStream?.bufferedReader()?.use { it.readText() }
                    Log.e("FHIR_API", "❌ 上傳失敗！狀態碼：$responseCode，錯誤：$errorMsg")
                }
            } catch (e: Exception) {
                Log.e("FHIR_API", "❌ 網路連線錯誤：${e.message}")
            }
        }
    }
}