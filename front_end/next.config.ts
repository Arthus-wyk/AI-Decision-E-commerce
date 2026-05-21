import type { NextConfig } from "next";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8002";

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${apiBaseUrl.replace(/\/$/, "")}/:path*`,
            },
        ]
    },
};

export default nextConfig;
