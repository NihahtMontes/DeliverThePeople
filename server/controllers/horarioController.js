const { pool } = require('../config/db');

const ESTADOS = ['PENDIENTE', 'EN_CURSO', 'COMPLETADO', 'AUSENTE'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const SELECT_HORARIOS = `
  SELECT h.id, h.empleado_id, TO_CHAR(h.fecha, 'YYYY-MM-DD') AS fecha,
         h.hora_entrada, h.hora_salida, h.created_at,
         e.nombre AS empleado_nombre, e.apellido AS empleado_apellido, e.rol,
         e.sucursal_id, s.nombre AS sucursal_nombre,
         CASE
           WHEN h.hora_entrada IS NOT NULL AND h.hora_salida IS NOT NULL THEN 'COMPLETADO'
           WHEN h.hora_entrada IS NOT NULL THEN 'EN_CURSO'
           WHEN h.fecha < CURRENT_DATE THEN 'AUSENTE'
           ELSE 'PENDIENTE'
         END AS estado,
         CASE
           WHEN h.hora_entrada IS NULL THEN 'SIN_ENTRADA'
           WHEN (h.hora_entrada AT TIME ZONE 'America/La_Paz')::time > TIME '09:15' THEN 'RETRASO'
           ELSE 'A_TIEMPO'
         END AS puntualidad
  FROM horarios_asistencias h
  JOIN empleados e ON e.id = h.empleado_id
  LEFT JOIN sucursales s ON s.id = e.sucursal_id
`;

function gerenteConSucursal(req) {
  return req.user.rol === 'gerente' && Boolean(req.user.sucursal_id);
}

function fechaValida(fecha) {
  return FECHA_REGEX.test(fecha) && !Number.isNaN(Date.parse(`${fecha}T00:00:00Z`));
}

function timestampValido(valor) {
  return !valor || !Number.isNaN(Date.parse(valor));
}

function validarHoras(entrada, salida) {
  if (!timestampValido(entrada) || !timestampValido(salida)) {
    return 'Las horas deben tener un formato de fecha y hora valido.';
  }
  if (entrada && salida && new Date(salida) < new Date(entrada)) {
    return 'La hora de salida no puede ser anterior a la hora de entrada.';
  }
  return null;
}

async function obtenerEmpleado(empleadoId) {
  const result = await pool.query(
    'SELECT id, sucursal_id, estado FROM empleados WHERE id = $1',
    [empleadoId]
  );
  return result.rows[0] || null;
}

async function obtenerHorarioAlcanzable(req, id) {
  const valores = [id];
  let sql = `
    SELECT h.id, h.empleado_id, h.fecha, h.hora_entrada, h.hora_salida, e.sucursal_id
    FROM horarios_asistencias h
    JOIN empleados e ON e.id = h.empleado_id
    WHERE h.id = $1
  `;
  if (gerenteConSucursal(req)) {
    valores.push(req.user.sucursal_id);
    sql += ` AND e.sucursal_id = $${valores.length}`;
  }
  const result = await pool.query(sql, valores);
  return result.rows[0] || null;
}

async function listarHorarios(req, res, next) {
  try {
    const { empleado_id: empleadoId, sucursal_id: sucursalId, fecha_desde: desde, fecha_hasta: hasta, estado } = req.query;
    if (empleadoId && !UUID_REGEX.test(empleadoId)) return res.status(400).json({ ok: false, error: 'Empleado no valido.' });
    if (sucursalId && !UUID_REGEX.test(sucursalId)) return res.status(400).json({ ok: false, error: 'Sucursal no valida.' });
    if (desde && !fechaValida(desde)) return res.status(400).json({ ok: false, error: 'Fecha desde no valida.' });
    if (hasta && !fechaValida(hasta)) return res.status(400).json({ ok: false, error: 'Fecha hasta no valida.' });
    if (estado && !ESTADOS.includes(estado)) return res.status(400).json({ ok: false, error: 'Estado no valido.' });
    if (desde && hasta && desde > hasta) return res.status(400).json({ ok: false, error: 'La fecha desde no puede ser posterior a la fecha hasta.' });

    const condiciones = [];
    const valores = [];
    const sucursalAplicada = gerenteConSucursal(req) ? req.user.sucursal_id : sucursalId;
    if (sucursalAplicada) {
      valores.push(sucursalAplicada);
      condiciones.push(`base.sucursal_id = $${valores.length}`);
    }
    if (empleadoId) {
      valores.push(empleadoId);
      condiciones.push(`base.empleado_id = $${valores.length}`);
    }
    if (desde) {
      valores.push(desde);
      condiciones.push(`base.fecha >= $${valores.length}`);
    }
    if (hasta) {
      valores.push(hasta);
      condiciones.push(`base.fecha <= $${valores.length}`);
    }
    if (estado) {
      valores.push(estado);
      condiciones.push(`base.estado = $${valores.length}`);
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT * FROM (${SELECT_HORARIOS}) base ${where} ORDER BY base.fecha DESC, base.created_at DESC`,
      valores
    );
    return res.json({ ok: true, horarios: result.rows });
  } catch (err) {
    return next(err);
  }
}

async function crearHorario(req, res, next) {
  try {
    const { empleado_id: empleadoId, fecha, hora_entrada: entrada, hora_salida: salida } = req.body;
    if (!empleadoId || !UUID_REGEX.test(empleadoId)) return res.status(400).json({ ok: false, error: 'El empleado es obligatorio y debe ser valido.' });
    if (!fecha || !fechaValida(fecha)) return res.status(400).json({ ok: false, error: 'La fecha es obligatoria y debe ser valida.' });
    const errorHoras = validarHoras(entrada, salida);
    if (errorHoras) return res.status(400).json({ ok: false, error: errorHoras });

    const empleado = await obtenerEmpleado(empleadoId);
    if (!empleado || empleado.estado !== 'activo') return res.status(400).json({ ok: false, error: 'El empleado no existe o no esta activo.' });
    if (gerenteConSucursal(req) && empleado.sucursal_id !== req.user.sucursal_id) {
      return res.status(403).json({ ok: false, error: 'No puedes gestionar horarios fuera de tu sucursal.' });
    }
    const duplicado = await pool.query(
      'SELECT id FROM horarios_asistencias WHERE empleado_id = $1 AND fecha = $2',
      [empleadoId, fecha]
    );
    if (duplicado.rows.length) return res.status(409).json({ ok: false, error: 'Ya existe un registro para este empleado en la fecha seleccionada.' });

    const insert = await pool.query(
      `INSERT INTO horarios_asistencias (empleado_id, fecha, hora_entrada, hora_salida, created_at)
       VALUES ($1, $2, $3, $4, now()) RETURNING id`,
      [empleadoId, fecha, entrada || null, salida || null]
    );
    const result = await pool.query(`${SELECT_HORARIOS} WHERE h.id = $1`, [insert.rows[0].id]);
    return res.status(201).json({ ok: true, horario: result.rows[0] });
  } catch (err) {
    return next(err);
  }
}

async function actualizarHorario(req, res, next) {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) return res.status(400).json({ ok: false, error: 'Registro no valido.' });
    const horario = await obtenerHorarioAlcanzable(req, id);
    if (!horario) return res.status(404).json({ ok: false, error: 'Registro de horario no encontrado.' });

    const fecha = req.body.fecha;
    const entrada = req.body.hora_entrada || null;
    const salida = req.body.hora_salida || null;
    if (!fecha || !fechaValida(fecha)) return res.status(400).json({ ok: false, error: 'La fecha es obligatoria y debe ser valida.' });
    const errorHoras = validarHoras(entrada, salida);
    if (errorHoras) return res.status(400).json({ ok: false, error: errorHoras });

    const duplicado = await pool.query(
      'SELECT id FROM horarios_asistencias WHERE empleado_id = $1 AND fecha = $2 AND id <> $3',
      [horario.empleado_id, fecha, id]
    );
    if (duplicado.rows.length) return res.status(409).json({ ok: false, error: 'Ya existe otro registro para este empleado en la fecha seleccionada.' });

    await pool.query(
      'UPDATE horarios_asistencias SET fecha = $1, hora_entrada = $2, hora_salida = $3 WHERE id = $4',
      [fecha, entrada, salida, id]
    );
    const result = await pool.query(`${SELECT_HORARIOS} WHERE h.id = $1`, [id]);
    return res.json({ ok: true, horario: result.rows[0] });
  } catch (err) {
    return next(err);
  }
}

async function registrarMarca(req, res, next, campo) {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) return res.status(400).json({ ok: false, error: 'Registro no valido.' });
    const horario = await obtenerHorarioAlcanzable(req, id);
    if (!horario) return res.status(404).json({ ok: false, error: 'Registro de horario no encontrado.' });

    if (campo === 'hora_entrada' && horario.hora_entrada) {
      return res.status(409).json({ ok: false, error: 'La entrada ya fue registrada. Usa Editar si necesitas corregirla.' });
    }
    if (campo === 'hora_salida' && !horario.hora_entrada) {
      return res.status(400).json({ ok: false, error: 'Debes registrar la entrada antes de registrar la salida.' });
    }
    if (campo === 'hora_salida' && horario.hora_salida) {
      return res.status(409).json({ ok: false, error: 'La salida ya fue registrada. Usa Editar si necesitas corregirla.' });
    }

    const valor = req.body[campo] || new Date().toISOString();
    if (!timestampValido(valor)) return res.status(400).json({ ok: false, error: 'La fecha y hora no son validas.' });
    const entrada = campo === 'hora_entrada' ? valor : horario.hora_entrada;
    const salida = campo === 'hora_salida' ? valor : horario.hora_salida;
    const errorHoras = validarHoras(entrada, salida);
    if (errorHoras) return res.status(400).json({ ok: false, error: errorHoras });

    await pool.query(`UPDATE horarios_asistencias SET ${campo} = $1 WHERE id = $2`, [valor, id]);
    const result = await pool.query(`${SELECT_HORARIOS} WHERE h.id = $1`, [id]);
    return res.json({ ok: true, horario: result.rows[0] });
  } catch (err) {
    return next(err);
  }
}

const registrarEntrada = (req, res, next) => registrarMarca(req, res, next, 'hora_entrada');
const registrarSalida = (req, res, next) => registrarMarca(req, res, next, 'hora_salida');

module.exports = { listarHorarios, crearHorario, actualizarHorario, registrarEntrada, registrarSalida };
