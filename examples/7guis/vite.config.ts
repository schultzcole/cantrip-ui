import { analyzer, unstableRolldownAdapter } from "vite-bundle-analyzer"
import { defineConfig, lazyPlugins } from "vite-plus"
import { resolve } from 'path'

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
    resolve: {
        alias: {
            '@cantrip-ui/core': resolve(__dirname, '../../core/mod.ts'),
        }
    }
})
