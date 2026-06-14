import type { Reactiveable, StateFunc } from "./reactive-types.ts"
import type { EffectConfig, ReactiveTagged } from "./reactive.ts"

type EffectId = number & { __tag: EffectId }
type Effect<TState extends Reactiveable> = {
    effectId: EffectId
    func: StateFunc<TState>
    bindings?: Set<keyof TState>
    children?: EffectId[]
}

type Trigger<TState extends Reactiveable> = {
    prop: keyof TState
    sourceEffects: Set<EffectId | null>
}

type ParentContext = ReactiveContext<unknown & Reactiveable>

export default class ReactiveContext<TState extends Reactiveable> {
    private readonly _parentContexts: Map<ParentContext, PropertyKey> = new Map()

    private _nextEffectId: EffectId = 0 as EffectId
    private readonly _effectStack: EffectId[] = []
    private readonly _effectRegistry: Map<EffectId, Effect<TState>> = new Map()
    private readonly _rootEffects: EffectId[] = []

    private readonly _triggerQueue: Trigger<TState>[] = []

    constructor(private readonly proxiedState: ReactiveTagged<TState>) {}

    registerParentContext(parentContext: ParentContext, parentProp: PropertyKey): void {
        this._parentContexts.getOrInsert(parentContext, parentProp)
    }

    deregisterParentContext(parentContext: ParentContext): void {
        this._parentContexts.delete(parentContext)
    }

    private get emptyStack(): boolean {
        return !this._effectStack.length
    }

    private get topEffect(): Effect<TState> | undefined {
        if (this.emptyStack) return undefined
        return this._effectRegistry.get(this._effectStack[this._effectStack.length - 1])
    }

    /**
     * Captures an effect, recording any bindings between that effect and state properties used during that effect's
     * execution.
     */
    capture(func: StateFunc<TState>, config?: EffectConfig): void {
        config?.abortSignal?.throwIfAborted()

        const parentEffect = this.topEffect

        if (!parentEffect) {
            // If our stack is empty, but a parent context's stack is not empty, capture this effect on the parent
            let foundParent = false
            for (const [parentContext, parentProp] of this._parentContexts) {
                // SAFETY: `as` is safe because by definition, the parent state must be an object that has a property
                //         called parentProp with the type TState.
                const typedParentContext = parentContext as ReactiveContext<{ [key: typeof parentProp]: TState }>
                if (!typedParentContext.emptyStack) {
                    typedParentContext.capture((parentState) => func(parentState[parentProp]))
                    foundParent = true
                }
            }
            if (foundParent) return
        }

        // SAFETY: `as` is safe because EffectId is an illusion anyway
        const effect = { effectId: this._nextEffectId++ as EffectId, func }
        config?.abortSignal?.addEventListener("abort", (_) => this.abortEffect(effect.effectId))

        this._effectRegistry.set(effect.effectId, effect)

        if (parentEffect) {
            parentEffect.children ??= []
            parentEffect.children.push(effect.effectId)
        } else {
            this._rootEffects.push(effect.effectId)
        }

        this._effectStack.push(effect.effectId)
        try {
            func(this.proxiedState)
        } finally {
            this._effectStack.pop()
        }

        // If there's no parent effect, there must not be anything in the effect stack now,
        // so release the triggers in the queue
        if (!parentEffect) {
            this.releaseQueuedTriggers()
        }
    }

    /**
     * Called when a property on the state for this context is retrieved.
     * If there are any current effects being executed, create a binding for that effect to this property.
     * @param prop
     */
    notifyPropGet<TKey extends keyof TState>(prop: TKey): void {
        const currentEffect = this.topEffect
        if (!currentEffect) {
            // We're not capturing any effects, but maybe our parents are
            for (const [parentContext, parentProp] of this._parentContexts) {
                if (!parentContext.emptyStack) {
                    parentContext.notifyPropGet(`${parentProp.toString()}.${prop.toString()}`)
                }
            }
            return
        }

        currentEffect.bindings ??= new Set()
        currentEffect.bindings.add(prop)
    }

