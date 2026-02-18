// api/proxy.js
export const config = { runtime: 'edge' };

export default async function handler(request) {
  // CORS 预检处理
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

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    let targetUrl;

    // 1. 优先检查是否有 url 参数（通用代理模式）
    const urlParam = searchParams.get('url');
    if (urlParam) {
      targetUrl = urlParam;
    } else {
      // 2. 否则按原有参数映射方式构建（针对 music-api.gdstudio.xyz）
      const types = searchParams.get('types');
      const source = searchParams.get('source');
      const id = searchParams.get('id');
      const name = searchParams.get('name');
      const page = searchParams.get('pages');
      const count = searchParams.get('count');
      const br = searchParams.get('br');
      const size = searchParams.get('size');

      const apiUrl = new URL('https://music-api.gdstudio.xyz/api.php');
      if (types) apiUrl.searchParams.set('types', types);
      if (source) apiUrl.searchParams.set('source', source);
      if (id) apiUrl.searchParams.set('id', id);
      if (name) apiUrl.searchParams.set('name', name);
      if (page) apiUrl.searchParams.set('pages', page);
      if (count) apiUrl.searchParams.set('count', count);
      if (br) apiUrl.searchParams.set('br', br);
      if (size) apiUrl.searchParams.set('size', size);
      targetUrl = apiUrl.toString();
    }

    // 发起请求
    const apiResponse = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Harmonia-Music-Player/1.0' },
    });

    if (!apiResponse.ok) {
      throw new Error(`API responded with status: ${apiResponse.status}`);
    }

    // 返回响应（保持原有CORS头）
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
