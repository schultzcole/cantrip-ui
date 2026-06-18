import { assertEquals } from "@std/assert"
import { describe, it } from "@std/testing/bdd"
import { effect, reactiveWithContext } from "./reactive.ts"

describe("reactive", () => {
    it("calls effect func when state prop changes", async () => {
        const { state, context } = reactiveWithContext({ foo: "one" })

        const calls: string[] = []
        effect(state, (state) => {
            calls.push(state.foo)
        })

        state.foo = "two"
        await context.triggerReleasePromise
        state.foo = "three"
        await context.triggerReleasePromise

        assertEquals(calls, ["one", "two", "three"])
    })

    it("does not call effect func when state changes if effect does not use props", async () => {
        const { state, context } = reactiveWithContext({ foo: "bar" })

        let calls = 0
        effect(state, (state) => {
            calls++
            use(state) // effect references state, but not any properties on state
        })

        state.foo = "baz"
        await context.triggerReleasePromise

        assertEquals(calls, 1)
    })

    it("multiple effects called when state changes", async () => {
        const { state, context } = reactiveWithContext({ foo: "bar" })

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
        await context.triggerReleasePromise

        assertEquals(effectCalls, { effectA: 2, effectB: 2 })
    })

    it("recursive effect is called once", async () => {
        const { state, context } = reactiveWithContext({ value: 1 })

        effect(state, (state) => state.value += 1)

        await context.triggerReleasePromise
        assertEquals(state.value, 2)
    })

    describe("nested effects", () => {
        it("inner func called when state changes", async () => {
            const { state, context } = reactiveWithContext({ foo: "bar" })

            let innerCalls = 0
            effect(state, (state) => {
                effect(state, (state) => {
                    innerCalls++
                    use(state.foo)
                })
            })

            state.foo = "baz"
            await context.triggerReleasePromise

            assertEquals(innerCalls, 2)
        })

        it("outer func does not get called again if it does not use any changed props", async () => {
            const { state, context } = reactiveWithContext({ foo: "bar" })

            let outerCallCount = 0
            effect(state, (state) => {
                outerCallCount++
                effect(state, (state) => {
                    use(state.foo)
                })
            })

            state.foo = "baz"
            await context.triggerReleasePromise

            assertEquals(outerCallCount, 1)
        })

        it("both funcs get called once when both use changed prop when outer func uses prop first", async () => {
            const { state, context } = reactiveWithContext({ foo: "bar" })

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
            await context.triggerReleasePromise

            assertEquals(calls, { outer: 2, inner: 2 })
        })

        it("both funcs get called once when both use changed prop when outer func uses prop last", async () => {
            const { state, context } = reactiveWithContext({ foo: "bar" })

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
            await context.triggerReleasePromise

            assertEquals(calls, { outer: 2, inner: 2 })
        })

        it("both funcs get called once when both funcs change state when outer func changes state first", async () => {
            const { state, context } = reactiveWithContext({ value: 1 })

            effect(state, (state) => {
                state.value += 1
                effect(state, (state) => {
                    state.value += 1
                })
            })

            await context.triggerReleasePromise
            assertEquals(state.value, 3)
        })

        it("both funcs get called once when when both funcs change state when outer func changes state last", async () => {
            const { state, context } = reactiveWithContext({ value: 1 })

            effect(state, (state) => {
                effect(state, (state) => {
                    state.value += 1
                })
                state.value += 1
            })

            await context.triggerReleasePromise
            assertEquals(state.value, 3)
        })
    })

    describe("dependent effects", () => {
        type Temps = { celsius: number; fahrenheit: number }

        const computeCelsius = (state: Temps, calls: string[]) => {
            calls.push("computeCelsius")
            state.celsius = (state.fahrenheit - 32) * (5 / 9)
        }
        const computeFahrenheit = (state: Temps, calls: string[]) => {
            calls.push("computeFahrenheit")
            state.fahrenheit = (state.celsius * (9 / 5)) + 32
        }
        it("do not create an infinite loop if they are not compounding and first effect is triggered", async () => {
            const { state, context } = reactiveWithContext({ celsius: 0, fahrenheit: 32 } satisfies Temps)
            const calls: string[] = []

            // non-"compounding" effects. When either celsius or fahrenheit change, state settles into a steady state
            effect(state, (state) => computeCelsius(state, calls))
            effect(state, (state) => computeFahrenheit(state, calls))

            state.celsius = -40
            await context.triggerReleasePromise

            assertEquals(calls, ["computeCelsius", "computeFahrenheit", "computeFahrenheit", "computeCelsius"])
        })

        it("do not create an infinite loop if they are not compounding and second effect is triggered", async () => {
            const { state, context } = reactiveWithContext({ celsius: 0, fahrenheit: 32 })
            const calls: string[] = []

            // non-"compounding" effects. When either celsius or fahrenheit change, state settles into a steady state
            effect(state, (state) => computeCelsius(state, calls))
            effect(state, (state) => computeFahrenheit(state, calls))

            state.fahrenheit = -40
            await context.triggerReleasePromise

            assertEquals(calls, ["computeCelsius", "computeFahrenheit", "computeCelsius", "computeFahrenheit"])
        })

        it("do not create an infinite loop if they are compounding", { only: true }, async () => {
            type Values = { value1: number; value2: number }
            const { state, context } = reactiveWithContext({ value1: 0, value2: 0 } satisfies Values)

            // "compounding" effects. When either value1 or value2 change, the state would continuously update forever
            effect(state, (state) => state.value1 = state.value2 + 1)
            await context.triggerReleasePromise
            effect(state, (state) => state.value2 = state.value1 + 1)
            await context.triggerReleasePromise

            assertEquals(state as Values, { value1: 3, value2: 4 })
        })
    })

    describe("dependent nested effects", () => {
        type State = { value1: number; value2: number; value3: number }
        it("triggering outer effect does not double trigger inner effect", async () => {
            const { state, context } = reactiveWithContext({ value1: 0, value2: 0, value3: 0 } satisfies State)

            effect(state, (state) => {
                state.value1++
                use(state.value2)
                effect(state, (state) => {
                    state.value1++
                    use(state.value3)
                })
            })

            state.value2 = 1
            await context.triggerReleasePromise
            state.value2 = 2
            await context.triggerReleasePromise

            assertEquals(state as State, { value1: 6, value2: 2, value3: 0 })
        })

        it("triggering inner effect does not double trigger outer effect", async () => {
            const { state, context } = reactiveWithContext({ value1: 1, value2: 1, value3: 1 } satisfies State)

            effect(state, (state) => {
                state.value1 += state.value2
                effect(state, (state) => {
                    state.value1 += state.value3
                })
            })

            state.value3 = 2
            await context.triggerReleasePromise
            state.value3 = 3
            await context.triggerReleasePromise

            assertEquals(state as State, { value1: 8, value2: 1, value3: 3 })
        })
    })

    describe("nested state", () => {
        type State = { foo: { bar: string } }
        it("updating nested property triggers parent effect", async () => {
            const { state, context } = reactiveWithContext({ foo: { bar: "baz" } } satisfies State)

            const calls: string[] = []
            effect(state, (state) => {
                calls.push(state.foo.bar)
            })

            state.foo.bar = "qux"
            await context.triggerReleasePromise

            assertEquals(calls, ["baz", "qux"])
        })

        it("updating nested property triggers inner effect but not outer effect", async () => {
            const { state, context } = reactiveWithContext({ foo: { bar: "baz" } } satisfies State)

            const calls: string[] = []
            effect(state, (state) => {
                effect(state.foo, () => {
                    calls.push(state.foo.bar)
                })
            })

            state.foo.bar = "qux"
            await context.triggerReleasePromise

            assertEquals(calls, ["baz", "qux"])
        })

        it("nested prop used in nested effects doesn't double trigger inner effect on change", async () => {
            const { state, context } = reactiveWithContext({ foo: { bar: "baz" } } satisfies State)

            const calls: string[] = []
            effect(state, (state) => {
                use(state.foo.bar)
                effect(state.foo, () => {
                    calls.push(state.foo.bar)
                })
            })

            state.foo.bar = "qux"
            await context.triggerReleasePromise

            assertEquals(calls, ["baz", "qux"])
        })
    })
})

/** placeholder for using some value, to avoid linter warnings */
function use(_: unknown) {}
