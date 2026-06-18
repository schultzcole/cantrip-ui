import { HtmlBuilder } from "../../../../core/mod.ts"

export type SelectOpt = { value: string; label: string }
export type ShallowSelectOpts = SelectOpt[]
export type SelectOptGroup = { label: string; options: ShallowSelectOpts }
export type GroupedSelectOpts = (SelectOpt | SelectOptGroup)[]
export type SelectOpts = ShallowSelectOpts | GroupedSelectOpts

export function selectOptions(root: HtmlBuilder<"select" | "optgroup">, options: SelectOpts | SelectOptRecord): void {
    const optsArray = (Array.isArray(options)) ? options : selectOptsFromRecord(options)

    for (const opt of optsArray) {
        if ("value" in opt) {
            root.tag("option")
                .attr("value", opt.value)
                .text(opt.label)
        } else {
            root.tag("optgroup")
                .attr("label", opt.label)
                .component(selectOptions, opt.options)
        }
    }
}

export type ShallowSelectOptRecord = Record<string, string>
export type GroupedSelectOptRecord = Record<string, string | ShallowSelectOptRecord>
export type SelectOptRecord = ShallowSelectOptRecord | GroupedSelectOptRecord

export function selectOptsFromRecord(options: SelectOptRecord): SelectOpts {
    const output: GroupedSelectOpts = []
    for (const [value, labelOrGroup] of Object.entries(options)) {
        if (typeof labelOrGroup === "string") {
            output.push({ value, label: labelOrGroup })
        } else {
            // SAFETY: `as` is safe here because options must not have deeper nesting than one level, thus the returned
            //         options will be SelectOpt[]
            const opts = selectOptsFromRecord(labelOrGroup) as ShallowSelectOpts
            output.push({ label: value, options: opts })
        }
    }
    return output
}
