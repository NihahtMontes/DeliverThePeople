const express = require('express');
const router = express.Router();
const { getInventario, crearInsumo, editarInsumo, inactivarInsumo, reactivarInsumo, registrarMovimiento, getMovimientos } = require('../controllers/inventarioController');
const { auth } = require('../middleware/auth');

// Obtener todos los insumos
router.get('/', auth, getInventario);

// Crear un nuevo insumo (Alta)
router.post('/', auth, crearInsumo);

// Editar datos maestros de un insumo
router.put('/:id', auth, editarInsumo);

// Inactivar un insumo (Baja lógica)
router.put('/:id/estado', auth, inactivarInsumo);

// Reactivar un insumo (Alta nuevamente)
router.put('/:id/reactivar', auth, reactivarInsumo);

// Registrar movimiento (Ingreso / Merma)
router.post('/:id/movimiento', auth, registrarMovimiento);

// Obtener bitácora de movimientos de un insumo
router.get('/:id/movimientos', auth, getMovimientos);

module.exports = router;
