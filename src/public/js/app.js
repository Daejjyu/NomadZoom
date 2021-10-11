const socket = io();

const $welcome = document.getElementById('welcome');
const $roomForm = $welcome.querySelector('form');
const $room = document.getElementById('room');
const $nameForm = $room.querySelector('#name');
const $messageForm = $room.querySelector('#msg');
$room.hidden = true;

let roomName;

function addMessage(message) {
  const ul = $room.querySelector('ul')
  const li = document.createElement('li')
  li.innerText = message
  console.log(message)
  ul.appendChild(li);
}

function showRoom() {
  $welcome.hidden = true;
  $room.hidden = false;
  const h3 = room.querySelector('h3');
  h3.innerText = `Room ${roomName}`;
}

function handleRoomSubmit(event) {
  event.preventDefault();
  const input = $roomForm.querySelector('input');
  roomName = input.value
  socket.emit("enter_room", roomName, showRoom);
}

function handleMessageSubmit(event) {
  event.preventDefault();
  const input = room.querySelector('#msg input')
  const value = input.value
  socket.emit('new_message', value, roomName, () => {
    addMessage(`You: ${value}`);
  })
  input.value = '';
}
function handleNicknameSubmit(event) {
  event.preventDefault();
  const input = room.querySelector('#name input')
  const value = input.value
  socket.emit('nickname', value, roomName, () => {
  })
  input.value = '';
}
$roomForm.addEventListener('submit', handleRoomSubmit);
$messageForm.addEventListener('submit', handleMessageSubmit);
$nameForm.addEventListener('submit', handleNicknameSubmit);



socket.on('welcome', (nickname, newCount) => {
  const h3 = room.querySelector('h3');
  h3.innerText = `Room ${roomName} (${newCount})`;
  addMessage(`${nickname} joined!`)
})

socket.on('bye', (nickname, newCount) => {
  const h3 = room.querySelector('h3');
  h3.innerText = `Room ${roomName} (${newCount})`;
  addMessage(`${nickname} left!`)
})

socket.on('new_message', addMessage)

socket.on('room_change', (rooms) => {
  const $roomList = $welcome.querySelector('ul');
  $roomList.innerHTML = ''
  rooms.forEach(room => {
    const li = document.createElement('li');
    li.innerText = room;
    $roomList.append(li)
  })
})