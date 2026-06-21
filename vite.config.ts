import { defineConfig } from "vite-plus"

export default defineConfig({
    fmt: {
        printWidth: 120,
        tabWidth: 4,
        semi: false,
        trailingComma: "all",
        arrowParens: "avoid",
        sortImports: {
            internalPattern: ["~/", "@/", "#", "@cantrip-ui/"],
            partitionByComment: true,
            partitionByNewline: true,
            newlinesBetween: false,
        },
    },
    lint: {
        plugins: ["typescript"],
        jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
        options: {
            typeAware: true,
            typeCheck: true,
        },
        rules: {
            "vite-plus/prefer-vite-plus-imports": "error",
        },
    },
    test: {
        projects: ["core"],
    },
})
