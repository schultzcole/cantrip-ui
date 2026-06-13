import { assertEquals } from "@std/assert"
import { describe, it } from "@std/testing/bdd"
import { html } from "./html-tagged-template.ts"

describe("html", () => {
    it("produces normal html string", () => {
        const actual = html`
            <div></div>
        `.trim()
        assertEquals(actual, "<div></div>")
    })

    it("produces string with holes", () => {
        const actual = html`
            <div>${"ooh"} ${123}</div>
        `.trim()
        assertEquals(actual, "<div>ooh 123</div>")
    })
})
