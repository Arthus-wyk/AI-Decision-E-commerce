import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'

import type { SessionData, SessionMessage } from '../../types/compare'
import ProductCards from "../../components/AI/ProductCards.tsx";
// import ComparisonTable from "../../components/AI/ComparisonTable.tsx";
import AISummaryCard from "../../components/AI/AISummaryCard.tsx";
import AIChatPanel from "../../components/AI/AIChatPanel.tsx";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

export default function ChatPage() {
    const { groupId } = useParams()

    const [sessionId] = useState(groupId)
    const [userId] = useState('demo_user')
    const [chatInput, setChatInput] = useState('')
    const [status, setStatus] = useState('')
    const [loading, setLoading] = useState(false)
    const [session, setSession] = useState<SessionData | null>(null)
    const [messages, setMessages] = useState<SessionMessage[]>([])
    const [sammary, setSammary] = useState<string>('')
    const [winner, setWinner] = useState<string|null>(null)

    const hasSession = useMemo(() => Boolean(session?.session_id), [session])
    const isMobile = useMemo(() => window.innerWidth <= 900, [])

    const products = session?.products || []


    useEffect(() => {
        document.body.style.margin = '0'
    }, [])

    useEffect(() => {
        if (groupId) {
            loadSessionAndMessages(groupId)
            loadSammary(groupId)
            loadWinner(groupId)
        }
    }, [groupId])

    async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
        const response = await fetch(`${API_BASE}${path}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(init?.headers ?? {}),
            },
            ...init,
        })

        const payload = await response.json().catch(() => ({}))

        if (!response.ok) {
            const detail = (payload as { detail?: string }).detail
            throw new Error(detail || `Request failed: ${response.status}`)
        }

        return payload as T
    }

    async function loadSessionAndMessages(targetSessionId: string) {
        setLoading(true)
        setStatus('')

        try {
            const sessionResp = await apiFetch<{ session: SessionData }>(`/sessions/${targetSessionId}`)
            const messagesResp = await apiFetch<{ messages: SessionMessage[] }>(
                `/sessions/${targetSessionId}/messages`,
            )

            setSession(sessionResp.session)
            setMessages(messagesResp.messages || [])
            setStatus('Session loaded.')
        } catch (error) {
            setStatus((error as Error).message)
        } finally {
            setLoading(false)
        }
    }
    const loadSammary=async (groupId:string)=>{
        try {
            const response = await axios.post(
                `${API_BASE}/summary`,
                {
                    session_id: groupId,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            const payload = response.data
            console.log(payload)

            setSammary(payload.data)
        } catch (error) {
            setStatus((error as Error).message)
        } finally {
            setLoading(false)
        }
    }
    const loadWinner=async (groupId:string)=>{
        try {
            const response = await axios.post(
                `${API_BASE}/session_logs`,
                {
                    session_id: groupId,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            const payload = response.data
            const current_winner=payload.logs.final_result.winner
            if (current_winner) {
                setWinner(current_winner)
            }
        } catch (error) {
            setStatus((error as Error).message)
        } finally {
            setLoading(false)
        }
    }

    async function handleSendChat(e: FormEvent) {
        e.preventDefault()

        if (!chatInput.trim() || !sessionId) return

        setLoading(true)
        setStatus('')

        try {
            const input = chatInput
            setChatInput('')
            const id = uuidv4();
            setMessages((prevMessages) => [
                ...prevMessages,
                {
                    id: id,
                    session_id: sessionId,
                    role:'user',
                    content:input,
                    created_at:''
                }
            ]);
            await apiFetch('/chat', {
                method: 'POST',
                body: JSON.stringify({
                    session_id: sessionId,
                    user_id: userId || 'unknown',
                    message: input,
                    user_profile: {},
                }),
            })


            await loadSessionAndMessages(sessionId)
            await loadWinner(sessionId)
            setStatus('Message sent.')
        } catch (error) {
            setStatus((error as Error).message)
        } finally {
            setLoading(false)
        }
    }

    if (!groupId) return null

    return (
        <div
            style={{
                minHeight: '100vh',
                padding: '24px',
                boxSizing: 'border-box',
                color: '#172033',
                background: 'linear-gradient(160deg, #eff4fb 0%, #f8fbff 55%, #e8f0ff 100%)',
            }}
        >
            <header
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                }}
            >
                <div>
                    <h1 style={{ margin: 0, fontSize: '30px' }}>AI Product Comparison</h1>
                    <p style={{ margin: '8px 0 0', color: '#5d6d84' }}>
                        Compare selected products and ask AI for purchase advice.
                    </p>
                </div>

                <button
                    style={{
                        border: 0,
                        borderRadius: '10px',
                        padding: '10px 16px',
                        background: '#0b63d8',
                        color: '#fff',
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                    onClick={() => sessionId && loadSessionAndMessages(sessionId)}
                    disabled={loading}
                >
                    Refresh
                </button>
            </header>

            <main
                style={{
                    display: 'grid',
                    gridTemplateColumns: '70% 30%',
                    gap: '18px',
                    alignItems: 'start',
                }}
            >
                <section style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <ProductCards products={products} isMobile={isMobile} winner={winner} />

                    {/*<ComparisonTable products={products} />*/}

                    <AISummaryCard summary={sammary} />
                </section>

                <AIChatPanel
                    messages={messages}
                    chatInput={chatInput}
                    setChatInput={setChatInput}
                    handleSendChat={handleSendChat}
                    hasSession={hasSession}
                    loading={loading}
                    status={status}
                    isMobile={isMobile}
                />
            </main>
        </div>
    )
}
