const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());

const broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

app.post('/send-alert', (req, res) => {
  const { message, type } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });
  const alert = { message, type: type || 'info', timestamp: new Date() };
  broadcast(alert);
  res.json({ success: true, broadcasted: alert });
});

// Налаштування шляху до клієнта
const clientPath = path.join(__dirname, '../client');
app.use(express.static(clientPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`WebSocket Server is running on port ${PORT}`);
});
