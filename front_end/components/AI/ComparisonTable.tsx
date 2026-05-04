'use client'

import type { CSSProperties } from 'react'


type Props = {
    products: Array<Record<string, unknown>>
}

export default function ComparisonTable({ products }: Props) {
    const fields = [
        ['Product ID', 'product_id'],
        ['Brand', 'brand'],
        ['Price', 'price'],
        ['Rating', 'rating'],
        ['Category', 'category'],
        ['Description', 'description'],
    ]
    const textValue=(value: unknown, fallback = '-')=> {
        if (value === null || value === undefined || value === '') return fallback
        return String(value)
    }

    const getProductName=(product: Record<string, unknown>, index: number)=> {
        return textValue(
            product.name || product.title || product.product_name,
            `Product ${index + 1}`,
        )
    }
    const getProductId=(product: Record<string, unknown>, index: number)=> {
        return textValue(product.product_id || product.id || product.sku, `product_${index + 1}`)
    }

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
            <h2 style={{ margin: '0 0 14px', fontSize: '20px' }}>Basic Comparison</h2>

            <div style={{ overflowX: 'auto' }}>
                <table
                    style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '14px',
                    }}
                >
                    <thead>
                    <tr>
                        <th style={thStyle}>Field</th>
                        {products.map((product, index) => (
                            <th key={getProductId(product, index)} style={thStyle}>
                                {getProductName(product, index)}
                            </th>
                        ))}
                    </tr>
                    </thead>

                    <tbody>
                    {fields.map(([label, key]) => (
                        <tr key={key}>
                            <td style={tdLabelStyle}>{label}</td>
                            {products.map((product, index) => (
                                <td key={`${key}-${index}`} style={tdStyle}>
                                    {textValue(product[key])}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

const thStyle: CSSProperties = {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '1px solid #d9e0ea',
    background: '#f4f8fc',
    color: '#304057',
}

const tdStyle: CSSProperties = {
    padding: '12px',
    borderBottom: '1px solid #edf1f6',
    color: '#304057',
    verticalAlign: 'top',
}

const tdLabelStyle: CSSProperties = {
    ...tdStyle,
    fontWeight: 700,
    color: '#172033',
    width: '140px',
}
