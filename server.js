const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Map();

// Настройка CORS для конкретного источника
app.use(cors({
    origin: 'https://mapn:8890', // Разрешаем запросы только с https://mapn:8890
    methods: ['GET', 'POST'],    // Разрешаем только GET и POST методы
    allowedHeaders: ['Content-Type'] // Разрешаем заголовок Content-Type
}));

app.use(express.json());

// Обработка HTTP-запросов
app.post('/send', (req, res) => {
    console.log('Получен запрос:', req.body); // Логирование для отладки
    const { userId, text } = req.body;
    const userClients = clients.get(userId);
    if (userClients && userClients.length > 0) {
        userClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(text);
            }
        });
        res.status(200).send('Текст отправлен на все устройства пользователя');
    } else {
        res.status(404).send('Ни одно устройство не подключено для этого пользователя');
    }
});

// Обработка WebSocket-соединений
wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const { userId } = JSON.parse(message);
        if (!clients.has(userId)) {
            clients.set(userId, []);
        }
        clients.get(userId).push(ws);
        console.log(`Устройство подключено для пользователя ${userId}`);
    });

    ws.on('close', () => {
        for (let [userId, userClients] of clients.entries()) {
            const index = userClients.indexOf(ws);
            if (index !== -1) {
                userClients.splice(index, 1);
                if (userClients.length === 0) {
                    clients.delete(userId);
                }
                console.log(`Устройство отключено для пользователя ${userId}`);
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
server.on('error', (err) => console.error('Ошибка сервера:', err)); // Логирование ошибок сервера
