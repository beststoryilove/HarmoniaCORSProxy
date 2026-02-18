// api/proxy.js
export const config = {
  runtime: 'edge', // 使用 Edge Runtime，更快更省资源
};

export default async function handler(request) {
  // 处理预检请求（CORS）
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // 只允许 GET 请求
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    // 解析请求参数
    const { searchParams } = new URL(request.url);
    const types = searchParams.get('types');
    const source = searchParams.get('source');
    const id = searchParams.get('id');
    const name = searchParams.get('name');
    const page = searchParams.get('pages');
    const count = searchParams.get('count');
    const br = searchParams.get('br');
    const size = searchParams.get('size');

    // 构建目标 API 地址（固定为你的音乐数据源）
    const targetUrl = new URL('https://music-api.gdstudio.xyz/api.php');
    if (types) targetUrl.searchParams.set('types', types);
    if (source) targetUrl.searchParams.set('source', source);
    if (id) targetUrl.searchParams.set('id', id);
    if (name) targetUrl.searchParams.set('name', name);
    if (page) targetUrl.searchParams.set('pages', page);
    if (count) targetUrl.searchParams.set('count', count);
    if (br) targetUrl.searchParams.set('br', br);
    if (size) targetUrl.searchParams.set('size', size);

    // 向真实 API 发起请求
    const apiResponse = await fetch(targetUrl.toString(), {
      headers: { 'User-Agent': 'Harmonia-Music-Player/1.0' },
    });

    if (!apiResponse.ok) {
      throw new Error(`API responded with status: ${apiResponse.status}`);
    }

    // 判断响应类型，原样返回
    const contentType = apiResponse.headers.get('content-type') || '';
    let responseBody;
    let responseHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    };

    if (contentType.includes('application/json')) {
      responseBody = await apiResponse.text();
      responseHeaders['Content-Type'] = 'application/json';
    } else {
      responseBody = await apiResponse.arrayBuffer();
      responseHeaders['Content-Type'] = contentType;
    }

    return new Response(responseBody, {
      status: apiResponse.status,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({ error: 'Proxy fetch failed', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
