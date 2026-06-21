import { HtmlBuilder, reactive } from "@cantrip-ui/core"

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
    userList: string[]
    inProgressUser: UnvalidatedUser
}

export function addressBook(root: HtmlBuilder): void {
    const repository = new UserRepository([
        { firstName: "John", lastName: "Doe", email: "john.doe@test.test" },
        { firstName: "Scooby", lastName: "Doo", email: "ruh.roh@test.test" },
    ])

    const state: AddressBookState = reactive({
        loading: true,
        filter: undefined,
        selectedUser: undefined,
        userList: [],
        inProgressUser: {},
    })

    repository.getList()
        .then((list) => state.userList = list)
        .catch((err) => alert(`Could not load users: ${(err as Error).message}`))
        .finally(() => state.loading = false)

    root.effect(state, async (state) => {
        if (state.selectedUser == undefined) {
            state.inProgressUser = {}
        } else {
            state.loading = true
            try {
                state.inProgressUser = await repository.get(state.selectedUser)
            } finally {
                state.loading = false
            }
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

                div.replaceEffect(state, ({ userList }, template) => {
                    for (let i = 0; i < userList.length; i++) {
                        const fullName = userList[i]
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
                state.userList = await repository.create(state.inProgressUser)
                state.selectedUser = undefined
            })
            .component(crudButton, "Update", true, state, async () => {
                state.userList = await repository.update(state.inProgressUser, state.selectedUser!)
            })
            .component(crudButton, "Delete", true, state, async () => {
                state.userList = await repository.delete(state.selectedUser!)
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
                if (requiresSelectedUser && state.selectedUser == undefined) {
                    alert("No user selected!")
                    return
                }
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

class UserRepository {
    constructor(readonly users: User[]) { }

    async get(index: number): Promise<User> {
        await delay(500)
        return { ...this.users[index] }
    }

    async getList(): Promise<string[]> {
        await delay(200)
        return this.users.map((u) => `${u.lastName}, ${u.firstName}`)
    }

    async create(unvalidatedUser: UnvalidatedUser): Promise<string[]> {
        const user = this.validateUser(unvalidatedUser)
        await delay(200)
        this.users.push(user)
        return this.getList()
    }

    async update(unvalidatedUser: UnvalidatedUser, index: number): Promise<string[]> {
        const user = this.validateUser(unvalidatedUser)
        await delay(200)
        this.users[index] = user
        return this.getList()
    }

    async delete(index: number): Promise<string[]> {
        await delay(200)
        this.users.splice(index, 1)
        return this.getList()
    }

    validateUser(unvalidatedUser: UnvalidatedUser): User {
        const { firstName, lastName, email } = unvalidatedUser
        if (!firstName?.length) {
            throw new Error("Empty first name")
        }
        if (!lastName?.length) {
            throw new Error("Empty last name")
        }
        if (!this.validEmail(email)) {
            throw new Error("Invalid email")
        }
        return { firstName, lastName, email }
    }

    validEmail(email: string | undefined): email is Email {
        if (!email?.length) return false
        return /.@./.test(email)
    }
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
