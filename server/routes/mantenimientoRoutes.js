const express = require('express');
const router = express.Router();
const mantenimientoController = require('../controllers/mantenimientoController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', mantenimientoController.getMantenimientos);
router.post('/:id/iniciar', mantenimientoController.iniciarMantenimiento);
router.patch('/:id/diagnostico', mantenimientoController.actualizarDiagnostico);
router.post('/:id/finalizar', mantenimientoController.finalizarMantenimiento);

module.exports = router;
