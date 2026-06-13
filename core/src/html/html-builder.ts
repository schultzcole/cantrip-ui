import type { AnyData, Component, ComponentParameters } from "../util/types.ts"
import { html } from "./html-tagged-template.ts"
import type {
    CssAttrs,
    DataAttrs,
    HtmlElement,
    HtmlEventListener,
    HtmlEventType,
    HtmlEventTypeListener,
    HtmlTag,
    HtmlTagAttrs,
} from "./html-types.ts"
import type { Reactiveable } from "../reactive/reactive-types.ts"
import { effect } from "../reactive/reactive.ts"

/**
 * Thin builder class for creating html hierarchies. Each builder instance is a wrapper around an actual DOM element.
 */
export default class HtmlBuilder<TTag extends HtmlTag = HtmlTag> {
    public readonly element: HtmlElement<TTag>
    protected document: Document
    constructor(public thisTag: TTag, document?: Document) {
        this.document = document ?? globalThis.document
        this.element = this.document.createElement(thisTag, {})
    }

    /**
     * Given an element on the page, creates a builder and mounts it to that element, passing the builder to a func
     * and returning the mounted element.
     * @param element
     * @param func
     */
    static build<TElement extends HTMLElement>(element: TElement, func: BuilderFunc<"template">): TElement {
        const builder = new HtmlBuilder("template")
        builder.callBuilderFunc(func)
        builder.mount(element)
        return element
    }

    protected appendChild(node: Node) {
        if (this.element instanceof HTMLTemplateElement) {
            this.element.content.appendChild(node)
        } else {
            this.element.appendChild(node)
        }
    }

