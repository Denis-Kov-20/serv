const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Map();

app.use(cors({
  origin: ['http://localhost:8080', 'https://43bf-77-222-156-124.ngrok-free.app', 'https://serv-17o2.onrender.com'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Эндпоинт для регионов
app.get('/regions', async (req, res) => {
  try {
    const response = await axios.get('https://43bf-77-222-156-124.ngrok-free.app/api/regions');
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Ошибка получения регионов от Laravel:', error.message);
    res.status(500).send('Помилка сервера');
  }
});

// Эндпоинт для команд
app.post('/command', (req, res) => {
  console.log('Получен запрос:', req.body);
  const { command } = req.body;
  if (!command) {
    return res.status(400).send('Команда не указана');
  }
  for (const [userId, userClients] of clients.entries()) {
    userClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ command }));
      }
    });
  }
  res.status(200).send('Команда отправлена');
});

// WebSocket
wss.on('connection', (ws, req) => {
  console.log('Новое WebSocket-соединение');
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      const { userId, command } = data;
      if (userId) {
        if (!clients.has(userId)) clients.set(userId, []);
        clients.get(userId).push(ws);
        console.log(`Устройство подключено для пользователя ${userId}`);
      }
      if (command) {
        const userClients = clients.get(userId);
        if (userClients) {
          userClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ command }));
            }
          });
        }
      }
    } catch (error) {
      console.error('Ошибка обработки сообщения:', error);
    }
  });
  ws.on('close', () => {
    for (let [userId, userClients] of clients.entries()) {
      const index = userClients.indexOf(ws);
      if (index !== -1) {
        userClients.splice(index, 1);
        if (userClients.length === 0) clients.delete(userId);
        console.log(`Устройство отключено для пользователя ${userId}`);
        break;
      }
    }
  });
  ws.on('error', (error) => console.error('Ошибка WebSocket:', error));
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
server.on('error', (err) => console.error('Ошибка сервера:', err));
