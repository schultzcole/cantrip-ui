export type ReactiveableRecord = Record<PropertyKey, unknown>
export type ReactiveableArray = Array<unknown>

export type Reactiveable =
    | ReactiveableRecord
    | ReactiveableArray

export type StateFunc<TState extends Reactiveable> = (state: TState) => void
