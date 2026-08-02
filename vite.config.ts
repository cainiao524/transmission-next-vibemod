import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const isDemo = env.VITE_APP_DEMO === "true"

  return {
    base: "./",
    plugins: [react(), tailwindcss()],
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
    },
    resolve: {
      alias: [
        // If it's a demo build, replace rpc-client with mock version (specific first)
        ...(isDemo ? [
          { find: "@/lib/rpc-client", replacement: path.resolve(__dirname, "./src/lib/rpc-client-mock.ts") },
        ] : []),
        { find: "@", replacement: path.resolve(__dirname, "./src") },
      ],
    },
    server: {
      proxy: {
        "/transmission": {
          target: env.VITE_TRANSMISSION_PROXY_TARGET || "http://127.0.0.1:9091",
          changeOrigin: true,
        },
      },
    },
  }
})
