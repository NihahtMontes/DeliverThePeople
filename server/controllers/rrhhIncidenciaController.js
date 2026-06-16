const { pool } = require('../config/db');

const TIPOS = ['RRHH_CONFLICTO', 'RRHH_ACCIDENTE', 'RRHH_ASISTENCIA', 'RRHH_TAREA', 'RRHH_OTRO'];
const PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];
const ESTADOS = ['ABIERTA', 'EN_REVISION', 'CERRADA'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SELECT_INCIDENCIAS = `
  SELECT i.id, i.sucursal_id, i.empleado_id, i.descripcion, i.estado, i.created_at,
         i.tipo, i.prioridad, e.nombre AS empleado_nombre, e.apellido AS empleado_apellido,
         e.email AS empleado_email, e.rol, s.nombre AS sucursal_nombre
  FROM incidencias i
  JOIN empleados e ON e.id = i.empleado_id
  LEFT JOIN sucursales s ON s.id = i.sucursal_id
`;

function esGestor(req) {
  return req.user.rol === 'admin' || req.user.rol === 'gerente';
}

function gerenteConSucursal(req) {
  return req.user.rol === 'gerente' && Boolean(req.user.sucursal_id);
}

async function listarIncidencias(req, res, next) {
  try {
    const { sucursal_id: sucursalId, empleado_id: empleadoId, estado, prioridad, tipo } = req.query;
    if (sucursalId && !UUID_REGEX.test(sucursalId)) return res.status(400).json({ ok: false, error: 'Sucursal no valida.' });
    if (empleadoId && !UUID_REGEX.test(empleadoId)) return res.status(400).json({ ok: false, error: 'Empleado no valido.' });
    if (estado && !ESTADOS.includes(estado)) return res.status(400).json({ ok: false, error: 'Estado no valido.' });
    if (prioridad && !PRIORIDADES.includes(prioridad)) return res.status(400).json({ ok: false, error: 'Prioridad no valida.' });
    if (tipo && !TIPOS.includes(tipo)) return res.status(400).json({ ok: false, error: 'Tipo no valido.' });

    const condiciones = ["i.tipo LIKE 'RRHH_%'"];
    const valores = [];
    if (!esGestor(req)) {
      valores.push(req.user.id);
      condiciones.push(`i.empleado_id = $${valores.length}`);
    } else {
      const sucursalAplicada = gerenteConSucursal(req) ? req.user.sucursal_id : sucursalId;
      if (sucursalAplicada) {
        valores.push(sucursalAplicada);
        condiciones.push(`i.sucursal_id = $${valores.length}`);
      }
      if (empleadoId) {
        valores.push(empleadoId);
        condiciones.push(`i.empleado_id = $${valores.length}`);
      }
    }
    if (estado) {
      valores.push(estado);
      condiciones.push(`i.estado = $${valores.length}`);
    }
    if (prioridad) {
      valores.push(prioridad);
      condiciones.push(`i.prioridad = $${valores.length}`);
    }
    if (tipo) {
      valores.push(tipo);
      condiciones.push(`i.tipo = $${valores.length}`);
    }
    const result = await pool.query(
      `${SELECT_INCIDENCIAS} WHERE ${condiciones.join(' AND ')} ORDER BY i.created_at DESC`,
      valores
    );
    return res.json({ ok: true, incidencias: result.rows });
  } catch (err) {
    return next(err);
  }
}

async function crearIncidencia(req, res, next) {
  try {
    const descripcion = typeof req.body.descripcion === 'string' ? req.body.descripcion.trim() : '';
    const tipo = req.body.tipo;
    const prioridad = req.body.prioridad || 'ALTA';
    if (!descripcion) return res.status(400).json({ ok: false, error: 'La descripcion es obligatoria.' });
    if (!TIPOS.includes(tipo)) return res.status(400).json({ ok: false, error: 'Tipo de incidencia RRHH no valido.' });
    if (!PRIORIDADES.includes(prioridad)) return res.status(400).json({ ok: false, error: 'Prioridad no valida.' });

    const empleadoId = esGestor(req) ? (req.body.empleado_id || req.user.id) : req.user.id;
    if (!UUID_REGEX.test(empleadoId)) return res.status(400).json({ ok: false, error: 'Empleado no valido.' });
    const empleadoResult = await pool.query(
      'SELECT id, sucursal_id, estado FROM empleados WHERE id = $1',
      [empleadoId]
    );
    const empleado = empleadoResult.rows[0];
    if (!empleado || empleado.estado !== 'activo') return res.status(400).json({ ok: false, error: 'El empleado no existe o no esta activo.' });
    const sucursalId = esGestor(req) ? (req.body.sucursal_id || empleado.sucursal_id) : req.user.sucursal_id;
    if (!sucursalId || !UUID_REGEX.test(sucursalId)) return res.status(400).json({ ok: false, error: 'La sucursal es obligatoria.' });
    if (empleado.sucursal_id !== sucursalId) return res.status(400).json({ ok: false, error: 'La sucursal debe coincidir con la sucursal del empleado.' });
    if (gerenteConSucursal(req) && sucursalId !== req.user.sucursal_id) {
      return res.status(403).json({ ok: false, error: 'No puedes reportar incidencias fuera de tu sucursal.' });
    }

    const insert = await pool.query(
      `INSERT INTO incidencias
        (sucursal_id, empleado_id, descripcion, estado, tipo, prioridad, pedido_id, ingrediente_faltante, ingrediente_alternativo, created_at)
       VALUES ($1, $2, $3, 'ABIERTA', $4, $5, NULL, NULL, NULL, now()) RETURNING id`,
      [sucursalId, empleadoId, descripcion, tipo, prioridad]
    );
    const result = await pool.query(`${SELECT_INCIDENCIAS} WHERE i.id = $1`, [insert.rows[0].id]);
    return res.status(201).json({ ok: true, incidencia: result.rows[0] });
  } catch (err) {
    return next(err);
  }
}

async function actualizarEstado(req, res, next) {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    if (!UUID_REGEX.test(id)) return res.status(400).json({ ok: false, error: 'Incidencia no valida.' });
    if (!ESTADOS.includes(estado)) return res.status(400).json({ ok: false, error: 'Estado no valido.' });
    const valores = [id];
    let sql = "SELECT id FROM incidencias WHERE id = $1 AND tipo LIKE 'RRHH_%'";
    if (gerenteConSucursal(req)) {
      valores.push(req.user.sucursal_id);
      sql += ` AND sucursal_id = $${valores.length}`;
    }
    const actual = await pool.query(sql, valores);
    if (!actual.rows.length) return res.status(404).json({ ok: false, error: 'Incidencia RRHH no encontrada.' });
    await pool.query('UPDATE incidencias SET estado = $1 WHERE id = $2', [estado, id]);
    const result = await pool.query(`${SELECT_INCIDENCIAS} WHERE i.id = $1`, [id]);
    return res.json({ ok: true, incidencia: result.rows[0] });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listarIncidencias, crearIncidencia, actualizarEstado };
