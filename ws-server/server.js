require('dotenv').config();
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils');
const jwt = require('jsonwebtoken');

const PORT = process.env.WS_PORT || 1234;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';

const server = createServer((_req, res) => {
  res.writeHead(200);
  res.end('y-websocket sync server — Policy Management POC');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  // Extract JWT from query params
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const token = url.searchParams.get('token');

  if (!token) {
    ws.close(4001, 'Missing auth token');
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    console.log(`[WS] User ${payload.email} (${payload.role}) connected`);
  } catch {
    ws.close(4003, 'Invalid auth token');
    return;
  }

  // Let y-websocket handle the Yjs sync protocol
  setupWSConnection(ws, req);
});

server.listen(PORT, () => {
  console.log(`y-websocket server listening on ws://localhost:${PORT}`);
  console.log('Rooms are created per document/version automatically');
});
