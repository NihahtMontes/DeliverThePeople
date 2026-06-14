const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');
const { auth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(auth);

router.get('/', pedidoController.getPedidos);
router.get('/cola', pedidoController.getColaProduccion);
router.post('/', roleGuard('admin', 'gerente', 'cocinero'), pedidoController.crearPedido);
router.post('/:id/tomar', roleGuard('admin', 'gerente', 'cocinero'), pedidoController.tomarPedido);
router.patch('/:id/terminar', roleGuard('admin', 'gerente', 'cocinero'), pedidoController.terminarPedido);
router.patch('/:id/cancelar', roleGuard('admin', 'gerente', 'cocinero'), pedidoController.cancelarPedido);

module.exports = router;
