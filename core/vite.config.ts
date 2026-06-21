import { defineConfig } from "vite-plus"

export default defineConfig({
    test: {
        environment: "happy-dom",
    },
    pack: {
        entry: ["mod.ts"],
        dts: true,
        format: ["esm"],
        sourcemap: true,
    },
})
