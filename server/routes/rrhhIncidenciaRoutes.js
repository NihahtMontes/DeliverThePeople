const express = require('express');
const { listarIncidencias, crearIncidencia, actualizarEstado } = require('../controllers/rrhhIncidenciaController');
const { auth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

const router = express.Router();
router.use(auth);
router.get('/', listarIncidencias);
router.post('/', crearIncidencia);
router.patch('/:id/estado', roleGuard('admin', 'gerente'), actualizarEstado);

module.exports = router;
