export function unreachable(x: never): never {
    throw new Error(`Reached unreachable branch with value ${String(x)}`)
}
