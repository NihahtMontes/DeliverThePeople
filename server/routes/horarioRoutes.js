const express = require('express');
const { listarHorarios, crearHorario, actualizarHorario, registrarEntrada, registrarSalida } = require('../controllers/horarioController');
const { auth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

const router = express.Router();
router.use(auth, roleGuard('admin', 'gerente'));
router.get('/', listarHorarios);
router.post('/', crearHorario);
router.put('/:id', actualizarHorario);
router.patch('/:id/entrada', registrarEntrada);
router.patch('/:id/salida', registrarSalida);

module.exports = router;
