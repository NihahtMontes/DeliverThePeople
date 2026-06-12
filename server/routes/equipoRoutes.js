const express = require('express');
const router = express.Router();
const equipoController = require('../controllers/equipoController');
const { auth } = require('../middleware/auth');

// Rutas protegidas por autenticación
router.use(auth);

// CRUD de Equipos
router.get('/', equipoController.getEquipos);
router.post('/', equipoController.createEquipo);
router.put('/:id', equipoController.updateEquipo);
router.delete('/:id', equipoController.deleteEquipo);

module.exports = router;
