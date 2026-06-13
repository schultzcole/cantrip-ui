export type Reactiveable = Record<PropertyKey, unknown>
export type StateFunc<TState extends Reactiveable> = (state: TState) => void
