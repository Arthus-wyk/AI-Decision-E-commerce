export type SessionData = {
    session_id: string
    user_id: string
    products: string[]
    created_at?: string
    name: string
    count: number
}

export type CompareGroup = {
    session_id: string
    user_id: string
    products: Array<Record<string, unknown>>
    name: string
    count: number
    created_at?: string
}

export type SessionMessage = {
    id: string
    session_id: string
    role: string
    content: string
    extra?: Record<string, unknown>
    created_at: string
}

export type GroupParams = {
    user_id: string
}

export type GroupResponse = {
    user_id: string
    session: SessionData
}
