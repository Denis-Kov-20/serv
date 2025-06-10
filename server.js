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
  origin: ['http://localhost:8080', 'https://your-flutter-app.onrender.com', 'https://your-service.onrender.com'], // Укажите домены вашего Flutter-приложения
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Эндпоинт для получения списка регионов (для Flutter-приложения)
app.get('/regions', async (req, res) => {
  try {
    // Здесь должен быть запрос к базе данных Laravel через HTTP или прямое подключение
    // Пример статических данных, замените на ваш запрос
    const regions = [
      { name: 'Регіон 1', command: 'action1' },
      { name: 'Регіон 2', command: 'action2' }
    ];
    res.status(200).json(regions);
  } catch (error) {
    console.error('Ошибка получения регионов:', error);
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
