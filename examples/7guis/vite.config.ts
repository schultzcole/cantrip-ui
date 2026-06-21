import { defineConfig } from "vite"
import { analyzer, unstableRolldownAdapter } from "vite-bundle-analyzer"

export default defineConfig({
    plugins: [
        unstableRolldownAdapter(analyzer({
            summary: true,
            analyzerMode: "static",
            openAnalyzer: false,
            fileName: "vite-bundle-stats",
        })),
    ],
})