    /**
     * Called when a property on the state for this context is modified.
     * Enqueues the change trigger, and there isn't a current effect being executed, "release" the change triggers
     * to call the effects bound to them.
     */
    notifyPropSet<TKey extends keyof TState>(prop: TKey): void {
        for (const [parentContext, parentProp] of this._parentContexts) {
            parentContext.notifyPropSet(`${parentProp.toString()}.${prop.toString()}`)
        }

        const currentEffect = this.topEffect
        const sourceEffectId = currentEffect?.effectId ?? null

        // Ensure this trigger is in the queue
        let trigger = this._triggerQueue.find((n) => n.prop === prop)
        if (trigger) {
            // if the trigger is already in the queue, add the current effect as a source to the existing trigger...
            trigger.sourceEffects.add(sourceEffectId)
        } else {
            // ...otherwise, push a new trigger onto the queue
            trigger = { prop, sourceEffects: new Set() }
            trigger.sourceEffects.add(sourceEffectId)
            this._triggerQueue.push(trigger)
        }

        // If there's no current effect, the effect stack is empty, so release the triggers in the queue
        if (!currentEffect) {
            this.releaseQueuedTriggers()
        }
    }

    /** Loops through the trigger queue, releasing each trigger in the order they were queued in */
    private releaseQueuedTriggers(): void {
        const alreadyReleased = new Set<keyof TState>()
        while (this._triggerQueue.length) {
            const trigger = this._triggerQueue[0]

            // infinite loop mitigation: only release this trigger if we haven't already released one for the same prop.
            if (!alreadyReleased.has(trigger.prop)) {
                this.releaseTrigger(trigger)
                alreadyReleased.add(trigger.prop)
            }
            this._triggerQueue.shift()
        }
    }

    /** "Releases" a trigger, calling effects that are bound to the trigger's property */
    private releaseTrigger(trigger: Trigger<TState>): void {
        const { prop, sourceEffects } = trigger

        // traverse the tree depth-first, searching for effects that are bound to this property
        const inner = (effectIds: Iterable<EffectId>) => {
            for (const effectId of effectIds) {
                const effect = this._effectRegistry.get(effectId)
                if (!effect) throw new Error(`Effect ${effectId} could not be found in the registry`)

                this._effectStack.push(effectId)
                try {
                    if (effect.bindings?.has(prop)) {
                        // if all the sources of this trigger are descendants of this effect, don't trigger this effect
                        if (this.allIdsAreDescendants(sourceEffects, effectId)) continue

                        // clear existing bindings because the new run of the func might result in different bindings
                        effect.bindings.clear()

                        // remove descendants from the registry because the new run of the func will re-capture
                        // descendant effects
                        for (const descendant of this.descendants(effectId, false)) {
                            this._effectRegistry.delete(descendant.effectId)
                        }
                        if (effect.children) {
                            effect.children.length = 0
                        }

                        // directly call the func instead of using `capture` because we don't need to re-register
                        // this effect and we're managing the effect stack here.
                        effect.func(this.proxiedState)
                    } else if (effect.children?.length) {
                        // this effect is not bound to this property, but it has children, so check them.
                        inner(effect.children)
                    }
                } finally {
                    this._effectStack.pop()
                }
            }
        }

        inner(this._rootEffects)
    }

    private abortEffect(effectId: EffectId): void {
        const effect = this._effectRegistry.get(effectId)
        if (!effect) return

        for (const descendant of this.descendants(effectId, false)) {
            this._effectRegistry.delete(descendant.effectId)
        }
        if (effect.children) {
            effect.children.length = 0
        }

        this._effectRegistry.delete(effectId)
    }

    /** Determines if all the given effectIds are descendants of the given ancestorID */
    private allIdsAreDescendants(effectIds: Set<EffectId | null>, ancestorId: EffectId): boolean {
        // null id cannot be a descendant
        if (effectIds.has(null)) return false

        // root ids that are not the current id cannot be a descendant
        for (const rootEffectId of this._rootEffects) {
            if (rootEffectId !== ancestorId && effectIds.has(rootEffectId)) return false
        }

        const copy = new Set(effectIds)
        copy.delete(null)

        // remove descendants from the set
        for (const descendant of this.descendants(ancestorId, true)) {
            copy.delete(descendant.effectId)

            // if there's nothing left in the set, then all ids in the original set must have been descendants
            if (copy.size === 0) return true
        }

        return false
    }

    /** Iterates through all descendants of the given effect in depth-first order */
    private *descendants(effectId: EffectId, includeSelf: boolean = false): Iterable<Effect<TState>> {
        const effect = this._effectRegistry.get(effectId)
        if (!effect) throw new Error(`Could not find effect: ${effectId}`)

        if (includeSelf) yield effect

        if (effect.children?.length) {
            for (const childId of effect.children) {
                yield* this.descendants(childId, true)
            }
        }
    }
}
