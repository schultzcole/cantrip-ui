import { effect, HtmlBuilder, reactive } from "../../../core/mod.ts"

type State = { celsius: number | null; fahrenheit: number | null }
export function temperatureConverter(root: HtmlBuilder, initialCelsius: number | null = null) {
    const state: State = reactive({
        celsius: initialCelsius,
        fahrenheit: cToF(initialCelsius),
    })

    effect(state, (state) => state.fahrenheit = cToF(state.celsius))
    effect(state, (state) => state.celsius = fToC(state.fahrenheit))

    root.tag("div", { className: "flex flex-col flex-gap" }, (div) => {
        div
            .component(temperatureField, state, "celsius")
            .component(temperatureField, state, "fahrenheit")
    })
}

function temperatureField(root: HtmlBuilder, state: State, prop: "celsius" | "fahrenheit"): void {
    const fieldId = `${prop}-field`
    root.tag("div", (div) => {
        div
            .tag("label", { htmlFor: fieldId }, (label) => label.text(`${prop}: `))
            .tag("input", { id: fieldId, type: "number", step: "0.1" }, (input) => {
                input
                    .reactive(state, (state) => input.attr("value", state[prop]))
                    .on("change", (evt) => state[prop] = evt.currentTarget.valueAsNumber)
            })
    })
}

function cToF(c: number | null): number | null {
    return discardNonNumbers(c, (c) => roundTo(c * (9 / 5) + 32))
}

function fToC(f: number | null): number | null {
    return discardNonNumbers(f, (f) => roundTo((f - 32) * (5 / 9)))
}

function discardNonNumbers(num: number | null, func: (num: number) => number): number | null {
    if (num === null || Number.isNaN(num)) return null
    return func(num)
}

function roundTo(num: number, precision: number = 0.0001): number {
    precision = 1 / precision
    return Math.round(num * precision) / precision
}
