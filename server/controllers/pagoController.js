const { pool } = require('../config/db');

// ── GET: Listar todos los pagos (scoped por sucursal) ──
async function getPagos(req, res, next) {
  try {
    const sucursalId = req.user.sucursal_id;
    const rol = req.user.rol;

    const baseSql = `
      SELECT p.*,
             e.nombre AS registrado_por_nombre,
             e.apellido AS registrado_por_apellido,
             ped.numero_orden,
             ped.mesa,
             ped.total AS pedido_total,
             ped.estado AS pedido_estado
      FROM pagos p
      LEFT JOIN empleados e ON p.registrado_por = e.id
      LEFT JOIN pedidos ped ON p.pedido_id = ped.id
    `;

    let result;
    if (rol === 'admin' || rol === 'administrador' || !sucursalId) {
      result = await pool.query(baseSql + ` ORDER BY p.created_at DESC`);
    } else {
      result = await pool.query(
        baseSql + ` WHERE ped.sucursal_id = $1 ORDER BY p.created_at DESC`,
        [sucursalId]
      );
    }

    res.json({ pagos: result.rows });
  } catch (err) {
    next(err);
  }
}

// ── GET: Pagos de un pedido especifico ──
async function getPagosByPedido(req, res, next) {
  try {
    const { pedido_id } = req.params;
    const result = await pool.query(
      `SELECT p.*, e.nombre AS registrado_por_nombre, e.apellido AS registrado_por_apellido
       FROM pagos p
       LEFT JOIN empleados e ON p.registrado_por = e.id
       WHERE p.pedido_id = $1
       ORDER BY p.created_at DESC`,
      [pedido_id]
    );
    res.json({ pagos: result.rows });
  } catch (err) {
    next(err);
  }
}

// ── POST: Registrar pago (CU11) ──
async function registrarPago(req, res, next) {
  const client = await pool.connect();
  try {
    const { pedido_id, monto, metodo } = req.body;
    const registradoPor = req.user.id;

    if (!pedido_id || monto === undefined || monto === null) {
      return res.status(400).json({ error: 'pedido_id y monto son obligatorios.' });
    }

    await client.query('BEGIN');

    // Verificar que el pedido existe
    const pedidoRes = await client.query(
      `SELECT * FROM pedidos WHERE id = $1`,
      [pedido_id]
    );
    if (pedidoRes.rows.length === 0) {
      throw new Error('Pedido no encontrado.');
    }
    const pedido = pedidoRes.rows[0];

    // Verificar que el pedido no esté cancelado
    if (pedido.estado === 'CANCELADO') {
      throw new Error('No se puede registrar pago para un pedido cancelado.');
    }

    const result = await client.query(
      `INSERT INTO pagos (pedido_id, monto, metodo, estado, registrado_por, created_at, updated_at)
       VALUES ($1, $2, $3, 'completado', $4, now(), now()) RETURNING *`,
      [pedido_id, monto, metodo || 'efectivo', registradoPor]
    );

    await client.query('COMMIT');
    res.status(201).json({ pago: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
}

// ── DELETE: Eliminar pago (solo admin/gerente) ──
async function eliminarPago(req, res, next) {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM pagos WHERE id = $1`, [id]);
    res.json({ message: 'Pago eliminado.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPagos,
  getPagosByPedido,
  registrarPago,
  eliminarPago
};
