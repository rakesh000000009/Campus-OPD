const http = require('http');
const app = require('./app');
const config = require('./config/config');
const { initDb } = require('./config/db');
const { initSocket } = require('./services/socketService');

async function startServer() {
  try {
    // 1. Ensure DB schema exists
    await initDb();

    // 2. Create HTTP server and attach Socket.IO
    const server = http.createServer(app);
    initSocket(server, config.clientUrl);

    // 3. Start listening
    server.listen(config.port, () => {
      console.log(`Campus OPD Backend running on port ${config.port}`);
      console.log(`Health check: http://localhost:${config.port}/api/health`);
    });
  } catch (err) {
    console.error('Fatal error starting server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
