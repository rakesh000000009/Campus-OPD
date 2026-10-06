function errorHandler(err, req, res, next) {
  console.error('API Error:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'An unexpected server error occurred',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}

module.exports = errorHandler;