    /**
     * Set the given attrs on this element
     * @param attrs
     */
    attrs(attrs: HtmlTagAttrs<TTag>): this {
        for (const [key, value] of Object.entries(attrs)) {
            this.attr(key as keyof HtmlTagAttrs<TTag>, value as AnyData)
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
    attr<TKey extends keyof HtmlTagAttrs<TTag> & string>(key: TKey, value: HtmlTagAttrs<TTag>[TKey]): this

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
    data(data: DataAttrs): this

    /**
     * Sets a specific data attribute on this element.
     * The attribute name will be converted according to the `dataset` name conversion rules.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset#name_conversion
     * @param key the data attribute key to add
     * @param value the value to add to the dataset
     */
    data(key: string, value: AnyData): this

    data(keyOrObj: string | DataAttrs, value?: AnyData): this {
        if (typeof keyOrObj === "string") {
            this.element.dataset[keyOrObj] = stringify(value)
        } else {
            for (const [key, value] of Object.entries(keyOrObj)) {
                this.element.dataset[key] = stringify(value)
            }
        }
        return this
    }

    /**
     * Adds the given class to this element.
     * @param className the class to add
     */
    class(className: string): this

    /**
     * Toggles the given class on this element based on the value of force.
     * @param className the class to add or remove
     * @param force if true, add the class to this element, otherwise remove the class
     */
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
    text(text: string): this {
        const node = this.document.createTextNode(text)
        this.appendChild(node)
        return this
    }

    /**
     * Replace the content of this element with the given text.
     * @param text
     */
    replaceText(text: string): this {
        const node = this.document.createTextNode(text)
        this.element.replaceChildren(node)
        return this
    }

    /**
     * Append the given html to this element.
     * Use with caution. Make sure the source of the html is trusted. No sanitization is applied to the incoming html string.
     * @param html the html to append to this element
     */
    html(html: string): this

    /**
     * Append the given html tagged template literal to this element.
     * Use with caution. Make sure the source of the html is trusted. No sanitization is applied to the incoming html string.
     *
     * @example
     * ```ts
     * builder.html`<strong>Some HTML content!</strong>`
     * ```
     */
    html(strs: TemplateStringsArray, ...values: unknown[]): this

    html(strs: string | TemplateStringsArray, ...values: unknown[]): this {
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
    replaceHtml(html: string): this

    /**
     * Replace the innerHtml of this element with the given html
     */
    replaceHtml(strs: TemplateStringsArray, ...values: unknown[]): this

    replaceHtml(strs: string | TemplateStringsArray, ...values: unknown[]): this {
        if (typeof strs === "string") {
            this.element.innerHTML = strs.trim()
        } else {
            this.element.innerHTML = html(strs, ...values).trim()
        }
        return this
    }

    /**
     * Append a child element with the given tag to this element,
     * then pass an `HtmlBuilder` for the newly appended element to the given function.
     * @param childTag the tag to append
     * @param func a function to call with an `HtmlBuilder` for the appended element.
     */
    tag<TChild extends HtmlTag>(childTag: TChild, func?: BuilderFunc<TChild>): this {
        const childBuilder = this.returnTag(childTag)
        if (func) childBuilder.callBuilderFunc(func)
        return this
    }

    /**
     * Append a child element with the given tag to this element,
     * then return an `HtmlBuilder` for the newly appended element.
     * @param childTag the tag to append
     * @return a builder for the appended element
     */
    returnTag<TChild extends HtmlTag>(childTag: TChild): HtmlBuilder<TChild> {
        const childBuilder = new (this.constructor as typeof HtmlBuilder)(childTag, this.document)

        const child = childBuilder.element instanceof HTMLTemplateElement
            ? childBuilder.element.content
            : childBuilder.element
        this.appendChild(child)

        return childBuilder
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

    /**
     * Creates a new layout-transparent element bound to a reactive effect. When the effect is executed, DOM contents
     * within the element are replaced by the new execution.
     * See documentation for the {@link effect} function.
     * @param state the state over which this effect will be reactive
     * @param func the function to execute
     */
    domEffect<TState extends Reactiveable>(
        state: TState,
        func: (state: TState, builder: HtmlBuilder<"template">, api: BuilderApi<"template">) => void,
    ): this {
        const container = this.element.appendChild(this.document.createElement("div"))
        container.style.display = "contents" // makes it so this wrapper div doesn't affect layout.

        // Create a separate template builder to pass to the state function. This is desirable because it more strongly
        // conveys that only the _content_ of the builder is reactive; the properties are not. This API nudges users
        // to make sure they're applying properties in the correct location (the element _containing_ the reactive
        // container, not the reactive container itself)
        const innerBuilder = new HtmlBuilder("template", this.document)

        let api: BuilderApi<"template"> | undefined
        if (func.length == 3) {
            api = {
                tag: innerBuilder.tag.bind(innerBuilder),
                returnTag: innerBuilder.returnTag.bind(innerBuilder),
                component: innerBuilder.component.bind(innerBuilder),
            }
        }

        effect(state, (state) => {
            innerBuilder.element.content.replaceChildren()
            // SAFETY: `!` is safe because we know that api will exist if the caller is expecting a value there
            func(state, innerBuilder, api!)
            container.replaceChildren(...innerBuilder.element.content.childNodes)
        })

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

    private callBuilderFunc(func: BuilderFunc<TTag>): void {
        if (func.length == 1) {
            // SAFETY: `!` is safe because we know that the given func won't pay attention to that param
            func(this, undefined!)
        } else if (func.length == 2) {
            func(this, {
                tag: this.tag.bind(this),
                returnTag: this.returnTag.bind(this),
                component: this.component.bind(this),
            })
        }
    }
}

/**
 * Interface for the optional second parameter of a builder func. This interface includes methods that are useful
 * to call without needing to call them directly from the builder as a receiver, and are pre-bound to the builder
 * object to allow for destructuring.
 */
export interface BuilderApi<TTag extends HtmlTag> {
    tag<TChild extends HtmlTag>(childTag: TChild, func?: BuilderFunc<TChild>): void
    returnTag<TChild extends HtmlTag>(childTag: TChild): HtmlBuilder<TChild>
    component<TComp extends Component<HtmlBuilder<TTag>>>(comp: TComp, ...args: ComponentParameters<TComp>): void
}

export type BuilderFunc<TTag extends HtmlTag> = (builder: HtmlBuilder<TTag>, api: BuilderApi<TTag>) => void

function stringify(value: AnyData): string | undefined {
    if (typeof value === "object") {
        return JSON.stringify(value)
    }
    return value?.toString()
}
