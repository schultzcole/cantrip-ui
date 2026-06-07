import type { WritableKeysOf } from "type-fest"
import type HtmlBuilder from "../html/html-builder.ts"

/** Returns all keys of T where T[K] is not a function */
export type NonFunctionKeysOf<T> = Exclude<
    {
        // deno-lint-ignore ban-types -- *any* function or class
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

/** A component function */
export type Component<TRootBuilder extends HtmlBuilder> = (
    root: TRootBuilder,
    // deno-lint-ignore no-explicit-any -- allow any params for component types
    ...args: any[]
) => void

/** Extracts the non-HtmlBuilder params of the given component function */
// deno-lint-ignore no-explicit-any -- Don't care about root builder type; just want the type of the rest of the args
export type ComponentParameters<T extends Component<any>> = T extends (root: any, ...args: infer TArgs) => void ? TArgs
    : never
