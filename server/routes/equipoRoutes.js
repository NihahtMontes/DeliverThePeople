const express = require('express');
const router = express.Router();
const equipoController = require('../controllers/equipoController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', equipoController.getEquipos);
router.post('/', equipoController.createEquipo);
router.put('/:id', equipoController.updateEquipo);
router.delete('/:id', equipoController.bajaEquipo);
router.post('/:id/reactivar', equipoController.reactivarEquipo);
router.patch('/:id/estado', equipoController.patchEquipoEstado);
router.post('/:id/mantenimiento', equipoController.solicitarMantenimiento);

module.exports = router;
