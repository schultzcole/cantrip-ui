import type { WritableKeysOf } from "type-fest"
import type HtmlBuilder from "../html/html-builder"

/** Returns all keys of T where T[K] is not a function */
export type NonFunctionKeysOf<T> = Exclude<
    {
        [key in keyof T]: T[key] extends Function ? never : key
    }[keyof T],
    undefined
>

/** Returns T where properties of type function are omitted */
export type OmitFunctions<T> = Pick<T, NonFunctionKeysOf<T>>

/** Returns T where readonly propertys are omitted */
export type OmitReadonly<T extends object> = Pick<T, WritableKeysOf<T>>

/** A value that can be cooerced into an html attribute string */
export type AnyData = string | number | bigint | boolean | undefined | null

/** Either T or a function that takes no arguments and returns a T */
export type TOrFunc<T> = T | (() => T)

export type SyncComponent<TRootBuilder extends HtmlBuilder> = (root: TRootBuilder, ...args: any[]) => void
export type AsyncComponent<TRootBuilder extends HtmlBuilder> = (root: TRootBuilder, ...args: any[]) => Promise<void>

/** A component function */
export type Component<TRootBuilder extends HtmlBuilder> = SyncComponent<TRootBuilder> | AsyncComponent<TRootBuilder>

/** Extracts the non-HtmlBuilder params of the given component function */
export type ComponentParameters<T extends Component<any>> = Parameters<T> extends [any, ...infer TArgs] ? TArgs : never
