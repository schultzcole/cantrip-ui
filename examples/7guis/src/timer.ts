import { HtmlBuilder, reactive } from "../../../core/mod.ts"

type TimerState = {
    duration: number
    elapsed: number
}

export function timer(root: HtmlBuilder): void {
    const state: TimerState = reactive({
        duration: 15,
        elapsed: 0,
    })

    root.component(eachFrame, (dt) => {
        if (state.elapsed + dt < state.duration) {
            state.elapsed = state.elapsed + dt
        }
    })

    root.tag("div", (grid) => {
        grid.attrs({ className: "timer-grid" })

        // Progress
        grid.tag("div", (row) => {
            row.attrs({ className: "timer-grid-row" })

            row.returnTag("label")
                .attrs({ htmlFor: "timer-progress" })
                .text("Elapsed Time:")
            row.returnTag("progress")
                .attrs({ id: "timer-progress" })
                .effect(state, (state, progress) => progress.attr("value", state.elapsed / state.duration))
            row.returnTag("span")
                .attrs({ className: "right-align" })
                .effect(state, (state, label) => label.replaceText(`${state.elapsed.toFixed(1)}s`))
        })

        // Duration
        grid.tag("div", (row) => {
            row.attrs({ className: "timer-grid-row" })

            row.returnTag("label")
                .attrs({ htmlFor: "duration-range" })
                .text("Duration:")
            row.returnTag("input")
                .attrs({ id: "duration-range", type: "range", min: 3, max: 30 })
                .on("input", (evt) => state.duration = evt.currentTarget.valueAsNumber)
                .effect(state, (state, rangeField) => rangeField.attr("value", state.duration))

            row.returnTag("span")
                .attrs({ className: "right-align" })
                .effect(state, (state, label) => label.replaceText(`${state.duration}s`))
        })

        // Reset
        grid.tag("div", (row) => {
            row.attrs({ className: "timer-grid-row" })

            row.returnTag("button")
                .style({ alignSelf: "start" })
                .text("Reset")
                .on("click", (_) => state.elapsed = 0)
        })
    })
}

function eachFrame(root: HtmlBuilder, func: (dt: number) => void): void {
    let currentFrame: number | null = null
    let lastTimeMs: number = performance.now()
    const inner: FrameRequestCallback = () => {
        const nowMs = performance.now()
        func((nowMs - lastTimeMs) / 1000)
        lastTimeMs = nowMs
        currentFrame = globalThis.requestAnimationFrame(inner)
    }

    currentFrame = globalThis.requestAnimationFrame(inner)

    root.detachedSignal.addEventListener("abort", () => {
        if (currentFrame !== null) {
            globalThis.cancelAnimationFrame(currentFrame)
        }
    })
}
