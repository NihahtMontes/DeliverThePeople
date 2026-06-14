const { pool } = require('../config/db');

// Obtener mantenimientos con datos del equipo y empleados JOIN
async function getMantenimientos(req, res, next) {
  try {
    const sucursalId = req.user.sucursal_id;
    const rol = req.user.rol;

    let whereClause = '';
    let params = [];

    if (rol !== 'administrador' && rol !== 'admin' && sucursalId) {
      whereClause = `WHERE e.sucursal_id = $1`;
      params.push(sucursalId);
    }

    const result = await pool.query(
      `SELECT m.*,
              e.nombre       AS equipo_nombre,
              e.marca        AS equipo_marca,
              e.modelo       AS equipo_modelo,
              e.numero_serie AS equipo_serie,
              e.tipo         AS equipo_tipo,
              emp_sol.nombre   AS solicitante_nombre,
              emp_sol.apellido AS solicitante_apellido
       FROM mantenimientos m
       JOIN equipos e ON m.equipo_id = e.id
       LEFT JOIN empleados emp_sol ON m.solicitante_id = emp_sol.id
       ${whereClause}
       ORDER BY m.fecha_solicitud DESC`,
      params
    );

    // Auto-detectar RETRASADO en memoria: EN_PROCESO + fecha_estimada vencida
    const now = new Date();
    const mantenimientos = result.rows.map(m => {
      if (
        m.estado_ticket === 'EN_PROCESO' &&
        m.fecha_estimada &&
        new Date(m.fecha_estimada) < now
      ) {
        return { ...m, estado_ticket: 'RETRASADO' };
      }
      return m;
    });

    res.json({ mantenimientos });
  } catch (err) {
    next(err);
  }
}

// Iniciar mantenimiento: PENDIENTE → EN_PROCESO, equipo → FUERA_DE_SERVICIO
async function iniciarMantenimiento(req, res, next) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { fecha_estimada, diagnostico } = req.body;

    await client.query('BEGIN');

    const mantRes = await client.query(
      `SELECT * FROM mantenimientos WHERE id = $1 FOR UPDATE`,
      [id]
    );
    if (mantRes.rows.length === 0) throw new Error('Ticket no encontrado.');
    if (mantRes.rows[0].estado_ticket !== 'PENDIENTE') {
      throw new Error('Solo se puede iniciar un ticket en estado PENDIENTE.');
    }

    const updated = await client.query(
      `UPDATE mantenimientos
       SET estado_ticket  = 'EN_PROCESO',
           fecha_estimada = $1,
           diagnostico    = $2,
           updated_at     = now()
       WHERE id = $3 RETURNING *`,
      [fecha_estimada || null, diagnostico || null, id]
    );

    await client.query(
      `UPDATE equipos SET estado = 'FUERA_DE_SERVICIO', updated_at = now() WHERE id = $1`,
      [mantRes.rows[0].equipo_id]
    );

    await client.query('COMMIT');
    res.json({ mantenimiento: updated.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
}

// Actualizar diagnóstico mientras el ticket está EN_PROCESO
async function actualizarDiagnostico(req, res, next) {
  try {
    const { id } = req.params;
    const { diagnostico, observaciones_inicio, fecha_estimada, costo } = req.body;

    const result = await pool.query(
      `UPDATE mantenimientos
       SET diagnostico         = COALESCE($1, diagnostico),
           observaciones_inicio = COALESCE($2, observaciones_inicio),
           fecha_estimada      = COALESCE($3, fecha_estimada),
           costo               = COALESCE($4, costo),
           updated_at          = now()
       WHERE id = $5 AND estado_ticket IN ('EN_PROCESO', 'RETRASADO')
       RETURNING *`,
      [diagnostico || null, observaciones_inicio || null, fecha_estimada || null, costo || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado o no está en proceso.' });
    }

    res.json({ mantenimiento: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// Finalizar mantenimiento: → COMPLETADO, equipo → OPERATIVO
async function finalizarMantenimiento(req, res, next) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { observaciones_cierre, costo } = req.body;

    await client.query('BEGIN');

    const mantRes = await client.query(
      `SELECT * FROM mantenimientos WHERE id = $1 FOR UPDATE`,
      [id]
    );
    if (mantRes.rows.length === 0) throw new Error('Ticket no encontrado.');

    const ticket = mantRes.rows[0];
    const estadosValidos = ['EN_PROCESO', 'RETRASADO'];
    if (!estadosValidos.includes(ticket.estado_ticket)) {
      throw new Error('Solo se puede finalizar un ticket EN_PROCESO o RETRASADO.');
    }

    const updated = await client.query(
      `UPDATE mantenimientos
       SET estado_ticket      = 'COMPLETADO',
           observaciones_cierre = $1,
           costo              = COALESCE($2, costo),
           fecha_cierre       = now(),
           updated_at         = now()
       WHERE id = $3 RETURNING *`,
      [observaciones_cierre || null, costo || null, id]
    );

    await client.query(
      `UPDATE equipos SET estado = 'OPERATIVO', updated_at = now() WHERE id = $1`,
      [ticket.equipo_id]
    );

    await client.query('COMMIT');
    res.json({ mantenimiento: updated.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
}

module.exports = {
  getMantenimientos,
  iniciarMantenimiento,
  actualizarDiagnostico,
  finalizarMantenimiento
};
