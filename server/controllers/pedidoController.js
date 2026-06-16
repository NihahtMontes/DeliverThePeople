const { pool } = require('../config/db');

// ── GET: Listar pedidos (scoped por sucursal) ──
async function getPedidos(req, res, next) {
  try {
    const sucursalId = req.user.sucursal_id;
    const rol = req.user.rol;

    let result;
    const baseSql = `
      SELECT p.*,
             c.nombre AS cocinero_nombre,
             c.apellido AS cocinero_apellido,
             d.nombre AS despachador_nombre,
             d.apellido AS despachador_apellido,
             COALESCE(
               (SELECT json_agg(json_build_object(
                 'id', ip.id,
                 'nombre', ip.nombre,
                 'cantidad', ip.cantidad,
                 'notas', ip.notas
               ))
               FROM items_pedido ip
               WHERE ip.pedido_id = p.id
               ), '[]'::json) AS items
      FROM pedidos p
      LEFT JOIN empleados c ON p.cocinero_asignado_id = c.id
      LEFT JOIN empleados d ON p.despachador_asignado_id = d.id
    `;

    if (rol === 'admin' || rol === 'administrador' || !sucursalId) {
      result = await pool.query(baseSql + ` ORDER BY p.fecha_creacion DESC`);
    } else {
      result = await pool.query(baseSql + ` WHERE p.sucursal_id = $1 ORDER BY p.fecha_creacion DESC`, [sucursalId]);
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
    const { estado } = req.query;

    const estadosCola = estado ? [estado] : ['pendiente', 'en_preparacion'];
    const params = [];
    let paramIndex = 0;

    let sql = `
      SELECT DISTINCT p.*,
             c.nombre AS cocinero_nombre,
             c.apellido AS cocinero_apellido,
             COALESCE(
               (SELECT jsonb_agg(jsonb_build_object(
                 'id', ip.id,
                 'nombre', ip.nombre,
                 'cantidad', ip.cantidad,
                 'notas', ip.notas
               ))
               FROM items_pedido ip
               WHERE ip.pedido_id = p.id
               ), '[]'::jsonb) AS items
      FROM pedidos p
      LEFT JOIN empleados c ON p.cocinero_asignado_id = c.id
      WHERE p.estado = ANY($${++paramIndex})
    `;
    params.push(estadosCola);

    if (!(rol === 'admin' || rol === 'administrador' || !sucursalId)) {
      sql += ` AND p.sucursal_id = $${++paramIndex}`;
      params.push(sucursalId);
    }

    sql += ` ORDER BY p.fecha_creacion ASC`;

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
    const { numero_pedido, nombre_cliente, telefono_cliente, direccion_cliente, notas } = req.body;

    if (!numero_pedido || !nombre_cliente) {
      return res.status(400).json({ error: 'numero_pedido y nombre_cliente son obligatorios.' });
    }

    const result = await pool.query(
      `INSERT INTO pedidos (numero_pedido, sucursal_id, nombre_cliente, telefono_cliente, direccion_cliente, estado, notas, fecha_creacion)
       VALUES ($1, $2, $3, $4, $5, 'pendiente', $6, now()) RETURNING *`,
      [numero_pedido, sucursalId, nombre_cliente, telefono_cliente || null, direccion_cliente || null, notas || null]
    );

    const pedido = result.rows[0];

    await pool.query(
      `INSERT INTO historial_pedido (pedido_id, estado_anterior, estado_nuevo, cambiado_por, fecha_cambio)
       VALUES ($1, NULL, 'pendiente', $2, now())`,
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
    if (pedidoRes.rows[0].estado !== 'pendiente') {
      throw new Error('Solo se puede tomar un pedido en estado pendiente.');
    }

    const updated = await client.query(
      `UPDATE pedidos 
       SET estado = 'en_preparacion', cocinero_asignado_id = $1, fecha_creacion = now() 
       WHERE id = $2 RETURNING *`,
      [cocineroId, id]
    );

    await client.query(
      `INSERT INTO historial_pedido (pedido_id, estado_anterior, estado_nuevo, cambiado_por, fecha_cambio)
       VALUES ($1, 'pendiente', 'en_preparacion', $2, now())`,
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
    if (pedidoRes.rows[0].estado !== 'en_preparacion') {
      throw new Error('El pedido no esta en preparacion.');
    }

    const updated = await client.query(
      `UPDATE pedidos 
       SET estado = 'terminado', fecha_creacion = now() 
       WHERE id = $1 RETURNING *`,
      [id]
    );

    await client.query(
      `INSERT INTO historial_pedido (pedido_id, estado_anterior, estado_nuevo, cambiado_por, fecha_cambio)
       VALUES ($1, 'en_preparacion', 'terminado', $2, now())`,
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

// ── PATCH: Entregar pedido — TERMINADO → ENTREGADO (CU50) ──
async function entregarPedido(req, res, next) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const despachadorId = req.user.id;

    await client.query('BEGIN');

    const pedidoRes = await client.query(
      `SELECT * FROM pedidos WHERE id = $1 FOR UPDATE`,
      [id]
    );
    if (pedidoRes.rows.length === 0) throw new Error('Pedido no encontrado.');
    if (pedidoRes.rows[0].estado !== 'terminado') {
      throw new Error('Solo se puede entregar un pedido en estado terminado.');
    }

    const updated = await client.query(
      `UPDATE pedidos 
       SET estado = 'entregado', tiempo_real_entrega = now(), despachador_asignado_id = $2
       WHERE id = $1 RETURNING *`,
      [id, despachadorId]
    );

    await client.query(
      `INSERT INTO historial_pedido (pedido_id, estado_anterior, estado_nuevo, cambiado_por, fecha_cambio)
       VALUES ($1, 'terminado', 'entregado', $2, now())`,
      [id, despachadorId]
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
    if (['cancelado', 'entregado'].includes(pedidoRes.rows[0].estado)) {
      throw new Error(`No se puede cancelar un pedido en estado ${pedidoRes.rows[0].estado}.`);
    }

    const estadoAnterior = pedidoRes.rows[0].estado;

    const updated = await client.query(
      `UPDATE pedidos SET estado = 'cancelado', motivo_cancelacion = $2, fecha_creacion = now() WHERE id = $1 RETURNING *`,
      [id, motivo || null]
    );

    await client.query(
      `INSERT INTO historial_pedido (pedido_id, estado_anterior, estado_nuevo, cambiado_por, fecha_cambio)
       VALUES ($1, $2, 'cancelado', $3, now())`,
      [id, estadoAnterior, empleadoId]
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
  entregarPedido,
  cancelarPedido
};
