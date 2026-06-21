import { analyzer, unstableRolldownAdapter } from "vite-bundle-analyzer"
import { defineConfig, lazyPlugins } from "vite-plus"

export default defineConfig({
    plugins: lazyPlugins(() => [
        unstableRolldownAdapter(
            analyzer({
                summary: true,
                analyzerMode: "static",
                openAnalyzer: false,
                fileName: "vite-bundle-stats",
            }),
        ),
    ]),
})
