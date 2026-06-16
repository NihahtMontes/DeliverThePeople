const express = require('express');
const { listarTareas, crearTarea, actualizarEstado } = require('../controllers/tareaController');
const { auth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

const router = express.Router();
router.use(auth);
router.get('/', listarTareas);
router.post('/', roleGuard('admin', 'gerente'), crearTarea);
router.patch('/:id/estado', actualizarEstado);

module.exports = router;
