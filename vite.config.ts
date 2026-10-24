import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// 生产环境部署在 https://sync.lzyszds.cn/console 下；
// 本地开发时可用 VITE_API_BASE 指向远程后端（见 .env.example）。
export default defineConfig({
  base: "/console",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 8989,
    proxy: {
      "/admin": {
        target: "https://sync.lzyszds.cn",
        changeOrigin: true,
      },
      "/uploads": {
        target: "https://sync.lzyszds.cn",
        changeOrigin: true,
      },
    },
  },
})
