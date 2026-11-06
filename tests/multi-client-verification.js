const { io } = require('socket.io-client');

async function runMultiClientVerification() {
  console.log('--- Starting Multi-User Real-Time Client Verification ---');

  const serverUrl = 'http://localhost:3000';
  const roomId = 'room_test_verification';

  // Client 1: Alice (Non-Speaking AAC Communicator)
  const clientA = io(serverUrl, { path: '/socket.io' });

  // Client 2: Bob (Deaf Participant relying on live captions)
  const clientB = io(serverUrl, { path: '/socket.io' });

  let clientBReceivedCaption = false;
  let clientAReceivedHandRaise = false;

  await new Promise((resolve, reject) => {
    let connectedCount = 0;
    const checkConnected = () => {
      connectedCount++;
      if (connectedCount === 2) resolve(true);
    };

    clientA.on('connect', () => {
      console.log('✓ Client A (Alice - AAC User) connected:', clientA.id);
      checkConnected();
    });

    clientB.on('connect', () => {
      console.log('✓ Client B (Bob - Caption User) connected:', clientB.id);
      checkConnected();
    });

    setTimeout(() => reject(new Error('Connection timeout')), 5000);
  });

  // Client A joins room
  clientA.emit('room:join', {
    roomId,
    user: {
      id: 'user_alice',
      name: 'Alice',
      avatar: 'AL',
      role: 'host',
      isMuted: false,
      isSpeaking: false,
      isHandRaised: false,
      isAacUser: true,
      volume: 100,
      joinedAt: Date.now(),
    },
  });

  // Client B joins room
  clientB.emit('room:join', {
    roomId,
    user: {
      id: 'user_bob',
      name: 'Bob',
      avatar: 'BB',
      role: 'speaker',
      isMuted: false,
      isSpeaking: false,
      isHandRaised: false,
      isAacUser: false,
      volume: 95,
      joinedAt: Date.now(),
    },
  });

  // Setup listeners
  clientB.on('caption:new', (caption) => {
    console.log(`✓ Client B received real-time caption from ${caption.speakerName}: "${caption.text}" (AAC: ${caption.isAac})`);
    if (caption.text === 'I would like to speak.' && caption.isAac) {
      clientBReceivedCaption = true;
    }
  });

  clientA.on('user:hand', (data) => {
    console.log(`✓ Client A received hand-raise from ${data.userId}: isRaised=${data.isRaised}`);
    if (data.userId === 'user_bob' && data.isRaised) {
      clientAReceivedHandRaise = true;
    }
  });

  // Wait 500ms for room join propagation
  await new Promise((r) => setTimeout(r, 500));

  // Client A broadcasts an AAC synthesized speech caption
  console.log('Client A broadcasting AAC speech message into room...');
  clientA.emit('caption:new', {
    id: 'cap_1',
    speakerId: 'user_alice',
    speakerName: 'Alice',
    text: 'I would like to speak.',
    timestamp: Date.now(),
    isAac: true,
    language: 'en',
  });

  // Client B raises hand to speak
  console.log('Client B raising hand...');
  clientB.emit('user:hand', {
    userId: 'user_bob',
    isRaised: true,
  });

  // Wait 1000ms for delivery
  await new Promise((r) => setTimeout(r, 1000));

  clientA.disconnect();
  clientB.disconnect();

  if (clientBReceivedCaption && clientAReceivedHandRaise) {
    console.log('=== MULTI-USER VERIFICATION PASSED SUCCESSFULLY! ===');
    process.exit(0);
  } else {
    console.error('Multi-user verification failed to receive expected events.');
    process.exit(1);
  }
}

runMultiClientVerification().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
