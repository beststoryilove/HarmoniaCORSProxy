// api/proxy.js
export default async function handler(request, response) {
    // 1. 设置 CORS 头部，允许你的前端页面访问
    response.setHeader('Access-Control-Allow-Origin', '*'); // 开发时可设为 *，生产环境建议改为你的具体域名
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 2. 处理浏览器的预检请求 (OPTIONS 方法)
    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    // 3. 只处理 GET 请求
    if (request.method !== 'GET') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // 4. 从请求参数中获取真实的音乐API地址
        //    你的前端会这样调用: /api/proxy?url=https://music-api.gdstudio.xyz/...
        const targetUrl = request.query.url;
        if (!targetUrl) {
            return response.status(400).json({ error: 'Missing "url" parameter' });
        }

        // 5. 向真实的音乐API发起请求 (这一步是在 Vercel 服务器上进行的，没有跨域问题)
        const apiResponse = await fetch(targetUrl);
        const data = await apiResponse.json();

        // 6. 将获取到的数据返回给你的前端页面
        response.status(200).json(data);
    } catch (error) {
        response.status(500).json({ error: 'Proxy fetch failed', details: error.message });
    }
}