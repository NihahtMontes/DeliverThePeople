const express = require('express');
const router = express.Router();
const equipoController = require('../controllers/equipoController');
const { auth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(auth);

router.get('/', equipoController.getEquipos);
router.post('/', roleGuard('administrador', 'admin', 'gerente'), equipoController.createEquipo);
router.put('/:id', roleGuard('administrador', 'admin', 'gerente'), equipoController.updateEquipo);
router.delete('/:id', roleGuard('administrador', 'admin', 'gerente'), equipoController.bajaEquipo);
router.post('/:id/reactivar', roleGuard('administrador', 'admin', 'gerente'), equipoController.reactivarEquipo);
router.patch('/:id/estado', roleGuard('administrador', 'admin', 'gerente'), equipoController.patchEquipoEstado);
router.post('/:id/mantenimiento', roleGuard('administrador', 'admin', 'gerente'), equipoController.solicitarMantenimiento);

module.exports = router;
