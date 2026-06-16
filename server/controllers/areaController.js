const { pool } = require('../config/db');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SELECT_AREAS = `
  SELECT a.id, a.sucursal_id, a.nombre, a.descripcion, a.created_at,
         s.nombre AS sucursal_nombre,
         COUNT(e.id)::int AS empleados_sucursal_count
  FROM areas a
  LEFT JOIN sucursales s ON s.id = a.sucursal_id
  LEFT JOIN empleados e ON e.sucursal_id = a.sucursal_id AND e.estado = 'activo'
`;

function restringeSucursal(req) {
  return req.user.rol !== 'admin' && Boolean(req.user.sucursal_id);
}

async function listarAreas(req, res, next) {
  try {
    const { sucursal_id: sucursalId, search } = req.query;
    if (sucursalId && !UUID_REGEX.test(sucursalId)) return res.status(400).json({ ok: false, error: 'Sucursal no valida.' });
    const condiciones = [];
    const valores = [];
    const sucursalAplicada = restringeSucursal(req) ? req.user.sucursal_id : sucursalId;
    if (sucursalAplicada) {
      valores.push(sucursalAplicada);
      condiciones.push(`a.sucursal_id = $${valores.length}`);
    } else if (req.user.rol !== 'admin' && !req.user.sucursal_id) {
      condiciones.push('1 = 0');
    }
    if (typeof search === 'string' && search.trim()) {
      valores.push(`%${search.trim()}%`);
      condiciones.push(`(a.nombre ILIKE $${valores.length} OR COALESCE(a.descripcion, '') ILIKE $${valores.length})`);
    }
    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const result = await pool.query(
      `${SELECT_AREAS} ${where}
       GROUP BY a.id, s.nombre ORDER BY a.nombre ASC`,
      valores
    );
    return res.json({ ok: true, areas: result.rows });
  } catch (err) {
    return next(err);
  }
}

async function obtenerArea(req, res, next) {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) return res.status(400).json({ ok: false, error: 'Area no valida.' });
    const valores = [id];
    let where = 'WHERE a.id = $1';
    if (restringeSucursal(req)) {
      valores.push(req.user.sucursal_id);
      where += ` AND a.sucursal_id = $${valores.length}`;
    } else if (req.user.rol !== 'admin' && !req.user.sucursal_id) {
      where += ' AND 1 = 0';
    }
    const areaResult = await pool.query(
      `${SELECT_AREAS} ${where} GROUP BY a.id, s.nombre`,
      valores
    );
    if (!areaResult.rows.length) return res.status(404).json({ ok: false, error: 'Area no encontrada.' });
    const area = areaResult.rows[0];
    const empleados = await pool.query(
      `SELECT id, email, nombre, apellido, rol, sucursal_id, estado
       FROM empleados WHERE sucursal_id = $1 AND estado = 'activo'
       ORDER BY nombre, apellido`,
      [area.sucursal_id]
    );
    return res.json({ ok: true, area, empleados: empleados.rows });
  } catch (err) {
    return next(err);
  }
}

async function validarSucursal(req, sucursalId) {
  if (!sucursalId || !UUID_REGEX.test(sucursalId)) return 'La sucursal es obligatoria y debe ser valida.';
  if (req.user.rol === 'gerente' && req.user.sucursal_id && sucursalId !== req.user.sucursal_id) {
    return 'No puedes gestionar areas fuera de tu sucursal.';
  }
  const result = await pool.query('SELECT id FROM sucursales WHERE id = $1', [sucursalId]);
  return result.rows.length ? null : 'La sucursal seleccionada no existe.';
}

async function crearArea(req, res, next) {
  try {
    const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : '';
    const descripcion = typeof req.body.descripcion === 'string' ? req.body.descripcion.trim() : null;
    const sucursalId = req.body.sucursal_id || (req.user.rol === 'gerente' ? req.user.sucursal_id : null);
    if (!nombre) return res.status(400).json({ ok: false, error: 'El nombre es obligatorio.' });
    const errorSucursal = await validarSucursal(req, sucursalId);
    if (errorSucursal) return res.status(errorSucursal.startsWith('No puedes') ? 403 : 400).json({ ok: false, error: errorSucursal });
    const result = await pool.query(
      `INSERT INTO areas (sucursal_id, nombre, descripcion, created_at)
       VALUES ($1, $2, $3, now()) RETURNING id`,
      [sucursalId, nombre, descripcion || null]
    );
    const area = await pool.query(`${SELECT_AREAS} WHERE a.id = $1 GROUP BY a.id, s.nombre`, [result.rows[0].id]);
    return res.status(201).json({ ok: true, area: area.rows[0] });
  } catch (err) {
    return next(err);
  }
}

async function actualizarArea(req, res, next) {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) return res.status(400).json({ ok: false, error: 'Area no valida.' });
    const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : '';
    const descripcion = typeof req.body.descripcion === 'string' ? req.body.descripcion.trim() : null;
    if (!nombre) return res.status(400).json({ ok: false, error: 'El nombre es obligatorio.' });
    const actual = await pool.query('SELECT id, sucursal_id FROM areas WHERE id = $1', [id]);
    if (!actual.rows.length) return res.status(404).json({ ok: false, error: 'Area no encontrada.' });
    if (req.user.rol === 'gerente' && req.user.sucursal_id && actual.rows[0].sucursal_id !== req.user.sucursal_id) {
      return res.status(403).json({ ok: false, error: 'No puedes gestionar areas fuera de tu sucursal.' });
    }
    await pool.query('UPDATE areas SET nombre = $1, descripcion = $2 WHERE id = $3', [nombre, descripcion || null, id]);
    const area = await pool.query(`${SELECT_AREAS} WHERE a.id = $1 GROUP BY a.id, s.nombre`, [id]);
    return res.json({ ok: true, area: area.rows[0] });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listarAreas, obtenerArea, crearArea, actualizarArea };
