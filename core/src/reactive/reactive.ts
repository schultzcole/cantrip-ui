import type { Reactiveable, ReactiveableArray, ReactiveableRecord, StateFunc } from "./reactive-types.ts"
import ReactiveContext from "./reactive-context.ts"

const ReactiveTag = Symbol("ReactiveTag")

/**
 * A type that has been made reactive and is tagged with a ReactiveContext
 */
export type ReactiveTagged<TState extends Reactiveable> = TState & {
    [ReactiveTag]: ReactiveContext<TState>
}

export type ReactiveTaggedWithContext<TState extends Reactiveable> = {
    state: ReactiveTagged<TState>
    context: ReactiveContext<TState>
}

/**
 * Converts the given state object to a reactive state object. When the object is mutated, {@link effect}s bound to the
 * mutated properties will be re-executed.
 * @param state the state object that should become reactive
 * @return the given state, tagged with a reactive context
 */
export function reactive<TState extends Reactiveable>(state: TState): ReactiveTagged<TState> {
    return reactiveWithContext(state).state
}

/**
 * Converts the given state object to a reactive state object. When the object is mutated, {@link effect}s bound to the
 * mutated properties will be re-executed.
 * @param state the state object that should become reactive
 * @return an object containing the given state tagged with a reactive context as well as the context itself.
 */
export function reactiveWithContext<TState extends Reactiveable>(state: TState): ReactiveTaggedWithContext<TState> {
    const existingContext = getReactiveContext(state)
    if (existingContext) return { state: state as ReactiveTagged<TState>, context: existingContext }

    // SAFETY: `as` is safe here because we're adding the reactive tag below, before it'll be needed
    const reactiveState = state as ReactiveTagged<TState>

    let proxy: ReactiveTagged<TState>
    if (isReactiveableRecord(reactiveState)) {
        proxy = new Proxy(
            // SAFETY: `as` is safe here because we've just verified that reactiveState is a ReactiveableRecord.
            //         This cast widens the type to match the generic proxy handler
            reactiveState as ReactiveTagged<ReactiveableRecord>,
            recordProxyHandler,
        ) as ReactiveTagged<TState> // SAFETY: `as` is safe here we're re-narrowing to the original type.
    } else if (isReactiveableArray(reactiveState)) {
        proxy = new Proxy(
            // SAFETY: as is safe here because we've just verified that reactiveState is a ReactiveableArray.
            reactiveState as unknown as ReactiveTagged<ReactiveableArray>,
            arrayProxyHandler,
        ) as unknown as ReactiveTagged<TState>
    } else {
        throw new Error("given state is not reactiveable")
    }
    const context = new ReactiveContext<TState>(proxy)
    Object.defineProperty(state, ReactiveTag, {
        enumerable: false,
        configurable: false,
        writable: false,
        value: context,
    })

    return { state: proxy, context }
}

function bindProp<TState extends Reactiveable>(state: TState, prop: keyof TState, value: TState[keyof TState]) {
    // SAFETY: `!` is safe because the only way this proxy handler can be called is on a reactive object
    const context = getReactiveContext(state)!
    if (isReactiveable(value)) {
        // If this child value is also an object, make it reactive too
        value = reactive(value)
        state[prop] = value
        // SAFETY: `as` is safe here because value must be reactiveable at this point
        getReactiveContext(value as Reactiveable)
            // SAFETY: `as` is safe here because the child context doesn't care what type the parent context is
            ?.registerParentContext(context as ReactiveContext<Reactiveable>, prop)
    }

    context.notifyPropGet(prop.toString())
    return value
}

function notifyProp<TState extends Reactiveable>(
    state: TState,
    prop: keyof TState,
    oldValue: TState[keyof TState],
) {
    const context = getReactiveContext(state)!
    if (isReactiveable(oldValue)) {
        // SAFETY: `as` is safe here because the child context doesn't care what type the parent context is
        getReactiveContext(oldValue)?.deregisterParentContext(context as ReactiveContext<Reactiveable>)
    }
    context.notifyPropSet(prop.toString())
}

const recordProxyHandler: ProxyHandler<ReactiveableRecord> = {
    get(state, prop, proxy) {
        const value = Reflect.get(state, prop, proxy)
        if (prop === ReactiveTag) return value

        return bindProp(state, prop, value)
    },

    set(state, prop, newValue, proxy) {
        const oldValue = state[prop]
        const result = Reflect.set(state, prop, newValue, proxy)
        if (prop === ReactiveTag) return result

        if (oldValue !== newValue) {
            notifyProp(state, prop, oldValue)
        }

        return result
    },
}

const arrayProxyHandler: ProxyHandler<ReactiveTagged<ReactiveableArray>> = {
    get(state, prop, proxy) {
        const value = Reflect.get(state, prop, proxy)
        if (!Object.getOwnPropertyDescriptor(state, prop)?.writable) return value
        if (prop === ReactiveTag) return value

        return bindProp(state, prop as keyof typeof state, value)
    },

    set(state, prop, newValue, proxy) {
        const oldValue = state[prop as keyof typeof state]
        const result = Reflect.set(state, prop, newValue, proxy)
        if (prop === ReactiveTag) return result

        // for prop `length`, oldValue has already been updated by this point, so oldValue will always equal newValue.
        // thus, if `length` is being set, always notify.
        if (oldValue !== newValue || prop === "length") {
            notifyProp(state, prop as keyof typeof state, oldValue)
        }

        return result
    },
}

/**
 * Configuration for an effect
 */
export type EffectConfig = {
    /** An abort signal to cancel the effect */
    abortSignal?: AbortSignal
}

/**
 * Registers an effect with the given state object. When properties of the state object that are used within this effect
 * are mutated, the effect will re-execute with the updated values.
 * @param state the state over which this effect is reactive
 * @param func the function to execute in response to mutations
 * @param config configuration for the effect
 */
export function effect<TState extends Reactiveable>(
    state: TState | ReactiveTagged<TState>,
    func: StateFunc<TState>,
    config?: EffectConfig,
): void {
    const context = Reflect.get(state, ReactiveTag)
    if (context instanceof ReactiveContext) {
        context.capture(func, config)
    } else {
        const _ = func(state)
    }
}

/**
 * Returns whether the given t is eligible to be made reactive
 * @param t
 */
export function isReactiveable<T>(t: T): t is T & Reactiveable {
    return isReactiveableRecord(t) || isReactiveableArray(t)
}

/**
 * Returns whether the given t is a reactiveable array
 * @param t
 */
function isReactiveableArray<T>(t: T): t is T & ReactiveableArray {
    return Array.isArray(t)
}

/**
 * Returns whether the given t is a reactiveable record
 * @param t
 */
function isReactiveableRecord<T>(t: T): t is T & ReactiveableRecord {
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
