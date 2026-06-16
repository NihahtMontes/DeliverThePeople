const { pool } = require('../config/db');

const TIPOS = ['accidente_personal', 'conflicto', 'otro'];
const PRIORIDADES = ['baja', 'media', 'alta', 'critica'];
const ESTADOS = ['reportado', 'en_revision', 'en_progreso', 'resuelto', 'descartado'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SELECT_INCIDENCIAS = `
  SELECT i.id, i.sucursal_id, i.reportado_por, i.descripcion, i.estado, i.fecha_reporte,
         i.tipo, i.severidad, e.nombre AS empleado_nombre, e.apellido AS empleado_apellido,
         e.email AS empleado_email, e.rol, s.nombre AS sucursal_nombre
  FROM incidencias i
  JOIN empleados e ON e.id = i.reportado_por
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
    const { sucursal_id: sucursalId, empleado_id: empleadoId, estado, severidad, tipo } = req.query;
    if (sucursalId && !UUID_REGEX.test(sucursalId)) return res.status(400).json({ ok: false, error: 'Sucursal no valida.' });
    if (empleadoId && !UUID_REGEX.test(empleadoId)) return res.status(400).json({ ok: false, error: 'Empleado no valido.' });
    if (estado && !ESTADOS.includes(estado)) return res.status(400).json({ ok: false, error: 'Estado no valido.' });
    if (severidad && !PRIORIDADES.includes(severidad)) return res.status(400).json({ ok: false, error: 'Severidad no valida.' });
    if (tipo && !TIPOS.includes(tipo)) return res.status(400).json({ ok: false, error: 'Tipo no valido.' });

    const condiciones = [];
    const valores = [];
    if (!esGestor(req)) {
      valores.push(req.user.id);
      condiciones.push(`i.reportado_por = $${valores.length}`);
    } else {
      const sucursalAplicada = gerenteConSucursal(req) ? req.user.sucursal_id : sucursalId;
      if (sucursalAplicada) {
        valores.push(sucursalAplicada);
        condiciones.push(`i.sucursal_id = $${valores.length}`);
      }
      if (empleadoId) {
        valores.push(empleadoId);
        condiciones.push(`i.reportado_por = $${valores.length}`);
      }
    }
    if (estado) {
      valores.push(estado);
      condiciones.push(`i.estado = $${valores.length}`);
    }
    if (severidad) {
      valores.push(severidad);
      condiciones.push(`i.severidad = $${valores.length}`);
    }
    if (tipo) {
      valores.push(tipo);
      condiciones.push(`i.tipo = $${valores.length}`);
    }
    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const result = await pool.query(
      `${SELECT_INCIDENCIAS} ${where} ORDER BY i.fecha_reporte DESC`,
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
    const severidad = req.body.severidad || 'media';
    if (!descripcion) return res.status(400).json({ ok: false, error: 'La descripcion es obligatoria.' });
    if (!TIPOS.includes(tipo)) return res.status(400).json({ ok: false, error: 'Tipo de incidencia no valido.' });
    if (!PRIORIDADES.includes(severidad)) return res.status(400).json({ ok: false, error: 'Severidad no valida.' });

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
        (sucursal_id, reportado_por, tipo, titulo, descripcion, severidad, estado, fecha_reporte)
       VALUES ($1, $2, $3, $4, $5, $6, 'reportado', now()) RETURNING id`,
      [sucursalId, empleadoId, tipo, descripcion.substring(0, 50), descripcion, severidad]
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
    let sql = "SELECT id FROM incidencias WHERE id = $1";
    if (gerenteConSucursal(req)) {
      valores.push(req.user.sucursal_id);
      sql += ` AND sucursal_id = $${valores.length}`;
    }
    const actual = await pool.query(sql, valores);
    if (!actual.rows.length) return res.status(404).json({ ok: false, error: 'Incidencia no encontrada.' });
    await pool.query("UPDATE incidencias SET estado = $1, fecha_resolucion = CASE WHEN $1 = 'resuelto' THEN now() ELSE NULL END WHERE id = $2", [estado, id]);
    const result = await pool.query(`${SELECT_INCIDENCIAS} WHERE i.id = $1`, [id]);
    return res.json({ ok: true, incidencia: result.rows[0] });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listarIncidencias, crearIncidencia, actualizarEstado };
