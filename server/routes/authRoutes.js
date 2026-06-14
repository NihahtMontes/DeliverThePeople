const express = require('express');
const rateLimit = require('express-rate-limit');
const { login, me } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Demasiados intentos de login. Intenta de nuevo en 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, login);
router.get('/me', auth, me);

module.exports = router;
