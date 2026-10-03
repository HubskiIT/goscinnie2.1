const fs = require('fs');
const path = require('path');

const nextDir = path.join(__dirname, '../.next');
if (fs.existsSync(nextDir)) {
  try {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('[clean] Removed stale .next directory');
  } catch (err) {
    console.warn('[clean] Warning cleaning .next:', err.message);
  }
}
