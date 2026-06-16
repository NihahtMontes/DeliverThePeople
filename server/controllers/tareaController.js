const { pool } = require('../config/db');

const ESTADOS = ['PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SELECT_TAREAS = `
  SELECT t.id, t.sucursal_id, t.empleado_id, t.titulo, t.estado, t.created_at,
         e.nombre AS empleado_nombre, e.apellido AS empleado_apellido, e.email AS empleado_email,
         e.rol, s.nombre AS sucursal_nombre
  FROM tareas t
  JOIN empleados e ON e.id = t.empleado_id
  LEFT JOIN sucursales s ON s.id = t.sucursal_id
`;

function esGestor(req) {
  return req.user.rol === 'admin' || req.user.rol === 'gerente';
}

function gerenteConSucursal(req) {
  return req.user.rol === 'gerente' && Boolean(req.user.sucursal_id);
}

async function listarTareas(req, res, next) {
  try {
    const { empleado_id: empleadoId, sucursal_id: sucursalId, estado, search } = req.query;
    if (empleadoId && !UUID_REGEX.test(empleadoId)) return res.status(400).json({ ok: false, error: 'Empleado no valido.' });
    if (sucursalId && !UUID_REGEX.test(sucursalId)) return res.status(400).json({ ok: false, error: 'Sucursal no valida.' });
    if (estado && !ESTADOS.includes(estado)) return res.status(400).json({ ok: false, error: 'Estado no valido.' });

    const condiciones = [];
    const valores = [];
    if (!esGestor(req)) {
      valores.push(req.user.id);
      condiciones.push(`t.empleado_id = $${valores.length}`);
    } else if (gerenteConSucursal(req)) {
      valores.push(req.user.sucursal_id);
      condiciones.push(`t.sucursal_id = $${valores.length}`);
    } else if (sucursalId) {
      valores.push(sucursalId);
      condiciones.push(`t.sucursal_id = $${valores.length}`);
    }
    if (esGestor(req) && empleadoId) {
      valores.push(empleadoId);
      condiciones.push(`t.empleado_id = $${valores.length}`);
    }
    if (estado) {
      valores.push(estado);
      condiciones.push(`t.estado = $${valores.length}`);
    }
    if (typeof search === 'string' && search.trim()) {
      valores.push(`%${search.trim()}%`);
      condiciones.push(`t.titulo ILIKE $${valores.length}`);
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const result = await pool.query(
      `${SELECT_TAREAS} ${where}
       ORDER BY CASE t.estado WHEN 'PENDIENTE' THEN 1 WHEN 'EN_PROCESO' THEN 2 WHEN 'COMPLETADA' THEN 3 ELSE 4 END,
                t.created_at DESC`,
      valores
    );
    return res.json({ ok: true, tareas: result.rows });
  } catch (err) {
    return next(err);
  }
}

async function crearTarea(req, res, next) {
  try {
    const titulo = typeof req.body.titulo === 'string' ? req.body.titulo.trim() : '';
    const empleadoId = req.body.empleado_id;
    const estado = req.body.estado || 'PENDIENTE';
    if (!titulo) return res.status(400).json({ ok: false, error: 'El titulo es obligatorio.' });
    if (!empleadoId || !UUID_REGEX.test(empleadoId)) return res.status(400).json({ ok: false, error: 'El empleado es obligatorio y debe ser valido.' });
    if (!ESTADOS.includes(estado)) return res.status(400).json({ ok: false, error: 'Estado no valido.' });

    const empleadoResult = await pool.query(
      'SELECT id, sucursal_id, estado FROM empleados WHERE id = $1',
      [empleadoId]
    );
    const empleado = empleadoResult.rows[0];
    if (!empleado || empleado.estado !== 'activo') return res.status(400).json({ ok: false, error: 'El empleado no existe o no esta activo.' });
    const sucursalId = req.body.sucursal_id || empleado.sucursal_id;
    if (!sucursalId || !UUID_REGEX.test(sucursalId)) return res.status(400).json({ ok: false, error: 'La sucursal es obligatoria.' });
    if (empleado.sucursal_id !== sucursalId) return res.status(400).json({ ok: false, error: 'La sucursal debe coincidir con la sucursal del empleado.' });
    if (gerenteConSucursal(req) && sucursalId !== req.user.sucursal_id) {
      return res.status(403).json({ ok: false, error: 'No puedes asignar tareas fuera de tu sucursal.' });
    }

    const insert = await pool.query(
      `INSERT INTO tareas (sucursal_id, empleado_id, titulo, estado, created_at)
       VALUES ($1, $2, $3, $4, now()) RETURNING id`,
      [sucursalId, empleadoId, titulo, estado]
    );
    const result = await pool.query(`${SELECT_TAREAS} WHERE t.id = $1`, [insert.rows[0].id]);
    return res.status(201).json({ ok: true, tarea: result.rows[0] });
  } catch (err) {
    return next(err);
  }
}

async function actualizarEstado(req, res, next) {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    if (!UUID_REGEX.test(id)) return res.status(400).json({ ok: false, error: 'Tarea no valida.' });
    if (!ESTADOS.includes(estado)) return res.status(400).json({ ok: false, error: 'Estado no valido.' });
    if (!esGestor(req) && !['EN_PROCESO', 'COMPLETADA'].includes(estado)) {
      return res.status(403).json({ ok: false, error: 'Solo puedes iniciar o completar tus tareas.' });
    }

    const valores = [id];
    let sql = 'SELECT id, empleado_id, sucursal_id FROM tareas WHERE id = $1';
    if (!esGestor(req)) {
      valores.push(req.user.id);
      sql += ` AND empleado_id = $${valores.length}`;
    } else if (gerenteConSucursal(req)) {
      valores.push(req.user.sucursal_id);
      sql += ` AND sucursal_id = $${valores.length}`;
    }
    const actual = await pool.query(sql, valores);
    if (!actual.rows.length) return res.status(404).json({ ok: false, error: 'Tarea no encontrada o fuera de tu alcance.' });

    await pool.query('UPDATE tareas SET estado = $1 WHERE id = $2', [estado, id]);
    const result = await pool.query(`${SELECT_TAREAS} WHERE t.id = $1`, [id]);
    return res.json({ ok: true, tarea: result.rows[0] });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listarTareas, crearTarea, actualizarEstado };
