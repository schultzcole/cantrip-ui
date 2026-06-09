import type { Reactiveable, StateFunc } from "./reactive-types.ts"
import ReactiveContext from "./reactive-context.ts"

const ReactiveTag = Symbol("ReactiveTag")

/**
 * A type that has been made reactive and is tagged with a ReactiveContext
 */
type ReactiveTagged<TState extends Reactiveable> = TState & {
    [ReactiveTag]: ReactiveContext<TState>
}

/**
 * Converts the given state object to a reactive state object.
 * @param state
 * @return the given state, tagged with a reactive context.
 */
export function reactive<TState extends Reactiveable>(state: TState): ReactiveTagged<TState> {
    // SAFETY: `as` is safe here because we've already proved state has a reactive context
    if (state[ReactiveTag] instanceof ReactiveContext) return state as ReactiveTagged<TState>

    // SAFETY: `as` is safe here because we're immediately adding the reactive context afterward
    const reactiveState = state as ReactiveTagged<TState>
    const context = new ReactiveContext<TState>()
    Object.defineProperty(reactiveState, ReactiveTag, {
        enumerable: false,
        configurable: false,
        writable: false,
        value: context,
    })

    return new Proxy<ReactiveTagged<TState>>(
        reactiveState,
        {
            get<TKey extends keyof TState>(state: ReactiveTagged<TState>, prop: TKey, proxy: TState): TState[TKey] {
                const value = Reflect.get(state, prop, proxy)
                if (prop === ReactiveTag) return value

                state[ReactiveTag].notifyPropGet(prop)
                return value
            },

            set<TKey extends keyof TState>(
                state: ReactiveTagged<TState>,
                prop: TKey,
                newValue: TState[TKey],
                proxy: TState,
            ): boolean {
                const oldValue = state[prop]

                const result = Reflect.set(state, prop, newValue, proxy)
                if (prop === ReactiveTag) return result

                if (oldValue !== newValue) {
                    state[ReactiveTag].notifyPropSet(proxy, prop)
                }
                return result
            },
        },
    )
}

/**
 * @param state
 * @param func
 */
export function effect<TState extends Reactiveable>(
    state: TState | ReactiveTagged<TState>,
    func: StateFunc<TState>,
): void {
    const context = Reflect.get(state, ReactiveTag)
    if (context instanceof ReactiveContext) {
        context.capture(state, func)
    } else {
        func(state)
    }
}
