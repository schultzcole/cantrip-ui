export type ReactiveableRecord = Record<PropertyKey, unknown>
export type ReactiveableArray = Array<unknown>

export type Reactiveable =
    | ReactiveableRecord
    | ReactiveableArray

export type SyncStateFunc<TState extends Reactiveable> = (state: TState) => void
export type AsyncStateFunc<TState extends Reactiveable> = (state: TState) => Promise<void>
export type StateFunc<TState extends Reactiveable> = SyncStateFunc<TState> | AsyncStateFunc<TState>
