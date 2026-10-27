import { useState, useEffect } from 'react'
import './App.css'


function App() {
  // 目前選取的分頁 (預設為 'home')
  const [activeTab, setActiveTab] = useState('home')

// 🔴 這裡用來裝同學資料庫傳來的資料 (初始值為 null)
  const [healthData, setHealthData] = useState(null)

  // 🔴 畫面剛載入時，自動去跟同學的 API 抓資料
  useEffect(() => {
    // ⚠️ 注意：這裡的 IP (10.48.39.237) 和 Port (3000) 必須換成同學目前的實際設定
    fetch('http://10.48.39.46:3000/api/data')
      .then(res => res.json())
      .then(data => {
        console.log('成功連上同學的資料庫！資料：', data)
        setHealthData(data) // 把抓到的資料存進 healthData
      })
      .catch(err => {
        console.error('連線失敗，請確認同學後端是否開啟，或網址對不對：', err)
      })
  }, [])

  // 模擬 SMART on FHIR 登入按鈕動作
  const handleFHIRLogin = () => {
    alert('準備連線至 SMART on FHIR 沙盒進行授權登入...')
  }
  // 記錄「最近使用」的專屬功能（預設先放久坐監測）
  const [recentFeature, setRecentFeature] = useState({
    name: "久坐監測",
    icon: "🪑",
    tabKey: "sedentary"
  })

  // 點擊專屬功能卡片時：除了切換頁面，也更新下方第三個按鈕的紀錄
  const handleCardClick = (name, icon, tabKey) => {
    setRecentFeature({ name, icon, tabKey })
    setActiveTab(tabKey)
  }

  return (
    <div className="app-container">
      {/* 頂部標題列 */}
      <header className="top-bar">
        <h1>UniVital 健康護照</h1>
        <div className="user-status">已連線</div>
      </header>

      {/* 主要內容顯示區 */}
      <main className="content-body">
        {activeTab === 'home' && (
          <div className="page-home">
            {/* 重要資訊 */}
            <section className="section-group">
              <h2 className="section-title">重要資訊</h2>
              <div className="card-item" onClick={handleFHIRLogin}>
                <div className="card-icon">🔐</div>
                <div className="card-text">
                  <h3>FHIR 醫療沙盒連線</h3>
                  <p>點擊以進行認證與資料同步</p>
                </div>
              </div>
            </section>

            {/* 常用服務 */}
            <section className="section-group">
              <h2 className="section-title">專屬功能</h2>
             <div className="card-grid">
              <div className="card-item" onClick={() => handleCardClick('健康存摺', '📋', 'health-bank')}>
                <div className="card-icon">📋</div>
                <div className="card-text">
                  <h3>健康存摺</h3>
                  <p>My Health Bank</p>
                </div>
              </div>

              <div className="card-item" onClick={() => handleCardClick('健身與體態管理', '💪', 'fitness')}>
                <div className="card-icon">💪</div>
                <div className="card-text">
                  <h3>健身與體態管理</h3>
                  <p>Fitness & Posture Management</p>
                </div>
              </div>

              <div className="card-item" onClick={() => handleCardClick('夜貓熬夜與作息監測', '😴', 'sleep')}>
                <div className="card-icon">😴</div>
                <div className="card-text">
                  <h3>夜貓熬夜與作息監測</h3>
                  <p>Sleep well?</p>
                </div>
              </div>

              <div className="card-item" onClick={() => handleCardClick('久坐監測', '🪑', 'sit')}>
                <div className="card-icon">🪑</div>
                <div className="card-text">
                  <h3>久坐監測</h3>
                  <p>Sedentary Reminder</p>
                </div>
              </div>

              <div className="card-item" onClick={() => handleCardClick('經期節律與週期追蹤', '🗓️', 'period')}>
                <div className="card-icon">🗓️</div>
                <div className="card-text">
                  <h3>經期節律與週期追蹤</h3>
                  <p>Menstrual rhythm and cycle tracking</p>
                </div>
              </div>
</div>
            </section>
          </div>
        )}

        {/* 預留空白的另外三個分頁 */}
        {activeTab === 'health-bank' && (
          <div className="page-empty">
            <h2>📋 健康存摺</h2>
            {/* 判斷資料是否已經抓回來了 */}
            {healthData ? (
              <div style={{ textAlign: 'left', padding: '15px', background: '#f5f5f5', borderRadius: '8px', marginTop: '10px' }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>以下是從同學資料庫取得的資料：</p>
                {/* 將 JSON 資料轉成文字顯示出來 */}
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '14px' }}>
                  {JSON.stringify(healthData, null, 2)}
                </pre>
              </div>
            ) : (
              <p>資料連線中...（請確保同學的後端已開啟）</p>
            )}
          </div>
        )}

        {activeTab === 'fitness' && (
          <div className="page-empty">
            <h2>💪 健身與體態管理</h2>
            <p>（功能建置中，敬請期待）</p>
          </div>
        )}

        {activeTab === 'sleep' && (
          <div className="page-empty">
            <h2>😴 夜貓熬夜與作息監測</h2>
            <p>（功能建置中，敬請期待）</p>
          </div>
        )}

        {activeTab === 'sit' && (
          <div className="page-empty">
            <h2>🪑 久坐監測</h2>
            <p>（功能建置中，敬請期待）</p>
          </div>
        )}

        {activeTab === 'period' && (
          <div className="page-empty">
            <h2>🗓️ 經期節律與週期追蹤</h2>
            <p>（功能建置中，敬請期待）</p>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="page-empty">
            <h2>👤 我的</h2>
            <p>（功能建置中，敬請期待）</p>
          </div>
        )}
      </main>

      {/* 底部導覽列 */}
      <nav className="bottom-nav">
        <button 
          className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-label">首頁</span>
        </button>

        <button 
          className={`nav-btn ${activeTab === 'health-bank' ? 'active' : ''}`}
          onClick={() => setActiveTab('health-bank')}
        >
          <span className="nav-icon">📋</span>
          <span className="nav-label">健康存摺</span>
        </button>

        <button 
          className={`nav-btn ${activeTab === recentFeature.tabKey ? 'active' : ''}`}
          onClick={() => setActiveTab(recentFeature.tabKey)}
        >
          <span className="nav-icon">🕒</span>
          <span className="nav-label">最近拜訪</span>
        </button>

        <button 
          className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <span className="nav-icon">👤</span>
          <span className="nav-label">我的</span>
        </button>
      </nav>
    </div>
  )
}

export default App