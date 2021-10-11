const socket = new WebSocket(`ws://${window.location.host}`)
const $messageList = document.querySelector('ul')
const $nickForm = document.querySelector('#nick')
const $messageForm = document.querySelector('#message')

function makeMessage(type, payload) {
  const msg = { type, payload }
  return JSON.stringify(msg)
}

socket.addEventListener('open', () => {
  console.log('Connected to Server 💥')
})

socket.addEventListener('message', (message) => {
  const $messageLi = document.createElement('li');
  $messageLi.innerText = message.data
  $messageList.appendChild($messageLi)
})

socket.addEventListener('close', () => {
  console.log('Disconnected from Server 💨')
})

function handleSubmit(event) {
  event.preventDefault();
  const input = $messageForm.querySelector('input')
  socket.send(makeMessage('new_message', input.value));
  const $messageLi = document.createElement('li');
  $messageLi.innerText = `You: ${input.value}`;
  $messageList.appendChild($messageLi)
  input.value = '';
}

function handleNickSubmit(event) {
  event.preventDefault();
  const input = $nickForm.querySelector('input')
  socket.send(makeMessage('nickname', input.value));
}

$messageForm.addEventListener('submit', handleSubmit)
$nickForm.addEventListener('submit', handleNickSubmit)