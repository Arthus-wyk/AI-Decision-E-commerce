'use client'
import { useEffect, useRef } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import type { SessionMessage } from '../../types/compare'

type Props = {
    messages: SessionMessage[]
    chatInput: string
    setChatInput: (value: string) => void
    handleSendChat: (e: FormEvent) => void
    hasSession: boolean
    loading: boolean
    status: string
    isMobile: boolean
}

export default function AIChatPanel({
                                        messages,
                                        chatInput,
                                        setChatInput,
                                        handleSendChat,
                                        hasSession,
                                        loading,
                                        status,
                                        isMobile,
                                    }: Props) {
    const bottomRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
        })
    }, [messages])

    function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()

            if (!hasSession || loading || !chatInput.trim()) return

            e.currentTarget.form?.requestSubmit()
        }
    }

    return (
        <aside
            style={{
                background: '#fff',
                border: '1px solid #d9e0ea',
                borderRadius: '16px',
                padding: '18px',
                boxShadow: '0 8px 20px rgba(15, 23, 42, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                height: isMobile ? '620px' : 'calc(100vh - 120px)',
                position: isMobile ? 'static' : 'sticky',
                top: '24px',
            }}
        >
            <h2 style={{ margin: '0 0 12px', fontSize: '20px' }}>AI Assistant</h2>

            <div
                style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    marginBottom: '12px',
                }}
            >
                {[
                    'Which product is best overall?',
                    'Which one has better value?',
                    'Summarize the key differences.',
                ].map((question) => (
                    <button
                        key={question}
                        type="button"
                        onClick={() => setChatInput(question)}
                        style={{
                            border: '1px solid #c5d0de',
                            borderRadius: '999px',
                            padding: '7px 10px',
                            background: '#f8fbff',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: '#304057',
                        }}
                    >
                        {question}
                    </button>
                ))}
            </div>

            <div
                style={{
                    border: '1px solid #e0e7f0',
                    borderRadius: '12px',
                    background: '#f8fbff',
                    padding: '12px',
                    overflow: 'auto',
                    flex: 1,
                    marginBottom: '12px',
                }}
            >
                {messages.length === 0 ? (
                    <p style={{ color: '#5d6d84' }}>No messages yet.</p>
                ) : (
                    messages.map((msg) => (
                        <article
                            key={msg.id}
                            style={{
                                maxWidth: '88%',
                                marginLeft: msg.role === 'user' ? 'auto' : 0,
                                marginBottom: '10px',
                                borderRadius: '12px',
                                padding: '10px',
                                border: `1px solid ${msg.role === 'user' ? '#b7d3ff' : '#caebbc'}`,
                                background: msg.role === 'user' ? '#e9f2ff' : '#eefbe8',
                            }}
                        >
                            <strong
                                style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    color: '#4a5970',
                                    marginBottom: '6px',
                                }}
                            >
                                {msg.role === 'user' ? 'You' : 'AI'}
                            </strong>

                            <p
                                style={{
                                    margin: 0,
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: 1.6,
                                    color: '#1a2538',
                                }}
                            >
                                {msg.content}
                            </p>
                        </article>
                    ))
                )}

                <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '8px' }}>
        <textarea
            style={{
                flex: 1,
                border: '1px solid #c5d0de',
                borderRadius: '12px',
                padding: '10px 12px',
                fontSize: '14px',
                color: '#172033',
                background: '#f8fbff',
                resize: 'none',
            }}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Ask AI about these products..."
            disabled={!hasSession || loading}
        />

                <button
                    style={{
                        border: 0,
                        borderRadius: '12px',
                        padding: '0 16px',
                        background: '#0b63d8',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: 600,
                    }}
                    type="submit"
                    disabled={!hasSession || loading || !chatInput.trim()}
                >
                    Send
                </button>
            </form>

            <p
                style={{
                    margin: '10px 0 0',
                    color: status.includes('failed') || status.includes('error') ? '#b42318' : '#5d6d84',
                    fontSize: '13px',
                }}
            >
                {status || 'Ready.'}
            </p>
        </aside>
    )
}
