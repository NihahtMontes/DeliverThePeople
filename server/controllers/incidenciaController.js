const { pool } = require('../config/db');

// ── GET: Listar incidencias (scoped por sucursal) ──
async function getIncidencias(req, res, next) {
  try {
    const sucursalId = req.user.sucursal_id;
    const rol = req.user.rol;

    const baseSql = `
      SELECT i.*,
             e.nombre AS reportado_por,
             p.numero_orden AS pedido_numero,
             p.mesa AS pedido_mesa
      FROM incidencias i
      LEFT JOIN empleados e ON i.empleado_id = e.id
      LEFT JOIN pedidos p ON i.pedido_id = p.id
    `;

    let result;
    if (rol === 'admin' || rol === 'administrador' || !sucursalId) {
      result = await pool.query(baseSql + ` ORDER BY i.created_at DESC`);
    } else {
      result = await pool.query(baseSql + ` WHERE i.sucursal_id = $1 ORDER BY i.created_at DESC`, [sucursalId]);
    }

    res.json({ incidencias: result.rows });
  } catch (err) {
    next(err);
  }
}

// ── POST: Crear incidencia (CU45) ──
async function crearIncidencia(req, res, next) {
  const client = await pool.connect();
  try {
    const sucursalId = req.user.sucursal_id;
    const empleadoId = req.user.id;
    const { descripcion, pedido_id, tipo, prioridad, ingrediente_faltante, ingrediente_alternativo } = req.body;

    if (!descripcion) {
      return res.status(400).json({ error: 'La descripcion es obligatoria.' });
    }

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO incidencias (sucursal_id, empleado_id, descripcion, estado, tipo, prioridad, pedido_id, ingrediente_faltante, ingrediente_alternativo, created_at)
       VALUES ($1, $2, $3, 'ABIERTA', $4, $5, $6, $7, $8, now()) RETURNING *`,
      [sucursalId, empleadoId, descripcion, tipo || null, prioridad || 'ALTA', pedido_id || null, ingrediente_faltante || null, ingrediente_alternativo || null]
    );

    if (pedido_id) {
      const pedidoRes = await client.query(
        `SELECT * FROM pedidos WHERE id = $1 FOR UPDATE`,
        [pedido_id]
      );
      if (pedidoRes.rows.length > 0) {
        await client.query(
          `UPDATE pedidos SET estado = 'RETRASADO', updated_at = now() WHERE id = $1`,
          [pedido_id]
        );
        await client.query(
          `INSERT INTO historial_pedido (pedido_id, empleado_id, estado_anterior, estado_nuevo, created_at)
           VALUES ($1, $2, $3, 'RETRASADO', now())`,
          [pedido_id, empleadoId, pedidoRes.rows[0].estado]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ incidencia: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
}

// ── PATCH: Cerrar incidencia (CU45) ──
async function cerrarIncidencia(req, res, next) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE incidencias SET estado = 'CERRADA' WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Incidencia no encontrada.' });
    }

    res.json({ incidencia: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getIncidencias,
  crearIncidencia,
  cerrarIncidencia
};
