import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            {
                // 匹配所有以 /api/proxy 开头的请求
                source: '/api/:path*',
                // 转发到后端的真实地址
                destination: 'http://localhost:8000/:path*',
            },
        ]
    },
};

export default nextConfig;
