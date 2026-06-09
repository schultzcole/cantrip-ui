import { HtmlBuilder } from "../../../core/mod.ts"
import "./style.css"
import { counter } from "./counter.ts"
import { temperatureConverter } from "./temperature-converter.ts"

const rootElement = document.getElementById("app")!
new HtmlBuilder("template")
    .tag("h1", (heading) => heading.text("FOOF 7GUIs"))
    .tag("div", { className: "flex flex-col flex-gap" }, (column) => {
        column.tag("div", { className: "panel drop-shadow" }, (panel) => {
            panel.html`<p>
                A demo of Eugen Kiss's <a href="https://eugenkiss.github.io/7guis" target="_blank">7GUIs</a>
                UI framework benchmark implemented in FOOF.
            </p>`
        })

        column.tag("div", { className: "panel drop-shadow" }, (panel) => {
            panel
                .html`<h2>Counter</h2>`
                .component(counter, 42)
        })

        column.tag("div", { className: "panel drop-shadow" }, (panel) => {
            panel
                .html`<h2>Temperature Converter</h2>`
                .component(temperatureConverter, 0)
        })

        column.tag("div", (panel) => {
            panel.attrs({ className: "panel drop-shadow" })
                .html(`<h2>Flight Booker</h2>`)
        })

        column.tag("div", (panel) => {
            panel.attrs({ className: "panel drop-shadow" })
                .html(`<h2>Timer</h2>`)
        })

        column.tag("div", (panel) => {
            panel.attrs({ className: "panel drop-shadow" })
                .html(`<h2>Address Book</h2>`)
        })

        column.tag("div", (panel) => {
            panel.attrs({ className: "panel drop-shadow" })
                .html(`<h2>Circle Drawer</h2>`)
        })

        column.tag("div", (panel) => {
            panel.attrs({ className: "panel drop-shadow" })
                .html(`<h2>Cells</h2>`)
        })
    })
    .mount(rootElement)
