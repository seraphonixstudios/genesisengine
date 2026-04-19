const promClient = require('prom-client');

const register = new promClient.Registry();

promClient.collectDefaultMetrics({ register });

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpRequestDurationSeconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register]
});

const imageGenerationTotal = new promClient.Counter({
  name: 'image_generation_total',
  help: 'Total number of images generated',
  labelNames: ['model', 'mode', 'status'],
  registers: [register]
});

const imageGenerationDuration = new promClient.Histogram({
  name: 'image_generation_duration_seconds',
  help: 'Duration of image generation in seconds',
  labelNames: ['model', 'mode'],
  buckets: [1, 5, 10, 30, 60, 120, 300],
  registers: [register]
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register]
});

function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  activeConnections.inc();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestsTotal.inc({
      method: req.method,
      route: route,
      status_code: res.statusCode
    });
    
    httpRequestDurationSeconds.observe(
      { method: req.method, route: route, status_code: res.statusCode },
      duration
    );
    
    activeConnections.dec();
  });
  
  next();
}

async function metricsEndpoint(req, res) {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}

module.exports = {
  metricsMiddleware,
  metricsEndpoint,
  imageGenerationTotal,
  imageGenerationDuration,
  register
};
