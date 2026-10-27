import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()], //啟用 React 外掛，讓 Vite 能夠看得懂我們寫的 .jsx 檔案（JSX 語法），並即時轉譯成瀏覽器看得懂的程式碼。
  base: './', //當專案變成桌面應用程式後，它並不是透過網址伺服器開啟，而是直接讀取你電腦硬碟裡的檔案。如果使用絕對路徑，桌面視窗會找不到檔案而變成「白畫面」。改成 ./ 之後，路徑就會變成「相對路徑」
})
