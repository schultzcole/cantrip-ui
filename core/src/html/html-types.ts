import type { AnyData, OmitFunctions, OmitReadonly } from "../util/types.js"

/** An HTML element type string (lowercase) */
export type HtmlTag = keyof HTMLElementTagNameMap

/** Returns the HTMLElement type for the given {@link HtmlTag} */
export type HtmlElement<TTag extends HtmlTag> = HTMLElementTagNameMap[TTag]

/** An HTML event key */
export type HtmlEventType = keyof GlobalEventHandlersEventMap

/** Returns the type of a listener function for the given HTML event */
export type HtmlEventTypeListener<T extends HtmlEventType, TElement extends EventTarget> = HtmlEventListener<
    GlobalEventHandlersEventMap[T],
    TElement
>

/** Returns the type of a listener for a generic event */
export type HtmlEventListener<TEvent extends Event, TElement extends EventTarget> = (
    evt: TEvent & { currentTarget: TElement },
) => void

/** Returns a type of the valid HTML attributes for the given element */
export type HtmlElementAttrs<TElement extends HTMLElement> = {
    [K in keyof TElement as TElement[K] extends Function ? never : K]?: TElement[K] | AnyData
}

/** Returns a type of the valid HTML attributes for the given tag */
export type HtmlTagAttrs<TTag extends HtmlTag> = HtmlElementAttrs<HtmlElement<TTag>>

/** Valid CSS attributes */
export type CssAttrs = OmitReadonly<OmitFunctions<CSSStyleDeclaration>>

/** Data attributes object */
export type DataAttrs = Record<string, AnyData>
