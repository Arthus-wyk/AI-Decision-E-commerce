type Props = {
    products: {
        name: string,
        product_id: string,
        fields: Record<string, unknown> & {
            images?: string[]
            price?: string
            brand?: string
            rating?: string | number
        }
    }[]
    isMobile: boolean
    winner?: string | null
}

export default function ProductCards({products, isMobile, winner}: Props) {


    return (
        <div
            style={{
                background: '#fff',
                border: '1px solid #d9e0ea',
                borderRadius: '16px',
                padding: '18px',
                boxShadow: '0 8px 20px rgba(15, 23, 42, 0.05)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
                <h2 style={{margin: 0, fontSize: '20px'}}>Selected Products</h2>
                {winner ? (
                    <span style={{ fontSize: '12px', color: '#445268' }}>
                        Current winner: <strong style={{ color: '#0b63d8' }}>{winner}</strong>
                    </span>
                ) : (
                    <span style={{ fontSize: '12px', color: '#7b8aa0' }}>No winner yet</span>
                )}
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile
                        ? '1fr'
                        : `repeat(${Math.min(products.length || 1, 2)}, 1fr)`,
                    gap: '14px',
                }}
            >
                {products.length === 0 ? (
                    <p style={{color: '#5d6d84'}}>No products loaded.</p>
                ) : (
                    products.map((product) => (
                        (() => {
                            const normalizedWinner = winner?.trim().toLowerCase()
                            const isWinner =
                                Boolean(normalizedWinner) &&
                                (product.product_id.toLowerCase() === normalizedWinner ||
                                    product.name.trim().toLowerCase() === normalizedWinner)

                            return (
                        <article
                            key={product.product_id}
                            style={{
                                border: `${isWinner ? 2 : 1}px solid ${isWinner ? '#0b63d8' : '#e0e7f0'}`,
                                borderRadius: '14px',
                                padding: '16px',
                                background: isWinner
                                    ? 'linear-gradient(180deg, #dbeeff 0%, #f4f9ff 55%, #f8fbff 100%)'
                                    : '#f8fbff',
                                boxShadow: isWinner ? '0 16px 34px rgba(11, 99, 216, 0.28)' : 'none',
                                transform: isWinner ? 'scale(1.015) translateY(-3px)' : 'none',
                                outline: isWinner ? '4px solid rgba(11, 99, 216, 0.15)' : 'none',
                                transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, outline-color 160ms ease',
                                position: 'relative',
                            }}
                        >
                            {isWinner ? (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '12px',
                                        right: '12px',
                                        padding: '7px 12px',
                                        borderRadius: '999px',
                                        background: 'linear-gradient(180deg, #0b63d8 0%, #074aa4 100%)',
                                        color: '#fff',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        letterSpacing: '0.4px',
                                        boxShadow: '0 10px 20px rgba(11, 99, 216, 0.35)',
                                    }}
                                >
                                    WINNER
                                </div>
                            ) : null}
                            <div
                                style={{
                                    height: '200px',
                                    borderRadius: '12px',
                                    background: '#eef3f9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    marginBottom: '12px',
                                }}
                            >
                                {product.fields.images ? (
                                    <img
                                        src={product.fields.images[0]}
                                        alt={product.name}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                    />
                                ) : (
                                    <span style={{color: '#7b8aa0'}}>No Image</span>
                                )}
                            </div>

                            <h3 style={{margin: '0 0 8px', fontSize: '18px'}}>
                                {product.name}
                            </h3>

                            <p style={{margin: '0 0 6px', color: '#0b63d8', fontWeight: 700}}>
                                Price: {product.fields.price || '-'}
                            </p>

                            <p style={{margin: '0 0 6px', color: '#445268'}}>
                                Brand: {product.fields.brand || '-'}
                            </p>

                            <p style={{margin: 0, color: '#445268'}}>
                                Rating: {product.fields.rating || '-'}
                            </p>
                        </article>
                            )
                        })()
                    ))
                )}
            </div>
        </div>
    )
}
