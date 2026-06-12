const { pool } = require('../config/db');

// Obtener todos los equipos
async function getEquipos(req, res, next) {
  try {
    const sucursalId = req.user.sucursal_id;
    const rol = req.user.rol;
    
    let result;
    // Permitir ver todos los equipos si es administrador, o si no tiene sucursal
    if (rol === 'administrador' || rol === 'admin' || !sucursalId) {
      result = await pool.query(
        `SELECT * FROM equipos 
         ORDER BY created_at DESC`
      );
    } else {
      // Como estamos en fase de pruebas y quieres ver todos los datos, 
      // temporalmente listaremos todos los equipos independientemente de la sucursal.
      // Cuando estés en producción, puedes descomentar la línea del WHERE.
      result = await pool.query(
        `SELECT * FROM equipos 
         /* WHERE sucursal_id = $1 */
         ORDER BY created_at DESC`
        // ,[sucursalId]
      );
    }

    // Formatear fechas para evitar problemas de zona horaria en el front
    const equiposFormateados = result.rows.map(eq => ({
      ...eq,
      fecha_compra: eq.fecha_compra ? new Date(eq.fecha_compra).toISOString().split('T')[0] : ''
    }));

    res.json({ equipos: equiposFormateados });
  } catch (err) {
    next(err);
  }
}

// Crear nuevo equipo
async function createEquipo(req, res, next) {
  try {
    const sucursalId = req.user.sucursal_id;
    const { nombre, tipo, numero_serie, estado, fecha_compra } = req.body;

    const result = await pool.query(
      `INSERT INTO equipos (sucursal_id, nombre, tipo, numero_serie, estado, fecha_compra) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [sucursalId || null, nombre, tipo, numero_serie || null, estado || 'operativo', fecha_compra || null]
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

// Actualizar equipo
async function updateEquipo(req, res, next) {
  try {
    const { id } = req.params;
    const sucursalId = req.user.sucursal_id;
    const { nombre, tipo, numero_serie, estado, fecha_compra } = req.body;

    let result;
    if (sucursalId) {
        result = await pool.query(
        `UPDATE equipos 
         SET nombre = $1, tipo = $2, numero_serie = $3, estado = $4, fecha_compra = $5
         WHERE id = $6 AND sucursal_id = $7
         RETURNING *`,
        [nombre, tipo, numero_serie || null, estado || 'operativo', fecha_compra || null, id, sucursalId || null]
        );
    } else {
         result = await pool.query(
        `UPDATE equipos 
         SET nombre = $1, tipo = $2, numero_serie = $3, estado = $4, fecha_compra = $5
         WHERE id = $6
         RETURNING *`,
        [nombre, tipo, numero_serie || null, estado || 'operativo', fecha_compra || null, id]
        );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado o no tienes permiso' });
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

// Dar de baja (Soft delete)
async function deleteEquipo(req, res, next) {
  try {
    const { id } = req.params;
    const sucursalId = req.user.sucursal_id;

    let result;
    if (sucursalId) {
        // Cambiar estado a 'fuera_de_servicio'
        result = await pool.query(
        `UPDATE equipos 
         SET estado = 'fuera_de_servicio' 
         WHERE id = $1 AND sucursal_id = $2
         RETURNING *`,
        [id, sucursalId || null]
        );
    } else {
        result = await pool.query(
            `UPDATE equipos 
             SET estado = 'fuera_de_servicio' 
             WHERE id = $1
             RETURNING *`,
            [id]
        );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado o no tienes permiso' });
    }

    const equipo = result.rows[0];
    if (equipo.fecha_compra) {
        equipo.fecha_compra = new Date(equipo.fecha_compra).toISOString().split('T')[0];
    }

    res.json({ equipo, message: 'Equipo dado de baja exitosamente' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getEquipos,
  createEquipo,
  updateEquipo,
  deleteEquipo
};
