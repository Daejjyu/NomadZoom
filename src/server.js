import http from "http";
import SocketIO from 'socket.io'
import express from "express";

const PORT = 5000
const app = express();
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use('/public', express.static(__dirname + '/public'));
app.get('/', (req, res) => res.render('home'));
app.get('/*', (req, res) => res.redirect('/'));

// app.listen(5000); // websocket 을 하기 위해 밑처럼 변경
const httpServer = http.createServer(app) // websocket 을 하기 위해 변경
const wsServer = SocketIO(httpServer)

function publicRooms() {
  const { sockets: { adapter: { sids, rooms } } } = wsServer;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  })
  return publicRooms;
}

function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

const handleListen = () => console.log(`Listening on http&ws://localhost:${PORT}`)
httpServer.listen(PORT, handleListen);

wsServer.on("connection", (socket) => {
  socket["nickname"] = 'Anon'
  socket.onAny((event) => {
    console.log(`Socket Event:${event}`)
  });
  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName)
    done()
    socket.to(roomName).emit('welcome', socket.nickname, countRoom(roomName));
    wsServer.sockets.emit('room_change', publicRooms());
  });
  socket.on('nickname', (nickname) => (socket["nickname"] = nickname));
  socket.on("new_message", (msg, roomName, done) => {
    socket.to(roomName).emit('new_message', `${socket.nickname}: ${msg}`);
    done()
  });
  socket.on('disconnecting', () => {
    socket.rooms.forEach((room) => socket.to(room).emit('bye', socket.nickname, countRoom(room) - 1));
  })
  socket.on('disconnect', () => {
    wsServer.sockets.emit('room_change', publicRooms());
  })
})