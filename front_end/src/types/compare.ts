export type SessionData = {
    session_id: string
    user_id: string
    products: {
        name: string,
        product_id:string,
        fields: Record<string, unknown> & {
            images?: string[]
            price?: string
            brand?: string
            rating?: string | number
        }
    }[]
    created_at: string
}

export type SessionMessage = {
    id: string
    session_id: string
    role: string
    content: string
    extra?: Record<string, unknown>
    created_at: string
}
