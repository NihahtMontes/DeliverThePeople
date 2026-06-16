const { pool } = require('../config/db');

// ── GET: Listar incidencias (scoped por sucursal) ──
async function getIncidencias(req, res, next) {
  try {
    const sucursalId = req.user.sucursal_id;
    const rol = req.user.rol;

    const baseSql = `
      SELECT i.*,
             e.nombre AS reportado_por_nombre,
             e.apellido AS reportado_por_apellido,
             p.numero_pedido AS pedido_numero
      FROM incidencias i
      LEFT JOIN empleados e ON i.reportado_por = e.id
      LEFT JOIN pedidos p ON i.equipo_id = p.id
    `;

    let result;
    if (rol === 'admin' || rol === 'administrador' || !sucursalId) {
      result = await pool.query(baseSql + ` ORDER BY i.fecha_reporte DESC`);
    } else {
      result = await pool.query(
        baseSql + ` WHERE i.sucursal_id = $1 ORDER BY i.fecha_reporte DESC`,
        [sucursalId]
      );
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
    const { descripcion, tipo, severidad, pedido_id, equipo_id } = req.body;

    if (!descripcion) {
      return res.status(400).json({ error: 'La descripcion es obligatoria.' });
    }

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO incidencias (sucursal_id, reportado_por, tipo, titulo, descripcion, severidad, estado, pedido_id, equipo_id, fecha_reporte)
       VALUES ($1, $2, $3, $4, $5, $6, 'reportado', $7, $8, now()) RETURNING *`,
      [sucursalId, empleadoId, tipo || 'otro', descripcion.substring(0, 50), descripcion, severidad || 'media', pedido_id || null, equipo_id || null]
    );

    if (pedido_id) {
      const pedidoRes = await client.query(
        `SELECT * FROM pedidos WHERE id = $1 FOR UPDATE`,
        [pedido_id]
      );
      if (pedidoRes.rows.length > 0) {
        await client.query(
          `UPDATE pedidos SET estado = 'retrasado', fecha_creacion = now() WHERE id = $1`,
          [pedido_id]
        );
        await client.query(
          `INSERT INTO historial_pedido (pedido_id, estado_anterior, estado_nuevo, cambiado_por, fecha_cambio)
           VALUES ($1, $2, 'retrasado', $3, now())`,
          [pedido_id, pedidoRes.rows[0].estado, empleadoId]
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
      `UPDATE incidencias SET estado = 'resuelto', fecha_resolucion = now() WHERE id = $1 RETURNING *`,
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
