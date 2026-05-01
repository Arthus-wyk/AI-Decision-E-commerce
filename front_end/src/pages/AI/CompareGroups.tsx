import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import axios from 'axios'


type CompareGroup = {
    session_id: string
    user_id: string
    products: Array<Record<string, unknown>>
    created_at: string
}

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

function getProductName(product: Record<string, unknown>, index: number) {
    return String(product.name || product.product_name || product.product_id || `Product ${index + 1}`)
}

function getProductImage(product: Record<string, unknown>) {
    const imageValue =
        product.image_url ||
        product.imageUrl ||
        product.image ||
        product.thumbnail ||
        product.thumbnail_url ||
        product.thumb ||
        product.cover ||
        product.cover_image ||
        product.picture ||
        product.photo ||
        product.img

    return typeof imageValue === 'string' && imageValue.trim() ? imageValue : ''
}

export default function CompareGroups() {
    const navigate = useNavigate()

    const [groups, setGroups] = useState<CompareGroup[]>([])
    const [loading, setLoading] = useState(false)

    async function loadCompareGroups() {
        setLoading(true)

        try {
            const response = await axios.get(`${API_BASE}/sessions`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                params: {
                    user_id: 'demo_user'
                }
            })


            const payload = response.data

            console.log(payload)

            setGroups(payload.sessions || [])
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        document.body.style.margin = '0'

        async function init() {
            await loadCompareGroups()
        }

        init()
    }, [])

    return (
        <div
            style={{
                minHeight: '100vh',
                padding: '24px',
                boxSizing: 'border-box',
                fontFamily: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
                color: '#172033',
                background: 'linear-gradient(160deg, #eff4fb 0%, #f8fbff 55%, #e8f0ff 100%)',
            }}
        >
            <header
                style={{
                    marginBottom: '20px',
                }}
            >
                <h1
                    style={{
                        margin: 0,
                        fontSize: '32px',
                    }}
                >
                    Compare Groups
                </h1>

                <p
                    style={{
                        margin: '8px 0 0',
                        color: '#445268',
                    }}
                >
                    View all existing product comparison groups.
                </p>
            </header>

            <section
                style={{
                    background: '#fff',
                    border: '1px solid #d9e0ea',
                    borderRadius: '14px',
                    padding: '16px',
                    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.05)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '16px',
                    }}
                >
                    <h2
                        style={{
                            margin: 0,
                            fontSize: '18px',
                        }}
                    >
                        Existing Groups
                    </h2>

                    <button
                        type="button"
                        onClick={loadCompareGroups}
                        disabled={loading}
                        style={{
                            border: 0,
                            borderRadius: '10px',
                            padding: '10px 14px',
                            background: '#0b63d8',
                            color: '#fff',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                            opacity: loading ? 0.7 : 1,
                        }}
                    >
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>
                </div>

                {groups.length === 0 ? (
                    <div
                        style={{
                            border: '1px dashed #c5d0de',
                            borderRadius: '12px',
                            padding: '28px',
                            textAlign: 'center',
                            color: '#5d6d84',
                            background: '#f8fbff',
                        }}
                    >
                        No compare groups found.
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                        }}
                    >
                        {groups.map((group) => (
                            <article
                                key={group.session_id}
                                onClick={() => navigate(`/compare/groups/${group.session_id}`)}
                                style={{
                                    border: '1px solid #d9e0ea',
                                    borderRadius: '14px',
                                    padding: '14px 16px',
                                    background: '#f7faff',
                                    cursor: 'pointer',
                                    transition: '0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '14px',
                                    height: '118px',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                        minWidth: 0,
                                        flex: 1,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: '10px',
                                        }}
                                    >
                                        <strong
                                            style={{
                                                fontSize: '16px',
                                                color: '#172033',
                                                wordBreak: 'break-all',
                                            }}
                                        >
                                            {group.session_id}
                                        </strong>

                                        <span
                                            style={{
                                                fontSize: '12px',
                                                color: '#0b63d8',
                                                background: '#e9f2ff',
                                                borderRadius: '999px',
                                                padding: '4px 8px',
                                                whiteSpace: 'nowrap',
                                                flexShrink: 0,
                                            }}
                                        >
                    {group.products?.length || 0} products
                  </span>
                                    </div>

                                    <p
                                        style={{
                                            margin: 0,
                                            fontSize: '14px',
                                            color: '#445268',
                                        }}
                                    >
                                        User: {group.user_id || 'Unknown'}
                                    </p>

                                    <p
                                        style={{
                                            margin: 0,
                                            fontSize: '13px',
                                            color: '#5d6d84',
                                        }}
                                    >
                                        Created at: {group.created_at || 'N/A'}
                                    </p>

                                    <p
                                        style={{
                                            margin: 0,
                                            fontSize: '13px',
                                            color: '#445268',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {(group.products || [])
                                            .slice(0, 3)
                                            .map((product, index) => getProductName(product, index))
                                            .join(' / ') || 'No products'}
                                    </p>
                                </div>

                                <div
                                    style={{
                                        width: '148px',
                                        height: '90%',
                                        position: 'relative',
                                        flexShrink: 0,
                                        alignSelf: 'center',
                                    }}
                                >
                                    {(group.products || []).slice(0, 3).map((product, index) => {
                                        const imageUrl = getProductImage(product)
                                        const fallbackName = getProductName(product, index)

                                        return (
                                            <div
                                                key={index}
                                                style={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    right: `${index * 30}px`,
                                                    width: '74px',
                                                    height: '74px',
                                                    borderRadius: '16px',
                                                    border: '2px solid #fff',
                                                    overflow: 'hidden',
                                                    boxShadow: '0 4px 10px rgba(15, 23, 42, 0.14)',
                                                    background: '#edf3ff',
                                                    zIndex: 10 - index,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#406097',
                                                    fontWeight: 700,
                                                    fontSize: '14px',
                                                }}
                                            >
                                                {imageUrl ? (
                                                    <img
                                                        src={imageUrl}
                                                        alt={fallbackName}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                        }}
                                                    />
                                                ) : (
                                                    fallbackName.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

        </div>
    )
}
