const { pool } = require('../config/db');

// ── GET: Listar pedidos (scoped por sucursal) ──
async function getPedidos(req, res, next) {
  try {
    const sucursalId = req.user.sucursal_id;
    const rol = req.user.rol;

    let result;
    const baseSql = `
      SELECT p.*,
             e.nombre AS cocinero_nombre,
             COALESCE(
               (SELECT json_agg(json_build_object(
                 'id', ip.id,
                 'item_id', ip.item_id,
                 'nombre', inv.nombre,
                 'categoria', inv.categoria,
                 'cantidad', ip.cantidad,
                 'precio_unitario', ip.precio_unitario,
                 'subtotal', ip.subtotal
               ))
               FROM items_pedido ip
               LEFT JOIN inventario inv ON ip.item_id = inv.id
               WHERE ip.pedido_id = p.id
               ), '[]'::json) AS items
      FROM pedidos p
      LEFT JOIN empleados e ON p.empleado_id = e.id
    `;

    if (rol === 'admin' || rol === 'administrador' || !sucursalId) {
      result = await pool.query(baseSql + ` ORDER BY p.created_at DESC`);
    } else {
      result = await pool.query(baseSql + ` WHERE p.sucursal_id = $1 ORDER BY p.created_at DESC`, [sucursalId]);
    }

    res.json({ pedidos: result.rows });
  } catch (err) {
    next(err);
  }
}

// ── GET: Cola de produccion con filtros (CU44) ──
async function getColaProduccion(req, res, next) {
  try {
    const sucursalId = req.user.sucursal_id;
    const rol = req.user.rol;
    const { ingrediente_id, tiempo_minutos, estado } = req.query;

    const estadosCola = estado ? [estado] : ['PENDIENTE', 'EN_PREPARACION'];
    const params = [];
    let paramIndex = 0;

    let sql = `
      SELECT DISTINCT p.*,
             e.nombre AS cocinero_nombre,
             COALESCE(
               (SELECT jsonb_agg(jsonb_build_object(
                 'id', ip.id,
                 'item_id', ip.item_id,
                 'nombre', inv.nombre,
                 'categoria', inv.categoria,
                 'cantidad', ip.cantidad,
                 'precio_unitario', ip.precio_unitario,
                 'subtotal', ip.subtotal
               ))
               FROM items_pedido ip
               LEFT JOIN inventario inv ON ip.item_id = inv.id
               WHERE ip.pedido_id = p.id
               ), '[]'::jsonb) AS items
      FROM pedidos p
      LEFT JOIN empleados e ON p.empleado_id = e.id
      LEFT JOIN items_pedido ip ON p.id = ip.pedido_id
      LEFT JOIN ingredientes_item ii ON ip.item_id = ii.item_id
      WHERE p.estado = ANY($${++paramIndex})
    `;
    params.push(estadosCola);

    if (!(rol === 'admin' || rol === 'administrador' || !sucursalId)) {
      sql += ` AND p.sucursal_id = $${++paramIndex}`;
      params.push(sucursalId);
    }

    if (ingrediente_id) {
      sql += ` AND ii.ingrediente_id = $${++paramIndex}`;
      params.push(ingrediente_id);
    }

    if (tiempo_minutos) {
      sql += ` AND p.created_at <= NOW() - ($${++paramIndex} || ' minutes')::INTERVAL`;
      params.push(parseInt(tiempo_minutos));
    }

    sql += ` ORDER BY p.created_at ASC`;

    const result = await pool.query(sql, params);
    res.json({ pedidos: result.rows });
  } catch (err) {
    next(err);
  }
}

// ── POST: Crear pedido ──
async function crearPedido(req, res, next) {
  try {
    const sucursalId = req.user.sucursal_id;
    const empleadoId = req.user.id;
    const { total, mesa } = req.body;

    if (total === undefined || total === null) {
      return res.status(400).json({ error: 'El total es obligatorio.' });
    }

    const result = await pool.query(
      `INSERT INTO pedidos (sucursal_id, empleado_id, estado, total, mesa, created_at, updated_at)
       VALUES ($1, $2, 'PENDIENTE', $3, $4, now(), now()) RETURNING *`,
      [sucursalId, empleadoId, total, mesa || null]
    );

    const pedido = result.rows[0];

    await pool.query(
      `INSERT INTO historial_pedido (pedido_id, empleado_id, estado_anterior, estado_nuevo, created_at)
       VALUES ($1, $2, NULL, 'PENDIENTE', now())`,
      [pedido.id, empleadoId]
    );

    res.status(201).json({ pedido });
  } catch (err) {
    next(err);
  }
}

