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
    reactiveState[ReactiveTag] = context

    return new Proxy<ReactiveTagged<TState>>(
        reactiveState,
        {
            get<TKey extends keyof TState>(target: TState, prop: TKey, receiver: TState): TState[TKey] {
                const value = Reflect.get(target, prop, receiver)
                if (prop === ReactiveTag) return value

                context.bindCurrentEffect(prop, value)
                return value
            },

            set<TKey extends keyof TState>(
                target: TState,
                prop: TKey,
                newValue: TState[TKey],
                receiver: TState,
            ): boolean {
                const result = Reflect.set(target, prop, newValue, receiver)
                if (prop === ReactiveTag) return result

                context.enqueuePropChange(receiver, prop, newValue)
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
        // SAFETY: `as` is safe here because we've already proved state has a reactive context
        context.capture(state, func)
    } else {
        func(state)
    }
}
