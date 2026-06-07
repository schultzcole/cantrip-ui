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

    it("recursive effect is called once", () => {
        const state = reactive({ value: 1 })

        effect(state, (state) => state.value += 1)

        assertEquals(state.value, 2)
    })

    describe("nested effects", () => {
        it("inner func called when state changes", () => {
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

        it("outer func does not get called again if it does not use any changed props", () => {
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

        it("both funcs get called once when both use changed prop when outer func uses prop first", () => {
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

        it("both funcs get called once when both use changed prop when outer func uses prop last", () => {
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

        it("when both funcs change state when outer func changes state first", () => {
            const state = reactive({ value: 1 })

            effect(state, (state) => {
                state.value += 1
                effect(state, (state) => {
                    state.value += 1
                })
            })

            assertEquals(state.value, 3)
        })

        it("when both funcs change state when outer func changes state last", () => {
            const state = reactive({ value: 1 })

            effect(state, (state) => {
                effect(state, (state) => {
                    state.value += 1
                })
                state.value += 1
            })

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
        it("do not create an infinite loop if they are not compounding and first effect is triggered", () => {
            const unreactive = { celsius: 0, fahrenheit: 32 } satisfies Temps
            const state = reactive(unreactive)
            const calls: string[] = []

            // non-"compounding" effects. When either celsius or fahrenheit change, state settles into a steady state
            effect(state, (state) => computeCelsius(state, calls))
            effect(state, (state) => computeFahrenheit(state, calls))

            state.celsius = -40

            // effect calls computeCelsius | set celcius { celsius: 0, fahrenheit: 32 }; stack: []
            //  - trigger: none
            // effect calls computeFahrenheit | set fahrenheit { celsius: 0, fahrenheit: 32 }; stack: []
            //  - trigger: none, fahrenheit didn't change
            // set celsius { celsius: -40, fahrenheit: 32 }; stack: []
            //  - trigger: computeFahrenheit | set fahrenheit { celsius: -40, fahrenheit: -40 }; stack: [celsius]
            //    - trigger: computeCelsius | set celsius { celsius: -40, fahrenheit: -40 }; stack: [celsius, fahrenheit]
            //      - trigger: none, celcius is already on the stack

            assertEquals(calls, ["computeCelsius", "computeFahrenheit", "computeFahrenheit", "computeCelsius"])
        })

        it("do not create an infinite loop if they are not compounding and second effect is triggered", () => {
            const state = reactive({ celsius: 0, fahrenheit: 32 } satisfies Temps)
            const calls: string[] = []

            // non-"compounding" effects. When either celsius or fahrenheit change, state settles into a steady state
            effect(state, (state) => computeCelsius(state, calls))
            effect(state, (state) => computeFahrenheit(state, calls))

            state.fahrenheit = -40

            // effect calls computeCelsius | set celcius { celsius: 0, fahrenheit: 32 }; stack: []
            //  - trigger: none
            // effect calls computeFahrenheit | set fahrenheit { celsius: 0, fahrenheit: 32 }; stack: []
            //  - trigger: none, fahrenheit didn't change
            // set fahrenheit { celsius: 0, fahrenheit: -40 }; stack: []
            //  - trigger: computeCelsius | set celsius { celsius: -40, fahrenheit: -40 }; stack: [fahrenheit]
            //    - trigger: computeFahrenheit | set fahrenheit { celsius: -40, fahrenheit: -40 }; stack: [fahrenheit, celsius]
            //      - trigger: none, fahrenheit is already on the stack

            assertEquals(calls, ["computeCelsius", "computeFahrenheit", "computeCelsius", "computeFahrenheit"])
        })

        it("do not create an infinite loop if they are compounding", () => {
            type Values = { value1: number; value2: number }
            const state = reactive({ value1: 0, value2: 0 })

            const updateValue1 = (state: Values) => state.value1 = state.value2 + 1
            const updateValue2 = (state: Values) => state.value2 = state.value1 + 1

            // "compounding" effects. When either value1 or value2 change, the state continually updates forever
            effect(state, updateValue1)
            effect(state, updateValue2)

            // - effect calls updateValue1 | set value1 { value1: 1, value2: 0 }; stack: []
            //   - trigger: none
            // - effect calls updateValue2 | set value2 { value1: 1, value2: 2 }; stack: []
            //   - trigger: updateValue1 | set value1 { value1: 3, value2: 2 }; stack: [value2]
            //     - trigger: updateValue2 | set value2 { value1: 3, value2: 4 }; stack: [value2, value1]
            //       - trigger: none, value2 trigger is already on the stack

            assertEquals(
                { value1: state.value1, value2: state.value2 },
                { value1: 3, value2: 4 },
            )
        })
    })

    describe("dependent nested effects", () => {
        it("triggering outer effect does not double trigger inner effect", () => {
            const state = reactive({ value1: 1, value2: 1, value3: 1 })

            let innerCalls = 0
            effect(state, (state) => {
                state.value1 += state.value2
                effect(state, (state) => {
                    innerCalls++
                    state.value1 += state.value3
                })
            })

            state.value2 = 2
            state.value2 = 3

            assertEquals(innerCalls, 3)
            assertEquals(
                { value1: state.value1, value2: state.value2, value3: state.value3 },
                { value1: 10, value2: 3, value3: 1 },
            )
        })

        it("triggering inner effect does not double trigger outer effect", () => {
            const state = reactive({ value1: 1, value2: 1, value3: 1 })

            let innerCalls = 0
            effect(state, (state) => {
                state.value1 += state.value2
                effect(state, (state) => {
                    innerCalls++
                    state.value1 += state.value3
                })
            })

            state.value3 = 2
            state.value3 = 3

            assertEquals(innerCalls, 3)
            assertEquals(
                { value1: state.value1, value2: state.value2, value3: state.value3 },
                { value1: 8, value2: 1, value3: 3 },
            )
        })
    })
})

/** placeholder for using some value, to avoid linter warnings */
function use(_: unknown) {}
