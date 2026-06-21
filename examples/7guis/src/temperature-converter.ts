import { HtmlBuilder, reactive } from "@cantrip-ui/core"

type State = {
    celsius: number | null
    fahrenheit: number | null
}
export function temperatureConverter(root: HtmlBuilder, initialCelsius: number | null = null) {
    const state: State = reactive({
        celsius: initialCelsius,
        fahrenheit: cToF(initialCelsius),
    })

    root.effect(state, (state) => state.fahrenheit = cToF(state.celsius))
    root.effect(state, (state) => state.celsius = fToC(state.fahrenheit))

    root.tag("div")
        .attrs({ className: "flex flex-col flex-gap" })
        .component(temperatureField, state, "celsius")
        .component(temperatureField, state, "fahrenheit")
}

function temperatureField(root: HtmlBuilder, state: State, prop: "celsius" | "fahrenheit"): void {
    const fieldId = `${prop}-field`

    root.tag("div", (div) => {
        div.tag("label").attrs({ htmlFor: fieldId }).text(`${prop}: `)

        div.tag("input")
            .attrs({ id: fieldId, type: "number", step: "any" })
            .on("change", (evt) => state[prop] = evt.currentTarget.valueAsNumber)
            .effect(state, (state, input) => input.attr("value", state[prop]))
    })
}

function cToF(c: number | null): number | null {
    if (c === null || Number.isNaN(c)) return null
    return roundTo(c * (9 / 5) + 32)
}

function fToC(f: number | null): number | null {
    if (f === null || Number.isNaN(f)) return null
    return roundTo((f - 32) * (5 / 9))
}

function roundTo(num: number, precision: number = 0.0001): number {
    precision = 1 / precision
    return Math.round(num * precision) / precision
}
