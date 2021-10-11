import http from "http";
import WebSocket from 'ws';
import express from "express";

const PORT = 5000
const app = express();
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use('/public', express.static(__dirname + '/public'));
app.get('/', (req, res) => res.render('home'));
app.get('/*', (req, res) => res.redirect('/'));

const handleListen = () => console.log(`Listening on http&ws://localhost:${PORT}`)
// app.listen(5000, handleListen);
const server = http.createServer(app) // websocket 을 하기 위해 변경
const wss = new WebSocket.Server({ server }) // http, websocket 둘 다 돌릴 수 있음

const sockets = [];

wss.on('connection', (socket) => {
  sockets.push(socket);
  socket['nickname'] = 'Anon';
  console.log('Connected to Browser 💥')
  socket.on("close", () => console.log('Disconnected from Browser 💨'))
  socket.on("message", (msg) => {
    const message = JSON.parse(msg)
    switch (message.type) {
      case 'new_message':
        sockets.forEach(aSocket => aSocket.send(`${socket.nickname}: ${message.payload}`));
        break;
      case 'nickname':
        socket['nickname'] = message.payload
        break;
      default:
        break;
    }
  })
  socket.send('hello')
})

server.listen(PORT, handleListen);