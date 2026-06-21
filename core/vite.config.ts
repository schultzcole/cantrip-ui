import { defineConfig } from "vite-plus"

export default defineConfig({
    test: {
        environment: "happy-dom",
    },
    pack: {
        entry: ["index.ts"],
        format: ["esm"],
        dts: true,
        sourcemap: true,
    },
})
