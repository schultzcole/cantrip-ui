import type { AnyData, Component, ComponentParameters } from "../util/types.ts"
import { html } from "./html-tagged-template.ts"
import type {
    CssAttrs,
    HtmlElement,
    HtmlElementAttrs,
    HtmlEventListener,
    HtmlEventType,
    HtmlEventTypeListener,
    HtmlTag,
} from "./html-types.ts"
import type { Reactiveable } from "../reactive/reactive-types.ts"
import { effect } from "../reactive/reactive.ts"

/**
 * Builder class for creating arbitrary HTML elements
 */
export default class HtmlBuilder<TTag extends HtmlTag = HtmlTag> {
    protected element: HtmlElement<TTag>
    protected document: Document
    constructor(public thisTag: TTag, document?: Document) {
        this.document = document ?? globalThis.document
        this.element = this.document.createElement(thisTag, {})
    }

    protected appendChild(node: Node) {
        if (this.element instanceof HTMLTemplateElement) {
            this.element.content.appendChild(node)
        } else {
            this.element.appendChild(node)
        }
    }

    attrs(attrs: Partial<HtmlElementAttrs<TTag>>): this {
        for (const [key, value] of Object.entries(attrs)) {
            this.attr(key as keyof HtmlElementAttrs<TTag> & string, value as AnyData)
        }

        return this
    }

    /**
     * Set a single arbitrary attribute on this element.
     * @param key the attribute key
     * @param value the value to set for the attribute
     */
    attr(key: string, value: AnyData): this

    /**
     * Set a single known attribute on this element.
     * @param key the attribute key
     * @param value the value to set for the attribute
     */
    attr(key: keyof HtmlElementAttrs<TTag> & string, value: AnyData): this

    attr(key: string, value: AnyData): this {
        if (key in this.element) {
            // Known attribute key
            // deno-lint-ignore no-explicit-any -- just let the element handle whatever gets passed
            this.element[key as keyof HtmlElement<TTag>] = value as any
        } else if (value != undefined) {
            // Unknown attribute key
            // deno-lint-ignore no-explicit-any -- just let the element handle whatever gets passed
            this.element.setAttribute(key, value as any)
        } else {
            this.element.removeAttribute(key)
        }
        return this
    }

    /**
     * Sets the given data attributes on this element.
     * Attribute names will be converted according to the `dataset` name conversion rules.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset#name_conversion
     * @param data the data attributes to add
     */
    data(data: Record<string, AnyData>): this

    /**
     * Sets a specific data attribute on this element.
     * The attribute name will be converted according to the `dataset` name conversion rules.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset#name_conversion
     * @param key the data attribute key to add
     * @param value the value to add to the dataset
     */
    data(key: string, value: AnyData): this

    data(keyOrObj: string | Record<string, AnyData>, value?: AnyData): this {
        if (typeof keyOrObj === "string") {
            this.element.dataset[keyOrObj] = stringify(value)
        } else {
            for (const [key, value] of Object.entries(keyOrObj)) {
                this.element.dataset[key] = stringify(value)
            }
        }
        return this
    }

    /** Adds the given class to this element. */
    class(className: string): this

    /** Adds the given class to this element if `force` is true */
    class(className: string, force: boolean): this

    class(className: string, force?: boolean): this {
        force ??= true
        this.element.classList.toggle(className, force)
        return this
    }

    /**
     * Set the given inline css styles on this element.
     * Style keys will be converted according to the normal style conversion rules.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style
     * @param styles the styles to add
     */
    style(styles: Partial<CssAttrs>): this {
        Object.assign(this.element.style, styles)
        return this
    }

    /**
     * Sets the given css on this element.
     * This will do no conversion of property keys (unlike {@link style}), so it is appropriate for custom css properties.
     * @param props the css properties to add
     */
    css(props: Record<string, string>): this {
        this.element.style.webkitTextStroke
        for (const [key, value] of Object.entries(props)) {
            this.element.style.setProperty(key, value)
        }
        return this
    }

    /**
     * Append the given text to this element.
     * @param text the string to add to this element content
     */
    appendText(text: string): this {
        const node = this.document.createTextNode(text)
        this.appendChild(node)
        return this
    }

    /**
     * Replace the content of this element with the given text.
     * @param text
     */
    text(text: string): this {
        const node = this.document.createTextNode(text)
        this.element.replaceChildren(node)
        return this
    }

