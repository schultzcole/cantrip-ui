import { defineConfig } from "vite"
import deno from "@deno/vite-plugin"
import { analyzer, unstableRolldownAdapter } from "vite-bundle-analyzer"

export default defineConfig({
    plugins: [
        deno(),
        unstableRolldownAdapter(analyzer({
            summary: true,
            analyzerMode: "static",
            openAnalyzer: false,
            fileName: "vite-bundle-stats",
        })),
    ],
})
