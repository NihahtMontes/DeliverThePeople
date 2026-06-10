const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'deliver_the_people_2026_seguro';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function sign(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verify(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { sign, verify };
