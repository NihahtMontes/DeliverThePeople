const express = require('express');
const router = express.Router();
const incidenciaController = require('../controllers/incidenciaController');
const { auth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(auth);

router.get('/', incidenciaController.getIncidencias);
router.post('/', roleGuard('admin', 'gerente', 'cocinero'), incidenciaController.crearIncidencia);
router.patch('/:id/cerrar', roleGuard('admin', 'gerente', 'cocinero'), incidenciaController.cerrarIncidencia);

module.exports = router;
