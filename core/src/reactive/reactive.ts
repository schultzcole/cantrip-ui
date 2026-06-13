import type { Reactiveable, StateFunc } from "./reactive-types.ts"
import ReactiveContext from "./reactive-context.ts"

const ReactiveTag = Symbol("ReactiveTag")

/**
 * A type that has been made reactive and is tagged with a ReactiveContext
 */
export type ReactiveTagged<TState extends Reactiveable> = TState & {
    [ReactiveTag]: ReactiveContext<TState>
}

/**
 * Converts the given state object to a reactive state object.
 * @param state
 * @return the given state, tagged with a reactive context.
 */
export function reactive<TState extends Reactiveable>(state: TState): ReactiveTagged<TState> {
    // SAFETY: `as` is safe here because we've already proved state has a reactive context
    if (isReactive(state)) return state

    // SAFETY: `as` is safe here because we're immediately adding the reactive context afterward
    const reactiveState = state as ReactiveTagged<TState>

    const proxy = new Proxy<ReactiveTagged<TState>>(
        reactiveState,
        {
            get<TKey extends keyof TState>(state: ReactiveTagged<TState>, prop: TKey, proxy: TState): TState[TKey] {
                let value = Reflect.get(state, prop, proxy)
                if (prop === ReactiveTag) return value

                const context = state[ReactiveTag]
                if (isReactiveable(value)) {
                    // If this child value is also an object, make it reactive too
                    value = reactive(value)
                    state[prop] = value
                    // SAFETY: `as` is safe here because value must be reactiveable at this point
                    getReactiveContext(value as Reactiveable)
                        // SAFETY: `as` is safe here because the child context doesn't care what type the parent context is
                        ?.registerParentContext(context as ReactiveContext<Reactiveable>, prop)
                }

                context.notifyPropGet(prop)

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
                    const context = state[ReactiveTag]

                    // If old value has a reactive context, remove this reactive context as a parent
                    if (isReactiveable(oldValue)) {
                        // SAFETY: `as` is safe here because the child context doesn't care what type the parent context is
                        getReactiveContext(oldValue)?.deregisterParentContext(context as ReactiveContext<Reactiveable>)
                    }

                    // Then notify this context that the property changed
                    context.notifyPropSet(prop)
                }
                return result
            },
        },
    )
    const context = new ReactiveContext<TState>(proxy)
    Object.defineProperty(reactiveState, ReactiveTag, {
        enumerable: false,
        configurable: false,
        writable: false,
        value: context,
    })

    return proxy
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
        context.capture(func)
    } else {
        func(state)
    }
}

/**
 * Returns whether the given t is eligible to be made reactive
 * @param t
 */
export function isReactiveable<T>(t: T): t is T & Reactiveable {
    return isPojo(t)
}

/**
 * Returns whether the given t is a plain record
 * @param t
 */
function isPojo<T>(t: T): t is T & Record<PropertyKey, unknown> {
    return Boolean(typeof t === "object" && t && (t.constructor == null || t.constructor === Object))
}

/**
 * Returns true if the given t is ReactiveTagged
 */
export function isReactive<T extends Reactiveable>(t: T): t is ReactiveTagged<T> {
    return ReactiveTag in t && t[ReactiveTag] instanceof ReactiveContext
}

/**
 * Returns the reactive context of a given ReactiveTagged object, or null if the given object is not ReactiveTagged
 */
export function getReactiveContext<TState extends Reactiveable>(t: TState): ReactiveContext<TState> | null {
    if (!(ReactiveTag in t)) return null
    const context = t[ReactiveTag]
    if (context instanceof ReactiveContext) {
        return context
    } else {
        return null
    }
}
