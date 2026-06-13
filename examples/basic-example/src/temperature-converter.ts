import { effect, HtmlBuilder, reactive } from "../../../core/mod.ts"

type State = { celsius: number | null; fahrenheit: number | null }
export function temperatureConverter(root: HtmlBuilder, initialCelsius: number | null = null) {
    const state: State = reactive({
        celsius: initialCelsius,
        fahrenheit: cToF(initialCelsius),
    })

    effect(state, (state) => state.fahrenheit = cToF(state.celsius))
    effect(state, (state) => state.celsius = fToC(state.fahrenheit))

    root.tag("div", ({ attrs, component }) => {
        attrs({ className: "flex flex-col flex-gap" })
        component(temperatureField, state, "celsius")
        component(temperatureField, state, "fahrenheit")
    })
}

function temperatureField(root: HtmlBuilder, state: State, prop: "celsius" | "fahrenheit"): void {
    const fieldId = `${prop}-field`
    root.tag("div", ({ tag }) => {
        tag("label", ({ attrs, replaceText }) => {
            attrs({ htmlFor: fieldId })
            replaceText(`${prop}: `)
        })
        tag("input", ({ attrs, attr, on }) => {
            attrs({ id: fieldId, type: "number", step: "0.1" })
            effect(state, (state) => attr("value", state[prop]))
            on("change", (evt) => state[prop] = evt.currentTarget.valueAsNumber)
        })
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
