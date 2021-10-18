const socket = io();

const myFace = document.getElementById('myFace')
const muteBtn = document.getElementById('mute')
const cameraBtn = document.getElementById('camera')
const camerasSelect = document.getElementById('cameras')
const microphonesSelect = document.getElementById('microphones')

const call = document.getElementById('call')
call.hidden = true

let myStream;
let myPeerConnection;
let muted = false;
let cameraOff = false;
let audioId = null;
let cameraId = null;
let roomName;
let myDataChannel;

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const cameras = devices.filter(device => device.kind === 'videoinput')
    cameras.forEach(camera => {
      const option = document.createElement('option')
      option.value = camera.deviceId
      option.innerText = camera.label
      camerasSelect.appendChild(option)
    })
  } catch (e) {
    console.log(e)
  }
}

async function getMicrophones() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const microphones = devices.filter(device => device.kind === 'audioinput')
    microphones.forEach(mic => {
      const option = document.createElement('option')
      option.value = mic.deviceId
      option.innerText = mic.label
      microphonesSelect.appendChild(option)
    })
  } catch (e) {
    console.log(e)
  }
}

async function getMedia(audioId = null, cameraId = null) {
  const constrains = {
    audio: true,
    video: true,
    // video: { facingMode: 'user' },
  }
  if (audioId) {
    constrains['audio'] = { deviceId: { exact: audioId } }
  }
  if (cameraId) {
    constrains['video'] = { deviceId: { exact: cameraId } }
  }
  try {
    myStream = await navigator.mediaDevices.getUserMedia(constrains);
    myFace.srcObject = myStream
    if (!cameraId && !audioId) {
      await getCameras();
      await getMicrophones();
      handleMuteClick();
    }
  } catch (e) {
    console.log(e);
  }
}

function handleMuteClick() {
  myStream.getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled))
  if (!muted) {
    muteBtn.innerText = 'Unmute'
    muted = !muted
  } else {
    muteBtn.innerText = 'Mute'
    muted = !muted
  }
}
function handleCameraClick() {
  myStream.getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled))
  if (cameraOff) {
    cameraBtn.innerText = 'Turn Camera Off'
    cameraOff = !cameraOff
  } else {
    cameraBtn.innerText = 'Turn Camera On'
    cameraOff = !cameraOff
  }
}

function replaceTrack() {
  //id가 달라지는듯함 한 track바뀌어도 모든 track을 갱신해줘야 반영됨
  const tracks = myStream.getTracks()
  const sender = myPeerConnection.getSenders()
    .find((sender) => {
      const newTrack = tracks.find(track => sender.track.kind === track.kind)
      sender.replaceTrack(newTrack)
    });
}

async function handleCameraChange() {
  cameraId = camerasSelect.value
  await getMedia(audioId, cameraId)
  if (myPeerConnection) {
    replaceTrack()
  }
};

async function handleMicChange() {
  audioId = microphonesSelect.value
  await getMedia(audioId, cameraId)
  if (myPeerConnection) {
    replaceTrack()
  }
};

muteBtn.addEventListener('click', handleMuteClick)
cameraBtn.addEventListener('click', handleCameraClick)
camerasSelect.addEventListener('input', handleCameraChange)
microphonesSelect.addEventListener('input', handleMicChange)

//join the room

const welcome = document.getElementById('welcome')
const welcomeForm = welcome.querySelector('form')

async function initCall() {
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  makeConnection() //start RTC
}

async function handleWelcomeSubmit(event) {
  event.preventDefault();
  const input = welcomeForm.querySelector('input')
  roomName = input.value
  await initCall(); //Start Call
  socket.emit('join_room', roomName)
  input.value = ''
}

welcomeForm.addEventListener('submit', handleWelcomeSubmit)

//RTC Code
//RTCPeerConnection 객체를 만들고 stream의 track들을 add해준다.
function makeConnection() {
  //google Stun서버 사용, 공용 주소를 알아내기 위해 사용, 실제 서비스에서는 직접 구성
  const stunConfig = {
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",
        ],
      },
    ],
  }
  myPeerConnection = new RTCPeerConnection(stunConfig);
  myPeerConnection.addEventListener('icecandidate', handleIce);
  myPeerConnection.addEventListener('addstream', handleAddStream);
  myStream.getTracks().forEach(track => myPeerConnection.addTrack(track, myStream))
}

function handleIce(data) {
  const ice = data.candidate
  socket.emit('ice', ice, roomName)
  console.log('sent ice candidate')
}

function handleAddStream(data) {
  console.log('got an event from my peer')
  console.log("My Stream", myStream)
  console.log("Peer's Stream", data.stream)
  const peerFace = document.getElementById('peerFace')
  peerFace.srcObject = data.stream
}

//Socket Code 
//협상 과정 negotiation
//set(Local & Remote)Description -> icecandidate Event occur -> RTC.addIceCandidate(ice) -> connected -> addstream event 

socket.on('welcome', async () => {
  myDataChannel = myPeerConnection.createDataChannel("chat")
  myDataChannel.addEventListener('message', (event) => console.log(event.data))
  console.log('made data channel');

  const offer = await myPeerConnection.createOffer()
  myPeerConnection.setLocalDescription(offer)
  socket.emit('offer', offer, roomName);
  console.log('sent the offer')
})

socket.on("offer", async (offer) => {
  myPeerConnection.addEventListener('datachannel', (event) => {
    myDataChannel = event.channel;
    myDataChannel.addEventListener('message', (event) => console.log(event.data))
  })


  console.log('receive the offer')
  myPeerConnection.setRemoteDescription(offer)
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer)
  socket.emit('answer', answer, roomName);
  console.log('sent the answer')
})

socket.on('answer', (answer) => {
  console.log('receive the answer')
  myPeerConnection.setRemoteDescription(answer)
})

socket.on('ice', (ice) => {
  console.log('receive the ice')
  myPeerConnection.addIceCandidate(ice)
})