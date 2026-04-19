const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const { method, originalUrl, ip } = req;
  
  console.log(`[${timestamp}] ${method} ${originalUrl} - ${ip}`);
  
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    console.log(`[${timestamp}] ${method} ${originalUrl} - ${statusCode} - ${duration}ms`);
  });
  
  next();
};

module.exports = { requestLogger };