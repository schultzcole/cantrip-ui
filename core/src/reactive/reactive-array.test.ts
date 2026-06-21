import { expect, it } from "vite-plus/test"
import { effect, reactive } from "./reactive"

it("setting to index triggers effect bound to that index", () => {
    const state = reactive([1, 2, 3])

    const calls: number[] = []
    effect(state, state => {
        calls.push(state[0]!)
    })

    state[0] = 42

    expect(calls).toEqual([1, 42])
})

it("setting to index does not trigger effect bound to different index", () => {
    const state = reactive([1, 2, 3])

    const calls: number[] = []
    effect(state, state => {
        calls.push(state[0]!)
    })

    state[1] = 42

    expect(calls).toEqual([1])
})

it("setting to index triggers effect bound to iteration", () => {
    const state = reactive([1, 2, 3])

    const calls: number[] = []
    effect(state, state => {
        for (const number of state) {
            calls.push(number)
        }
    })

    state[1] = 42

    expect(calls).toEqual([1, 2, 3, 1, 42, 3])
})

it("pushing does not trigger effect bound to index", () => {
    const state = reactive([1, 2, 3])

    const calls: number[] = []
    effect(state, state => {
        calls.push(state[0]!)
    })

    state.push(42)

    expect(calls).toEqual([1])
})

it("pushing triggers effect bound to iteration", () => {
    const state = reactive([1, 2, 3])

    const calls: number[] = []
    effect(state, state => {
        for (const number of state) {
            calls.push(number)
        }
    })

    state.push(42)

    expect(calls).toEqual([1, 2, 3, 1, 2, 3, 42])
})
