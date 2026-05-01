type Props = {
    summary: string
}

export default function AISummaryCard({ summary }: Props) {
    return (
        <div
            style={{
                background: '#fff',
                border: '1px solid #b7d3ff',
                borderRadius: '16px',
                padding: '16px',
                boxShadow: '0 8px 20px rgba(15, 23, 42, 0.05)',
            }}
        >
            <h2 style={{ margin: '0 0 8px', fontSize: '16px' }}>AI Summary</h2>

            <div
                style={{
                    borderRadius: '14px',
                    padding: '12px',
                    background: '#eef6ff',
                    color: '#172033',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                }}
            >
                {summary}
            </div>
        </div>
    )
}
