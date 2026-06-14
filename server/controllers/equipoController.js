const { pool } = require('../config/db');

// Obtener todos los equipos
async function getEquipos(req, res, next) {
  try {
    const sucursalId = req.user.sucursal_id;
    const rol = req.user.rol;

    let result;
    if (rol === 'administrador' || rol === 'admin' || !sucursalId) {
      result = await pool.query(
        `SELECT * FROM equipos ORDER BY nombre ASC`
      );
    } else {
      result = await pool.query(
        `SELECT * FROM equipos WHERE sucursal_id = $1 ORDER BY nombre ASC`,
        [sucursalId]
      );
    }

    const equiposFormateados = result.rows.map(eq => ({
      ...eq,
      fecha_compra: eq.fecha_compra ? new Date(eq.fecha_compra).toISOString().split('T')[0] : ''
    }));

    res.json({ equipos: equiposFormateados });
  } catch (err) {
    next(err);
  }
}

// Crear nuevo equipo (Alta)
async function createEquipo(req, res, next) {
  try {
    const sucursalId = req.user.sucursal_id;
    if (!sucursalId && req.user.rol !== 'admin' && req.user.rol !== 'administrador') {
      return res.status(400).json({ error: 'No tienes una sucursal asignada.' });
    }
    const finalSucursalId = req.body.sucursal_id || sucursalId;

    const { nombre, tipo, marca, modelo, numero_serie, capacidad, descripcion, fecha_compra } = req.body;

    if (!nombre || !tipo || !marca || !modelo || !numero_serie) {
      return res.status(400).json({ error: 'Nombre, tipo, marca, modelo y número de serie son obligatorios.' });
    }

    // Validar unicidad de numero_serie
    const existe = await pool.query(
      `SELECT id FROM equipos WHERE numero_serie = $1`,
      [numero_serie]
    );
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'Ya existe un equipo con ese número de serie.' });
    }

    const result = await pool.query(
      `INSERT INTO equipos (sucursal_id, nombre, tipo, marca, modelo, numero_serie, capacidad, descripcion, estado, activo, fecha_compra, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'OPERATIVO', true, $9, now(), now()) RETURNING *`,
      [finalSucursalId, nombre, tipo, marca, modelo, numero_serie, capacidad || null, descripcion || null, fecha_compra || null]
    );

    const equipo = result.rows[0];
    if (equipo.fecha_compra) {
      equipo.fecha_compra = new Date(equipo.fecha_compra).toISOString().split('T')[0];
    }

    res.status(201).json({ equipo });
  } catch (err) {
    next(err);
  }
}

// Editar equipo (datos maestros, no estado ni activo)
async function updateEquipo(req, res, next) {
  try {
    const { id } = req.params;
    const { nombre, tipo, marca, modelo, numero_serie, capacidad, descripcion, fecha_compra } = req.body;

    if (!nombre || !tipo || !marca || !modelo || !numero_serie) {
      return res.status(400).json({ error: 'Nombre, tipo, marca, modelo y número de serie son obligatorios.' });
    }

    // Validar unicidad de numero_serie excluyendo el actual
    const existe = await pool.query(
      `SELECT id FROM equipos WHERE numero_serie = $1 AND id != $2`,
      [numero_serie, id]
    );
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'Ya existe otro equipo con ese número de serie.' });
    }

    const result = await pool.query(
      `UPDATE equipos
       SET nombre = $1, tipo = $2, marca = $3, modelo = $4, numero_serie = $5,
           capacidad = $6, descripcion = $7, fecha_compra = $8, updated_at = now()
       WHERE id = $9 RETURNING *`,
      [nombre, tipo, marca, modelo, numero_serie, capacidad || null, descripcion || null, fecha_compra || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado.' });
    }

    const equipo = result.rows[0];
    if (equipo.fecha_compra) {
      equipo.fecha_compra = new Date(equipo.fecha_compra).toISOString().split('T')[0];
    }

    res.json({ equipo });
  } catch (err) {
    next(err);
  }
}

