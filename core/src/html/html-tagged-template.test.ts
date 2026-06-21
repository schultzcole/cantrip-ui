import { describe, expect, it } from "vite-plus/test"
import { html } from "./html-tagged-template"

describe("html", () => {
    it("produces normal html string", () => {
        const actual = html` <div></div> `.trim()
        expect(actual).toEqual("<div></div>")
    })

    it("produces string with holes", () => {
        const actual = html` <div>${"ooh"} ${123}</div> `.trim()
        expect(actual).toEqual("<div>ooh 123</div>")
    })
})
