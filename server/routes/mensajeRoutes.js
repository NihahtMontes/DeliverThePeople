const express = require('express');
const router = express.Router();
const mensajeController = require('../controllers/mensajeController');
const { auth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(auth);

router.get('/', mensajeController.getMensajes);
router.post('/', roleGuard('admin', 'gerente', 'despachador'), mensajeController.enviarMensaje);

module.exports = router;
