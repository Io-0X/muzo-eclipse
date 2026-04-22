import app from '../app.js';

// Vercel serverless function entrypoint
export default async function handler(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  
  // Transform Web API Request to Node.js IncomingMessage
  const req = {
    method: request.method,
    url: url.pathname + url.search,
    headers: Object.fromEntries(request.headers.entries()),
    body: request.body
  };
  
  // Transform Node.js ServerResponse to Web API Response
  let statusCode = 200;
  let headers = {};
  let body = null;
  
  const res = {
    setHeader: (key, value) => { headers[key] = value; },
    getHeader: (key) => headers[key],
    getHeaders: () => headers,
    writeHead: (status, h) => { statusCode = status; Object.assign(headers, h || {}); },
    end: (data) => { body = data; }
  };
  
  await app.fetch(req, res);
  
  response.status(statusCode).setHeader('content-type', headers['content-type'] || 'application/json').send(body);
}


