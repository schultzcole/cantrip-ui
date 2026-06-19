import { HtmlBuilder, reactive } from "../../../core/mod.ts"

type Email = `${string}@${string}`
type User = {
    firstName: string
    lastName: string
    email: Email
}
type UnvalidatedUser = {
    firstName?: string
    lastName?: string
    email?: string
}
type AddressBookState = {
    loading: boolean
    filter?: string
    selectedUser?: number
    users: User[]
    inProgressUser: UnvalidatedUser
}

export function addressBook(root: HtmlBuilder): void {
    const state: AddressBookState = reactive({
        loading: false,
        filter: undefined,
        selectedUser: undefined,
        users: [
            { firstName: "John", lastName: "Doe", email: "johndoe@email.com" },
            { firstName: "Scooby", lastName: "Doo", email: "ruh.roh@email.com" },
        ],
        inProgressUser: {},
    })

    root.effect(state, (state) => {
        if (state.selectedUser == undefined) {
            state.inProgressUser = {}
        } else {
            state.inProgressUser = state.users[state.selectedUser]
        }
    })

    root.tag("div", (div) => {
        div.attrs({ className: "flex flex-col flex-gap" })
        div.effect(state, (state) => div.attr("ariaDisabled", state.loading ? true : null))

        // Name Filter
        div.tag("div", (div) => {
            div.tag("label").attrs({ htmlFor: "filter-prefix-field" }).text("Filter: ")

            div.tag("input")
                .attrs({ id: "filter-prefix-field", type: "search" })
                .on("input", (evt) => state.filter = evt.currentTarget.value)
        })

        // Main Content
        div.tag("div", (div) => {
            div.attrs({ className: "address-book-grid" })

            // User List
            div.tag("div", (div) => {
                div.attrs({ className: "user-list" })

                div.replaceEffect(state, ({ users }, template) => {
                    for (let i = 0; i < users.length; i++) {
                        const user = users[i]
                        const fullName = `${user.lastName}, ${user.firstName}`
                        if (state.filter?.length && !fullName.startsWith(state.filter)) continue
                        template.tag("button")
                            .attrs({ type: "button" })
                            .class("selected", state.selectedUser === i)
                            .text(fullName)
                            .on("click", () => state.selectedUser = i)
                    }
                })
            })

            // User Form
            div.tag("form")
                .attrs({ id: "user-form", className: "user-form-grid" })
                .component(userField, state, "firstName", "First Name")
                .component(userField, state, "lastName", "Last Name")
                .component(userField, state, "email", "Email")
        })

        // CRUD buttons
        div.tag("div")
            .attrs({ className: "flex flex-gap" })
            .component(crudButton, "Create", false, state, async () => {
                await createUser({ ...state.inProgressUser }, state.users)
                state.selectedUser = undefined
            })
            .component(crudButton, "Update", true, state, async () => {
                await updateUser({ ...state.inProgressUser }, state.users, state.selectedUser!)
                state.inProgressUser = state.users[state.selectedUser!]
            })
            .component(crudButton, "Delete", true, state, async () => {
                await deleteUser(state.users, state.selectedUser!)
                state.selectedUser = undefined
            })
    })
}

// Sub-Components

function userField(
    root: HtmlBuilder,
    state: AddressBookState,
    name: keyof UnvalidatedUser,
    labelText: string,
    type: "text" | "email" = "text",
): void {
    root.tag("div", (div) => {
        div.attrs({ className: "user-form-grid-row" })
        div.tag("label", (label) => {
            label.text(`${labelText}: `)
            div.tag("input")
                .attrs({ type, name: name })
                .effect(state, (state, input) => input.attr("value", state.inProgressUser[name] ?? ""))
                .on("change", (evt) => state.inProgressUser[name] = evt.currentTarget.value)
        })
    })
}

function crudButton(
    root: HtmlBuilder,
    label: string,
    requiresSelectedUser: boolean,
    state: AddressBookState,
    onClick: () => Promise<void>,
): void {
    root.tag("button", (button) => {
        button
            .text(label)
            .on("click", async () => {
                if (requiresSelectedUser && state.selectedUser == undefined) throw new Error("No user selected")
                state.loading = true
                try {
                    await onClick()
                } catch (ex) {
                    alert((ex as Error).message)
                } finally {
                    state.loading = false
                }
            })

        if (requiresSelectedUser) {
            button.effect(state, (state, button) => button.attr("disabled", state.selectedUser === undefined))
        }
    })
}

// CRUD

function validateUser(unvalidatedUser: UnvalidatedUser): User {
    const { firstName, lastName, email } = unvalidatedUser
    if (!firstName?.length) {
        throw new Error("Empty first name")
    }
    if (!lastName?.length) {
        throw new Error("Empty last name")
    }
    if (!validEmail(email)) {
        throw new Error("Invalid email")
    }
    return { firstName, lastName, email }
}

function validEmail(email: string | undefined): email is Email {
    if (!email?.length) return false
    return /.@./.test(email)
}

async function createUser(unvalidatedUser: UnvalidatedUser, users: User[]): Promise<void> {
    console.log("creating user", unvalidatedUser)
    const user = validateUser(unvalidatedUser)
    await delay(500)
    users.push(user)
    console.log("added user!", users)
}

async function updateUser(unvalidatedUser: UnvalidatedUser, users: User[], index: number): Promise<void> {
    const user = validateUser(unvalidatedUser)
    await delay(500)
    users[index] = user
    console.log("updated user!", users)
}

async function deleteUser(users: User[], index: number): Promise<void> {
    await delay(500)
    users.splice(index, 1)
    console.log("deleted user!", users)
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
