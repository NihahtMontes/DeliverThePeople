const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');
const { auth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(auth);

router.get('/', pagoController.getPagos);
router.get('/pedido/:pedido_id', pagoController.getPagosByPedido);
router.post('/', roleGuard('admin', 'gerente', 'cajero', 'despachador'), pagoController.registrarPago);
router.delete('/:id', roleGuard('admin', 'gerente'), pagoController.eliminarPago);

module.exports = router;
