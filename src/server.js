import http from "http";
import SocketIO from 'socket.io'
import express from "express";
import { WSA_E_CANCELLED } from 'constants';

const PORT = 5000
const app = express();
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use('/public', express.static(__dirname + '/public'));
app.get('/', (req, res) => res.render('home'));
app.get('/*', (req, res) => res.redirect('/'));

const httpServer = http.createServer(app)
const wsServer = SocketIO(httpServer)

const handleListen = () => console.log(`Listening on http&ws://localhost:${PORT}`)
httpServer.listen(PORT, handleListen);

wsServer.on('connection', (socket) => {
  socket.on('join_room', (roomName) => {
    socket.join(roomName)
    socket.to(roomName).emit('welcome')
  })
  socket.on('offer', (offer, roomName) => {
    socket.to(roomName).emit("offer", offer)
  })
  socket.on('answer', (answer, roomName) => {
    socket.to(roomName).emit("answer", answer)
  })
  socket.on('ice', (ice, roomName) => {
    socket.to(roomName).emit("ice", ice)
  })
})