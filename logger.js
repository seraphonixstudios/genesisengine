// ==========================================
// STRUCTURED LOGGER - Routes to Neural-OS
// ==========================================
const NEURAL_OS_URL = process.env.NEURAL_OS_URL || 'http://127.0.0.1:3077';

class GenesisLogger {
  constructor(logDir) {
    this.logDir = logDir;
    this.serviceId = 'genesis-engine';
    this.buffer = [];
    this.flushInterval = setInterval(() => this.flush(), 2000);
    this.ensureDir();
  }

  ensureDir() {
    try {
      if (!fs.existsSync(this.logDir)) fs.mkdirSync(this.logDir, { recursive: true });
    } catch(e) {}
  }

  format(level, message, meta = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceId,
      message,
      ...meta
    };
  }

  write(entry) {
    const line = JSON.stringify(entry) + '\n';
    this.buffer.push(line);
    if (this.buffer.length >= 10) this.flush();
  }

  flush() {
    if (this.buffer.length === 0) return;
    const lines = this.buffer.join('');
    this.buffer = [];
    const logFile = path.join(this.logDir, 'genesis.log');
    try {
      fs.appendFileSync(logFile, lines);
    } catch(e) {
      process.stderr.write('Logger write failed: ' + e.message + '\n');
    }
  }

  info(message, meta) {
    const entry = this.format('INFO', message, meta);
    process.stdout.write('[GENESIS] [INFO] ' + message + '\n');
    this.write(entry);
    return entry;
  }

  warn(message, meta) {
    const entry = this.format('WARN', message, meta);
    process.stderr.write('[GENESIS] [WARN] ' + message + '\n');
    this.write(entry);
    this.forward(entry);
    return entry;
  }

  error(message, meta) {
    const entry = this.format('ERROR', message, meta);
    process.stderr.write('[GENESIS] [ERROR] ' + message + '\n');
    this.write(entry);
    this.forward(entry);
    return entry;
  }

  debug(message, meta) {
    if (process.env.NODE_ENV !== 'production') {
      const entry = this.format('DEBUG', message, meta);
      process.stdout.write('[GENESIS] [DEBUG] ' + message + '\n');
      this.write(entry);
      return entry;
    }
  }

  async forward(entry) {
    try {
      const http = require('http');
      const data = JSON.stringify(entry);
      const req = http.request({
        hostname: '127.0.0.1',
        port: 3077,
        path: '/api/logs/ingest',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
        timeout: 3000
      }, (res) => {
        res.resume();
      });
      req.on('error', () => {}); // Silent fail - don't cascade errors
      req.write(data);
      req.end();
    } catch(e) {} // Best effort forwarding
  }

  request(req, res, duration, statusCode) {
    this.info('HTTP ' + req.method + ' ' + req.path + ' ' + statusCode + ' ' + duration + 'ms', {
      method: req.method,
      path: req.path,
      status: statusCode,
      duration_ms: duration,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent')?.substring(0, 100)
    });
  }
}

// Request logging middleware
function requestLogger(logger) {
  return (req, res, next) => {
    const start = Date.now();
    const originalEnd = res.end;
    res.end = function(...args) {
      const duration = Date.now() - start;
      logger.request(req, res, duration, res.statusCode);
      return originalEnd.apply(this, args);
    };
    next();
  };
}
