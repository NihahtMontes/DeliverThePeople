const express = require('express');
const {
  listarEmpleados,
  obtenerEmpleado,
  crearEmpleado,
  actualizarEmpleado,
  actualizarEstado,
  listarSucursales
} = require('../controllers/empleadoController');
const { auth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

const router = express.Router();

router.use(auth, roleGuard('admin', 'gerente'));
router.get('/catalogos/sucursales', listarSucursales);
router.get('/', listarEmpleados);
router.get('/:id', obtenerEmpleado);
router.post('/', crearEmpleado);
router.put('/:id', actualizarEmpleado);
router.patch('/:id/estado', actualizarEstado);

module.exports = router;