// Baja lógica: estado = INACTIVO, activo = false
async function bajaEquipo(req, res, next) {
  try {
    const { id } = req.params;

    // Verificar que no tenga ticket activo
    const ticketActivo = await pool.query(
      `SELECT numero_ticket FROM mantenimientos WHERE equipo_id = $1 AND estado_ticket IN ('PENDIENTE', 'EN_PROCESO', 'RETRASADO')`,
      [id]
    );
    if (ticketActivo.rows.length > 0) {
      return res.status(400).json({
        error: `No se puede dar de baja un equipo con ticket activo (MANT-${ticketActivo.rows[0].numero_ticket}).`
      });
    }

    const result = await pool.query(
      `UPDATE equipos SET estado = 'INACTIVO', activo = false, updated_at = now() WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado.' });
    }

    res.json({ equipo: result.rows[0], message: 'Equipo dado de baja correctamente.' });
  } catch (err) {
    next(err);
  }
}

// Reactivar equipo: estado = OPERATIVO, activo = true
async function reactivarEquipo(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE equipos SET estado = 'OPERATIVO', activo = true, updated_at = now() WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado.' });
    }
    res.json({ equipo: result.rows[0], message: 'Equipo reactivado correctamente.' });
  } catch (err) {
    next(err);
  }
}

// Actualizar solo el estado (usado internamente por mantenimiento)
async function patchEquipoEstado(req, res, next) {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) {
      return res.status(400).json({ error: 'El estado es requerido.' });
    }

    const result = await pool.query(
      `UPDATE equipos SET estado = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [estado, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado.' });
    }

    res.json({ equipo: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// Solicitar mantenimiento desde EquiposPage (transaccional)
async function solicitarMantenimiento(req, res, next) {
  const client = await pool.connect();
  try {
    const { id: equipo_id } = req.params;
    const solicitante_id = req.user.id;
    const { descripcion_falla, urgencia, observaciones_inicio } = req.body;

    if (!descripcion_falla || !urgencia) {
      return res.status(400).json({ error: 'La descripción de falla y la urgencia son obligatorias.' });
    }

    await client.query('BEGIN');

    // Bloquear fila y verificar que el equipo exista y esté activo
    const equipoRes = await client.query(
      `SELECT * FROM equipos WHERE id = $1 AND activo = true FOR UPDATE`,
      [equipo_id]
    );
    if (equipoRes.rows.length === 0) {
      throw new Error('El equipo no existe o está inactivo.');
    }

    // Verificar que no tenga ticket activo (la BD también lo bloquea con el índice único parcial)
    const ticketActivo = await client.query(
      `SELECT numero_ticket FROM mantenimientos WHERE equipo_id = $1 AND estado_ticket IN ('PENDIENTE', 'EN_PROCESO', 'RETRASADO')`,
      [equipo_id]
    );
    if (ticketActivo.rows.length > 0) {
      throw new Error(`Este equipo ya tiene un ticket activo (MANT-${ticketActivo.rows[0].numero_ticket}).`);
    }

    // Insertar el ticket de mantenimiento
    const mantRes = await client.query(
      `INSERT INTO mantenimientos (equipo_id, solicitante_id, descripcion_falla, urgencia, observaciones_inicio, estado_ticket, fecha_solicitud, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'PENDIENTE', now(), now(), now()) RETURNING *`,
      [equipo_id, solicitante_id, descripcion_falla, urgencia, observaciones_inicio || null]
    );

    // Actualizar estado del equipo
    await client.query(
      `UPDATE equipos SET estado = 'REQUIERE_MANTENIMIENTO', updated_at = now() WHERE id = $1`,
      [equipo_id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      mantenimiento: mantRes.rows[0],
      message: 'Solicitud de mantenimiento registrada correctamente.'
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
}

module.exports = {
  getEquipos,
  createEquipo,
  updateEquipo,
  bajaEquipo,
  reactivarEquipo,
  patchEquipoEstado,
  solicitarMantenimiento
};
