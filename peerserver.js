// ============================================================
// focus ~ PeerJS Signaling Server
// ============================================================
// Setup (one time only):
//   npm install peer
//
// Run:
//   node peerserver.js
//
// Then open your site — room.html will connect to this server.
// Keep this running in the background while using study rooms.
// ============================================================

const { PeerServer } = require('peer');

const PORT = 9000;

const server = PeerServer({
    port: PORT,
    path: '/focus',
    allow_discovery: true,
    proxied: false,
    corsOptions: {
        origin: '*',
        methods: ['GET', 'POST'],
    }
});

server.on('connection', (client) => {
    console.log(`[+] Peer connected: ${client.getId()}`);
});

server.on('disconnect', (client) => {
    console.log(`[-] Peer disconnected: ${client.getId()}`);
});

console.log(`\n✅ Focus PeerJS server running on port ${PORT}`);
console.log(`   Path: http://localhost:${PORT}/focus`);
console.log(`   Keep this running while using study rooms.\n`);