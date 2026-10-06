const jwt = require('jsonwebtoken');
const config = require('../config/config');
const UserModel = require('../models/userModel');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication token missing or invalid' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: role '${req.user.role}' is not allowed to access this resource`
      });
    }
    next();
  };
}

module.exports = {
  authenticate,
  authorize
};
