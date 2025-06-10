const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Map();

// Настройка CORS
app.use(cors({
  origin: ['http://localhost:8080', 'https://nikopol-map:8890', 'https://serv-17o2.onrender.com'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const axios = require('axios');

app.get('/regions', async (req, res) => {
  try {
    const response = await axios.get('https://abc123.ngrok.io/api/regions'); // Замените на ваш ngrok URL
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Ошибка получения регионов от Laravel:', error.message);
    res.status(500).send('Помилка сервера');
  }
});


// Эндпоинт для отправки команды
app.post('/command', (req, res) => {
  console.log('Получен запрос:', req.body);
  const { command } = req.body;
  if (!command) {
    return res.status(400).send('Команда не указана');
  }

  // Отправка команды всем подключенным клиентам
  for (const [userId, userClients] of clients.entries()) {
    userClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ command }));
      }
    });
  }
  res.status(200).send('Команда отправлена');
});


// Обработка WebSocket-соединений
wss.on('connection', (ws, req) => {
  console.log('Новое WebSocket-соединение');
