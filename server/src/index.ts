import app from './app';
import { config } from './config';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`
=============================================================
  ⚡ TURFZONE Backend API Server Online
  🌐 Port: http://localhost:${PORT}
  📡 Health: http://localhost:${PORT}/api/health
  🛡️  Admin API: http://localhost:${PORT}/api/admin/overview
=============================================================
  `);
});
