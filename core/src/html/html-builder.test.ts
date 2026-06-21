import { beforeEach, describe, expect, it } from "vite-plus/test"
import HtmlBuilder from "./html-builder"

describe("HtmlBuilder", () => {
    beforeEach(() => {
        document.body.innerHTML = ""
    })

    describe("#tag", () => {
        it("should build correct nested hierarchy", () => {
            const builder = new HtmlBuilder("div")
            builder
                .tag("h1", h1 => h1.text("A list!"))
                .tag("ul", ul => ul.tag("li", li => li.text("Item One")).tag("li", li => li.text("Item Two")))
            builder.mount(document.body)

            expect(document.body.innerHTML).toEqual(
                "<div><h1>A list!</h1><ul><li>Item One</li><li>Item Two</li></ul></div>",
            )
        })
    })

    describe("#attrs", () => {
        it("should build attrs correctly", () => {
            const builder = new HtmlBuilder("div")
            builder.attrs({ className: "a-class", hidden: true })
            builder.mount(document.body)

            expect(document.body.innerHTML).toEqual('<div class="a-class" hidden=""></div>')
        })
    })

    describe("#attr", () => {
        it("should add single known attr", () => {
            const builder = new HtmlBuilder("div")
            builder.attr("hidden", true)
            builder.mount(document.body)

            expect(document.body.innerHTML).toEqual('<div hidden=""></div>')
        })

        it("should add single unknown attr", () => {
            const builder = new HtmlBuilder("div")
            builder.attr("unknownProperty", "a value")
            builder.mount(document.body)

            expect(document.body.innerHTML).toEqual('<div unknownproperty="a value"></div>')
        })
    })

    describe("#data", () => {
        it("should build data attrs correctly", () => {
            const builder = new HtmlBuilder("div")
            builder.data({ foo: "bar", bazQux: true })
            builder.mount(document.body)

            expect(document.body.innerHTML).toEqual(`<div data-foo="bar" data-baz-qux="true"></div>`)
        })

        it("should add single data attribute", () => {
            const builder = new HtmlBuilder("div")
            builder.data("foo", "bar")
            builder.mount(document.body)

            expect(document.body.innerHTML).toEqual(`<div data-foo="bar"></div>`)
        })
    })

    describe("#class", () => {
        it("should add class to element", () => {
            const builder = new HtmlBuilder("div")
            builder.class("a-class")
            builder.mount(document.body)

            expect(document.body.innerHTML).toEqual('<div class="a-class"></div>')
        })

        it("should add class to element when `force` is true", () => {
            const builder = new HtmlBuilder("div")
            builder.class("yes", true)
            builder.class("no", false)
            builder.mount(document.body)

            expect(document.body.innerHTML).toEqual('<div class="yes"></div>')
        })
    })

    describe("#style", () => {
        it("should build inline styles correctly", () => {
            const builder = new HtmlBuilder("div")
            builder.style({ backgroundColor: "red", marginLeft: "10px" })
            builder.mount(document.body)

            expect(document.body.innerHTML).toEqual(`<div style="background-color: red; margin-left: 10px;"></div>`)
        })
    })

    describe("#css", () => {
        it("should build custom css properties correctly", () => {
            const builder = new HtmlBuilder("div")
            builder.css({ "--my-css-var": "10px" })
            builder.mount(document.body)

            expect(document.body.innerHTML).toEqual(`<div style="--my-css-var: 10px;"></div>`)
        })
    })

    describe("template builder", () => {
        it("should add children of template to parent on mount", () => {
            const builder = new HtmlBuilder("template")
            builder.tag("div", div => div.attr("id", "one")).tag("div", div => div.attr("id", "two"))
            builder.mount(document.body)

            expect(document.body.innerHTML).toEqual(`<div id="one"></div><div id="two"></div>`)
        })
    })
})
