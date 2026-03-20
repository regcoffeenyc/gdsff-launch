function setCors(response) {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
}

export function sendJson(response, statusCode, payload) {
  setCors(response)
  response.status(statusCode).json(payload)
}

export function sendEmpty(response, statusCode = 204) {
  setCors(response)
  response.status(statusCode).end()
}

export async function readJson(request) {
  if (request.body && typeof request.body === 'object') {
    return request.body
  }

  if (typeof request.body === 'string' && request.body.trim()) {
    return JSON.parse(request.body)
  }

  const chunks = []
  for await (const chunk of request) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }

  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}
