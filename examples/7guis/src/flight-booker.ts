import { HtmlBuilder, reactive } from "@cantrip-ui/core"
import { selectOptions } from "./shared-components/select-options"
import { unreachable } from "./utils"

const MODES = Object.freeze({
    ONE_WAY: "One-way Flight",
    RETURN: "Return Flight",
})
type Mode = keyof typeof MODES

type UiState = {
    mode: Mode
    startDate?: string
    endDate?: string
}

type ValidFlight =
    | { mode: "ONE_WAY"; startDate: Temporal.PlainDate }
    | { mode: "RETURN"; startDate: Temporal.PlainDate; endDate: Temporal.PlainDate }

export function flightBooker(root: HtmlBuilder, initialStartDate: Temporal.PlainDate): void {
    const state = reactive({
        mode: "ONE_WAY",
        startDate: initialStartDate.toString(),
        endDate: undefined,
    } as UiState)

    root.effect(state, (state) => {
        if (state.mode === "ONE_WAY") {
            state.endDate = undefined
        }
    })

    root.tag("form", (form) => {
        form.attrs({ className: "flex flex-col flex-gap flex-align-center" })

        // Mode select
        form.tag("select")
            .attrs({ value: state.mode })
            .style({ alignSelf: "stretch" })
            .component(selectOptions, MODES)
            .on("change", (evt) => state.mode = evt.currentTarget.value as Mode)

        // Start date
        form.tag("div", (div) => {
            div.tag("label").attrs({ htmlFor: "start-date" }).text("Start Date:")

            div.tag("input")
                .attrs({ id: "start-date", type: "date" })
                .effect(state, (state, input) => input.attr("value", state.startDate))
                .on("change", (evt) => state.startDate = evt.currentTarget.value)
        })

        // Return date
        form.tag("div", (div) => {
            div.tag("label").attrs({ htmlFor: "return-date" }).text("Return Date:")

            div.tag("input")
                .attrs({ id: "return-date", type: "date" })
                .effect(state, (state, input) => {
                    input.attrs({
                        disabled: state.mode !== "RETURN",
                        value: state.endDate,
                    })

                    let invalidMessage: string = ""
                    const startDate = parseDate(state.startDate)
                    if (!startDate) {
                        return
                    } else if (state.endDate) {
                        const endDate = parseDate(state.endDate)
                        if (!endDate) {
                            invalidMessage = "Return Date is not valid"
                        } else if (Temporal.PlainDate.compare(endDate, startDate) < 0) {
                            invalidMessage = "Return Date must be after Start Date"
                        }
                    }

                    input.element.setCustomValidity(invalidMessage)
                    input.element.reportValidity()
                })
                .on("change", (evt) => state.endDate = evt.currentTarget.value)
        })

        // Submit button
        form.tag("button")
            .attrs({ type: "button" })
            .text("Book")
            .effect(state, (state, button) => button.attr("disabled", !validate(state)))
            .on("click", (_) => bookFlight(state))
    })
}

function parseDate(str: string | undefined): Temporal.PlainDate | null {
    try {
        return Temporal.PlainDate.from(str!)
    } catch {
        // PlainDate.from throws if str is invalid
        return null
    }
}

function validate(state: UiState): ValidFlight | null {
    const mode = state.mode
    switch (mode) {
        case "ONE_WAY": {
            const startDate = parseDate(state.startDate)
            if (startDate) {
                return { mode, startDate }
            }
            return null
        }
        case "RETURN": {
            const startDate = parseDate(state.startDate)
            const endDate = parseDate(state.endDate)
            if (startDate && endDate && Temporal.PlainDate.compare(endDate, startDate) >= 0) {
                return { mode, startDate, endDate }
            }
            return null
        }
        default:
            unreachable(mode)
    }
}

function bookFlight(state: UiState) {
    const flight = validate(state)
    if (flight) {
        const mode = flight.mode
        const startStr = flight.startDate.toLocaleString()
        switch (mode) {
            case "ONE_WAY":
                return alert(`You booked a one-way flight on ${startStr}`)
            case "RETURN": {
                const endString = flight.endDate.toLocaleString()
                return alert(`You booked a return flight starting on ${startStr} and returning on ${endString}`)
            }
            default:
                unreachable(mode)
        }
    } else {
        alert("There was an error with your flight!")
    }
}