// ── POST: Tomar pedido — PENDIENTE → EN_PREPARACION (CU43a) ──
async function tomarPedido(req, res, next) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const cocineroId = req.user.id;

    await client.query('BEGIN');

    const pedidoRes = await client.query(
      `SELECT * FROM pedidos WHERE id = $1 FOR UPDATE`,
      [id]
    );
    if (pedidoRes.rows.length === 0) throw new Error('Pedido no encontrado.');
    if (pedidoRes.rows[0].estado !== 'PENDIENTE') {
      throw new Error('Solo se puede tomar un pedido en estado PENDIENTE.');
    }

    const updated = await client.query(
      `UPDATE pedidos 
       SET estado = 'EN_PREPARACION', empleado_id = $1, updated_at = now() 
       WHERE id = $2 RETURNING *`,
      [cocineroId, id]
    );

    await client.query(
      `INSERT INTO historial_pedido (pedido_id, empleado_id, estado_anterior, estado_nuevo, created_at)
       VALUES ($1, $2, 'PENDIENTE', 'EN_PREPARACION', now())`,
      [id, cocineroId]
    );

    await client.query('COMMIT');
    res.json({ pedido: updated.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
}

// ── PATCH: Terminar pedido — EN_PREPARACION → TERMINADO (CU43b) ──
async function terminarPedido(req, res, next) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const cocineroId = req.user.id;

    await client.query('BEGIN');

    const pedidoRes = await client.query(
      `SELECT * FROM pedidos WHERE id = $1 FOR UPDATE`,
      [id]
    );
    if (pedidoRes.rows.length === 0) throw new Error('Pedido no encontrado.');
    if (pedidoRes.rows[0].estado !== 'EN_PREPARACION') {
      throw new Error('El pedido no esta en preparacion.');
    }

    const updated = await client.query(
      `UPDATE pedidos 
       SET estado = 'TERMINADO', updated_at = now() 
       WHERE id = $1 RETURNING *`,
      [id]
    );

    await client.query(
      `INSERT INTO historial_pedido (pedido_id, empleado_id, estado_anterior, estado_nuevo, created_at)
       VALUES ($1, $2, 'EN_PREPARACION', 'TERMINADO', now())`,
      [id, cocineroId]
    );

    await client.query('COMMIT');
    res.json({ pedido: updated.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
}

// ── PATCH: Cancelar pedido — ANY → CANCELADO ──
async function cancelarPedido(req, res, next) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const empleadoId = req.user.id;
    const { motivo } = req.body;

    await client.query('BEGIN');

    const pedidoRes = await client.query(
      `SELECT * FROM pedidos WHERE id = $1 FOR UPDATE`,
      [id]
    );
    if (pedidoRes.rows.length === 0) throw new Error('Pedido no encontrado.');
    if (['CANCELADO', 'ENTREGADO'].includes(pedidoRes.rows[0].estado)) {
      throw new Error(`No se puede cancelar un pedido en estado ${pedidoRes.rows[0].estado}.`);
    }

    const estadoAnterior = pedidoRes.rows[0].estado;

    const updated = await client.query(
      `UPDATE pedidos SET estado = 'CANCELADO', updated_at = now() WHERE id = $1 RETURNING *`,
      [id]
    );

    await client.query(
      `INSERT INTO historial_pedido (pedido_id, empleado_id, estado_anterior, estado_nuevo, created_at)
       VALUES ($1, $2, $3, 'CANCELADO', now())`,
      [id, empleadoId, estadoAnterior]
    );

    await client.query('COMMIT');
    res.json({ pedido: updated.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
}

module.exports = {
  getPedidos,
  getColaProduccion,
  crearPedido,
  tomarPedido,
  terminarPedido,
  cancelarPedido
};
