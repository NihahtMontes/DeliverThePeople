const express = require('express');
const router = express.Router();
const { getInventario, crearInsumo, editarInsumo, inactivarInsumo, reactivarInsumo, registrarMovimiento, getMovimientos } = require('../controllers/inventarioController');
const { auth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.get('/', auth, getInventario);
router.post('/', auth, roleGuard('administrador', 'admin', 'gerente'), crearInsumo);
router.put('/:id', auth, roleGuard('administrador', 'admin', 'gerente'), editarInsumo);
router.put('/:id/estado', auth, roleGuard('administrador', 'admin', 'gerente'), inactivarInsumo);
router.put('/:id/reactivar', auth, roleGuard('administrador', 'admin', 'gerente'), reactivarInsumo);
router.post('/:id/movimiento', auth, roleGuard('administrador', 'admin', 'gerente'), registrarMovimiento);
router.get('/:id/movimientos', auth, getMovimientos);

module.exports = router;