    /**
     * Append the given html to this element.
     * Use with caution. Make sure the source of the html is trusted. No sanitization is applied to the incoming html string.
     * @param html the html to append to this element
     */
    appendHtml(html: string): this

    /**
     * Append the given html tagged template literal to this element.
     * Use with caution. Make sure the source of the html is trusted. No sanitization is applied to the incoming html string.
     *
     * @example
     * ```ts
     * builder.appendHtml`<strong>Some HTML content!</strong>`
     * ```
     */
    appendHtml(strs: TemplateStringsArray, ...values: unknown[]): this

    appendHtml(strs: string | TemplateStringsArray, ...values: unknown[]): this {
        const template = this.document.createElement("template")
        if (typeof strs === "string") {
            template.innerHTML = strs.trim()
        } else {
            template.innerHTML = html(strs, ...values).trim()
        }
        this.appendChild(template.content)
        return this
    }

    /**
     * Replace the innerHtml of this element with the given html
     * @param html
     */
    html(html: string): this

    /**
     * Replace the innerHtml of this element with the given html
     */
    html(strs: TemplateStringsArray, ...values: unknown[]): this

    html(strs: string | TemplateStringsArray, ...values: unknown[]): this {
        if (typeof strs === "string") {
            this.element.innerHTML = strs.trim()
        } else {
            this.element.innerHTML = html(strs, ...values).trim()
        }
        return this
    }

    /**
     * Append a child element with the given tag to this element, then pass an `HtmlBuilder` for the newly appended element to the given function.
     * @param childTag the tag to append
     * @param func a function to call with an `HtmlBuilder` for the appended element.
     */
    tag<TChild extends HtmlTag>(
        childTag: TChild,
        attrs: Partial<HtmlElementAttrs<TChild>>,
        func?: (child: HtmlBuilder<TChild>) => void,
    ): this

    tag<TChild extends HtmlTag>(
        childTag: TChild,
        func?: (child: HtmlBuilder<TChild>) => void,
    ): this

    tag<TChild extends HtmlTag>(
        childTag: TChild,
        attrsOrFunc?: Partial<HtmlElementAttrs<TChild>> | ((child: HtmlBuilder<TChild>) => void),
        func?: (child: HtmlBuilder<TChild>) => void,
    ): this {
        const childBuilder = new (this.constructor as typeof HtmlBuilder)(childTag, this.document)

        this.appendChild(
            childBuilder.element instanceof HTMLTemplateElement ? childBuilder.element.content : childBuilder.element,
        )

        if (typeof attrsOrFunc === "function") {
            attrsOrFunc(childBuilder)
        } else if (attrsOrFunc) {
            childBuilder.attrs(attrsOrFunc)
        }

        if (func) {
            func(childBuilder)
        }

        return this
    }

    /**
     * Calls the given component function on this HtmlBuilder.
     * @param comp - the component to call
     * @param args - args for the component
     */
    component<TComp extends Component<this>>(
        comp: TComp,
        ...args: ComponentParameters<TComp>
    ): this {
        comp(this, ...args)
        return this
    }

    reactive<TState extends Reactiveable>(state: TState, func: (state: TState, self: this) => void): this {
        effect(state, (state) => func(state, this))
        return this
    }

    /**
     * Register an event listener for a given known event type.
     * @param eventType the type of the event to listen for
     * @param listener the function to call when the event is triggered
     * @param options event listener options
     */
    on<T extends HtmlEventType>(
        eventType: T,
        listener: HtmlEventTypeListener<T, HtmlElement<TTag>>,
        options?: boolean | AddEventListenerOptions,
    ): this

    /**
     * Register an event listener for a given arbitrary event type.
     * @param eventType the type of the event to listen for
     * @param listener the function to call when the event is triggered
     * @param options event listener options
     */
    on<T extends Event>(
        eventType: string,
        listener: HtmlEventListener<T, HtmlElement<TTag>>,
        options?: boolean | AddEventListenerOptions,
    ): this

    on(eventType: string, listener: EventListener, options?: boolean | AddEventListenerOptions): this {
        this.element.addEventListener(eventType, listener, options)
        return this
    }

    /**
     * Mount this element to an element in the document
     * @param mountElement the html element into which to mount this element
     */
    mount(mountElement: HTMLElement) {
        mountElement.appendChild(this.element instanceof HTMLTemplateElement ? this.element.content : this.element)
    }
}

function stringify(value: AnyData): string | undefined {
    if (typeof value === "object") {
        return JSON.stringify(value)
    }
    return value?.toString()
}
