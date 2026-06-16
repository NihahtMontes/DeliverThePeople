const { pool } = require('../config/db');

// ── GET: Listar mensajes de cliente (scoped por sucursal, opcional por pedido) ──
async function getMensajes(req, res, next) {
  try {
    const sucursalId = req.user.sucursal_id;
    const rol = req.user.rol;
    const { pedido_id } = req.query;

    const baseSql = `
      SELECT m.*,
             p.numero_pedido,
             p.nombre_cliente,
             e.nombre AS enviado_por_nombre
      FROM mensajes_cliente m
      LEFT JOIN pedidos p ON m.pedido_id = p.id
      LEFT JOIN empleados e ON m.enviado_por = e.id
    `;

    const conditions = [];
    const params = [];
    let paramIndex = 0;

    if (pedido_id) {
      conditions.push(`m.pedido_id = $${++paramIndex}`);
      params.push(pedido_id);
    }

    if (!(rol === 'admin' || rol === 'administrador' || !sucursalId)) {
      conditions.push(`p.sucursal_id = $${++paramIndex}`);
      params.push(sucursalId);
    }

    let query = baseSql;
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    query += ` ORDER BY m.fecha DESC LIMIT 200`;

    const result = await pool.query(query, params);
    res.json({ mensajes: result.rows });
  } catch (err) {
    next(err);
  }
}

// ── POST: Enviar mensaje a cliente (CU51) ──
async function enviarMensaje(req, res, next) {
  try {
    const enviadoPor = req.user.id;
    const { mensaje, pedido_id } = req.body;

    if (!mensaje || mensaje.trim().length === 0) {
      return res.status(400).json({ error: 'El mensaje no puede estar vacio.' });
    }

    const result = await pool.query(
      `INSERT INTO mensajes_cliente (pedido_id, mensaje, direccion, enviado_por, fecha)
       VALUES ($1, $2, 'hacia_cliente', $3, now()) RETURNING *`,
      [pedido_id || null, mensaje.trim(), enviadoPor]
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
