import { HtmlBuilder } from "@cantrip-ui/core"
import "./style.css"
import { counter } from "./counter"
import { temperatureConverter } from "./temperature-converter"
import { flightBooker } from "./flight-booker"
import { timer } from "./timer"
import { addressBook } from "./address-book"

HtmlBuilder.build(document.getElementById("app")!, (root) => {
    root.tag("h1", (heading) => heading.html(`<em>cantrip</em> ui - 7GUIs`))

    root.tag<"div">("div", (col) => {
        col.attrs({ className: "flex flex-col flex-gap" })

        col.tag("div", (panel) => {
            panel
                .attrs({ className: "panel drop-shadow" })
                .html(
                    `<p>
                        A demo of Eugen Kiss's <strong><a href="https://eugenkiss.github.io/7guis" target="_blank">7GUIs</a></strong>
                        UI framework benchmark implemented in <strong><em>cantrip</em> ui</strong>.
                    </p>`,
                )
        })

        col.tag("div", (panel) => {
            panel
                .attrs({ className: "panel drop-shadow" })
                .html(`<h2>Counter</h2>`)
                .component(counter, 42)
        })

        col.tag("div", (panel) => {
            panel
                .attrs({ className: "panel drop-shadow" })
                .html(`<h2>Temperature Converter</h2>`)
                .component(temperatureConverter, 20)
        })

        col.tag("div", (panel) => {
            panel
                .attrs({ className: "panel drop-shadow" })
                .html(`<h2>Flight Booker</h2>`)
                .component(flightBooker, Temporal.Now.plainDateISO())
        })

        col.tag("div", (panel) => {
            panel
                .attrs({ className: "panel drop-shadow" })
                .html(`<h2>Timer</h2>`)
                .component(timer)
        })

        col.tag("div", (panel) => {
            panel
                .attrs({ className: "panel drop-shadow" })
                .html(`<h2>Address Book</h2>`)
                .component(addressBook)
        })

        col.tag("div", (panel) => {
            panel.attrs({ className: "panel drop-shadow" }).html(`<h2>Circle Drawer</h2>`)
        })

        col.tag("div", (panel) => {
            panel.attrs({ className: "panel drop-shadow" }).html(`<h2>Cells</h2>`)
        })
    })
})
