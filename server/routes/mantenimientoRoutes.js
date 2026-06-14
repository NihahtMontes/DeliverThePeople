const express = require('express');
const router = express.Router();
const mantenimientoController = require('../controllers/mantenimientoController');
const { auth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(auth);

router.get('/', mantenimientoController.getMantenimientos);
router.post('/:id/iniciar', roleGuard('administrador', 'admin', 'gerente', 'tecnico'), mantenimientoController.iniciarMantenimiento);
router.patch('/:id/diagnostico', roleGuard('administrador', 'admin', 'gerente', 'tecnico'), mantenimientoController.actualizarDiagnostico);
router.post('/:id/finalizar', roleGuard('administrador', 'admin', 'gerente', 'tecnico'), mantenimientoController.finalizarMantenimiento);

module.exports = router;
