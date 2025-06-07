const express = require('express');
const WebSocket = require('ws');
const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Map();  // Зберігає списки WebSocket-з'єднань за userId

app.use(express.json());

// Обробка HTTP-запиту від сайту
app.post('/send', (req, res) => {
    const { userId, text } = req.body;
    const userClients = clients.get(userId);
    if (userClients && userClients.length > 0) {
        userClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(text);
            }
        });
        res.status(200).send('Текст відправлено на всі пристрої користувача');
    } else {
        res.status(404).send('Жоден пристрій не підключений для цього користувача');
    }
});

// Обробка WebSocket-з'єднань від додатків
wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const { userId } = JSON.parse(message);
        if (!clients.has(userId)) {
            clients.set(userId, []);
        }
        clients.get(userId).push(ws);
        console.log(`Пристрій підключено для користувача ${userId}`);
    });

    ws.on('close', () => {
        for (let [userId, userClients] of clients.entries()) {
            const index = userClients.indexOf(ws);
            if (index !== -1) {
                userClients.splice(index, 1);
                if (userClients.length === 0) {
                    clients.delete(userId);
                }
                console.log(`Пристрій відключено для користувача ${userId}`);
                break;
            }
        }
    });
});

server.listen(3000, () => console.log('Сервер запущено на порту 3000'));