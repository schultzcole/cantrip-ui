import { assertEquals } from "@std/assert"
import { describe, it } from "@std/testing/bdd"
import { effect, reactive } from "./reactive.ts"

describe("reactive", () => {
    it("calls effect func when state prop changes", () => {
        const state = reactive({ foo: "one" })

        const calls: string[] = []
        effect(state, (state) => {
            calls.push(state.foo)
        })

        state.foo = "two"
        state.foo = "three"

        assertEquals(calls, ["one", "two", "three"])
    })

    it("does not call effect func when state changes if effect does not use props", () => {
        const state = reactive({ foo: "bar" })

        let calls = 0
        effect(state, (state) => {
            calls++
            use(state) // effect references state, but not any properties on state
        })

        state.foo = "baz"

        assertEquals(calls, 1)
    })

    it("multiple effects called when state changes", () => {
        const state = reactive({ foo: "bar" })

        const effectCalls = {
            effectA: 0,
            effectB: 0,
        }
        effect(state, (state) => {
            effectCalls.effectA++
            use(state.foo)
        })
        effect(state, (state) => {
            effectCalls.effectB++
            use(state.foo)
        })

        state.foo = "baz"

        assertEquals(effectCalls, { effectA: 2, effectB: 2 })
    })

    it("inner nested effect func called when state changes", () => {
        const state = reactive({ foo: "bar" })

        let innerCalls = 0
        effect(state, (state) => {
            effect(state, (state) => {
                innerCalls++
                use(state.foo)
            })
        })

        state.foo = "baz"

        assertEquals(innerCalls, 2)
    })

    it("outer nested effect func called once if it does not use props", () => {
        const state = reactive({ foo: "bar" })

        let outerCallCount = 0
        effect(state, (state) => {
            outerCallCount++
            effect(state, (state) => {
                use(state.foo)
            })
        })

        state.foo = "baz"

        assertEquals(outerCallCount, 1)
    })

    it("nested effect funcs called once when state changes if both use props, outer first", () => {
        const state = reactive({ foo: "bar" })

        const calls = {
            outer: 0,
            inner: 0,
        }
        effect(state, (state) => {
            calls.outer++
            use(state.foo)
            effect(state, (state) => {
                calls.inner++
                use(state.foo)
            })
        })

        state.foo = "baz"

        assertEquals(calls, { outer: 2, inner: 2 })
    })

    it("nested effect funcs called once when state changes if both use props, outer last", () => {
        const state = reactive({ foo: "bar" })

        const calls = {
            outer: 0,
            inner: 0,
        }
        effect(state, (state) => {
            calls.outer++
            effect(state, (state) => {
                calls.inner++
                use(state.foo)
            })
            use(state.foo)
        })

        state.foo = "baz"

        assertEquals(calls, { outer: 2, inner: 2 })
    })
})

/** placeholder for using some value, to avoid linter warnings */
function use(_: unknown) {}
