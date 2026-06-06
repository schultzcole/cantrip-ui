import type { Reactiveable, StateFunc } from "./reactive-types.ts"

type EffectId = number & { __tag: EffectId }

type BindingMap<TState extends Reactiveable> = Map<keyof TState, PropBinding<TState, keyof TState>>

type PropBinding<TState extends Reactiveable, TKey extends keyof TState> = {
    lastValue: TState[TKey]
    // Stores each effect bound to this property, as well as
    effectBindings?: Map<EffectId, EffectBinding>
}

type EffectBinding = {
    effectId: EffectId
    bound: boolean
    boundDescendants?: Set<EffectId>
}

type Trigger<TState extends Reactiveable, TKey extends keyof TState> = {
    state: TState
    prop: TKey
    value: TState[TKey]
}

export default class ReactiveContext<TState extends Reactiveable> {
    private _nextEffectId: EffectId = 0 as EffectId
    private readonly _effectRegistry: Map<EffectId, StateFunc<TState>> = new Map()
    private readonly _propBindings: BindingMap<TState> = new Map()

    private readonly _effectStack: EffectId[] = []

    private readonly _queuedTriggers: Trigger<TState, keyof TState>[] = []

    private get stackEmpty() {
        return this._effectStack.length === 0
    }

    private get currentEffectId(): EffectId | undefined {
        return this._effectStack[this._effectStack.length - 1]
    }

    capture(state: TState, func: StateFunc<TState>) {
        this.innerCapture(state, func)

        // If this was the "root" capture, notify effects of any changes that have been queued
        while (this._queuedTriggers.length) {
            // SAFETY: `!` is safe because we just checked length
            const trigger = this._queuedTriggers.shift()!
            this.triggerPropEffects(trigger)
        }
    }

    private innerCapture(state: TState, func: StateFunc<TState>) {
        const effectId = this._nextEffectId++ as EffectId
        this._effectRegistry.set(effectId, func)
        this._effectStack.push(effectId)
        try {
            func(state)
        } finally {
            this._effectStack.pop()

            // If the captured effect was not bound, clean up by removing it from the registry
            let bound = false
            for (const [_, { effectBindings }] of this._propBindings) {
                if (!effectBindings) continue
                const binding = effectBindings.get(effectId)
                if (!binding) continue
                if (binding.bound) {
                    bound = true
                } else {
                    effectBindings.delete(effectId)
                }
            }
            if (!bound) {
                this._effectRegistry.delete(effectId)
            }
        }
    }

    bindCurrentEffect<TKey extends keyof TState>(prop: TKey, currentValue: TState[TKey]): void {
        // if we don't currently have any effects captured, nothing to bind
        const currentEffectId = this.currentEffectId
        if (currentEffectId === undefined) return

        // If there are any existing bindings for this prop, check if any of them belong to an ancestor or descendant of us
        const effectBindings = this._propBindings.get(prop)?.effectBindings
        if (effectBindings?.size) {
            for (let i = this._effectStack.length - 1; i >= 0; i--) {
                const stackElement = this._effectStack[i]
                const stackBinding = effectBindings.get(stackElement)
                if (stackBinding?.bound) {
                    // There is already a binding for this prop for an ancestor of the current effect, don't need to bind
                    return
                }
            }

            // if any of the current effect's descendants are already registered for the same prop, unregister them
            const descendants = effectBindings.get(currentEffectId)?.boundDescendants
            if (descendants?.size) {
                for (const descendant of descendants) {
                    if (effectBindings.has(descendant)) {
                        effectBindings.delete(descendant)
                        descendants.delete(descendant)
                    }
                }
            }
        }

        this.bindEffect(prop, currentEffectId, currentValue)
    }

    enqueuePropChange<TKey extends keyof TState>(state: TState, prop: TKey, newValue: TState[TKey]): void {
        const trigger = { state, prop, value: newValue }
        if (this.stackEmpty) {
            this.triggerPropEffects(trigger)
        } else {
            const existingIndex = this._queuedTriggers.findIndex((trigger) => trigger.prop === prop)
            if (existingIndex >= 0) {
                this._queuedTriggers[existingIndex] = trigger
            } else {
                this._queuedTriggers.push(trigger)
            }
        }
    }

    triggerPropEffects<TKey extends keyof TState>(trigger: Trigger<TState, TKey>): void {
        const propBinding = this._propBindings.get(trigger.prop)
        if (!propBinding) return

        const { lastValue, effectBindings } = propBinding

        if (lastValue === trigger.value) return
        if (!effectBindings) return
        propBinding.effectBindings = undefined

        for (const [effectId, { bound, boundDescendants }] of effectBindings) {
            if (!bound) throw new Error("How did an unbound effect binding get here!?")
            if (boundDescendants?.size) throw new Error("How did an effect with bound descendants get here!?")

            // SAFETY: `!` is safe here because in order for an effect to be bound, it must be in the registry
            const func = this._effectRegistry.get(effectId)!
            this._effectRegistry.delete(effectId)
            this.innerCapture(trigger.state, func)
        }
    }

    private bindEffect<TKey extends keyof TState>(prop: TKey, effectId: EffectId, value: TState[TKey]) {
        // add effect to bindings for prop
        const propBinding = this._propBindings.getOrInsertComputed(prop, (_) => ({ lastValue: value }))
        propBinding.lastValue = value
        propBinding.effectBindings ??= new Map()
        const exisingBinding = propBinding.effectBindings.getOrInsertComputed(
            effectId,
            (_) => ({ effectId, bound: true }),
        )
        exisingBinding.bound = true

        // add effect as a bound descendant of all ancestors
        if (this._effectStack.length > 1) {
            for (let i = this._effectStack.length - 2; i >= 0; i--) {
                const stackElement = this._effectStack[i]
                const effectBinding = propBinding.effectBindings.getOrInsertComputed(
                    stackElement,
                    (_) => ({ effectId, bound: false }),
                )
                effectBinding.boundDescendants ??= new Set()
                effectBinding.boundDescendants.add(effectId)
            }
        }
    }
}
