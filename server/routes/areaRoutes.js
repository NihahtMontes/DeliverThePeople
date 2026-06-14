const express = require('express');
const { listarAreas, obtenerArea, crearArea, actualizarArea } = require('../controllers/areaController');
const { auth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

const router = express.Router();
router.use(auth, roleGuard('admin', 'gerente', 'cocinero', 'despachador', 'aseo', 'mantenimiento', 'tecnico'));
router.get('/', listarAreas);
router.get('/:id', obtenerArea);
router.post('/', roleGuard('admin', 'gerente'), crearArea);
router.put('/:id', roleGuard('admin', 'gerente'), actualizarArea);

module.exports = router;
