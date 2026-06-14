const { pool } = require('../config/db');

// ── GET: Listar mensajes de cliente (scoped por sucursal, opcional por pedido) ──
async function getMensajes(req, res, next) {
  try {
    const sucursalId = req.user.sucursal_id;
    const rol = req.user.rol;
    const { pedido_id } = req.query;

    const baseSql = `
      SELECT m.*,
             p.numero_orden
      FROM mensajes_cliente m
      LEFT JOIN pedidos p ON m.pedido_id = p.id
    `;

    const conditions = [];
    const params = [];
    let paramIndex = 0;

    if (pedido_id) {
      conditions.push(`m.pedido_id = $${++paramIndex}`);
      params.push(pedido_id);
    }

    if (!(rol === 'admin' || rol === 'administrador' || !sucursalId)) {
      conditions.push(`m.sucursal_id = $${++paramIndex}`);
      params.push(sucursalId);
    }

    let query = baseSql;
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    query += ` ORDER BY m.created_at DESC LIMIT 200`;

    const result = await pool.query(query, params);
    res.json({ mensajes: result.rows });
  } catch (err) {
    next(err);
  }
}

// ── POST: Enviar mensaje a cliente (CU51) ──
async function enviarMensaje(req, res, next) {
  try {
    const sucursalId = req.user.sucursal_id;
    const { mensaje, pedido_id } = req.body;

    if (!mensaje || mensaje.trim().length === 0) {
      return res.status(400).json({ error: 'El mensaje no puede estar vacio.' });
    }

    const result = await pool.query(
      `INSERT INTO mensajes_cliente (sucursal_id, pedido_id, mensaje, created_at)
       VALUES ($1, $2, $3, now()) RETURNING *`,
      [sucursalId, pedido_id || null, mensaje.trim()]
    );

    res.status(201).json({ mensaje: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMensajes,
  enviarMensaje
};
