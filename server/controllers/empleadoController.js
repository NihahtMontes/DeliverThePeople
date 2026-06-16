const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const ROLES_VALIDOS = [
  'admin',
  'gerente',
  'cocinero',
  'despachador',
  'cajero',
  'aseo',
  'mantenimiento',
  'tecnico'
];
const ESTADOS_VALIDOS = ['activo', 'inactivo'];
const CAMPOS_PERMITIDOS = [
  'email',
  'password',
  'nombre',
  'apellido',
  'rol',
  'sucursal_id',
  'estado'
];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPLEADO_SELECT = `
  SELECT e.id, e.email, e.nombre, e.apellido, e.rol, e.sucursal_id,
         s.nombre AS sucursal_nombre, e.estado, e.created_at, e.updated_at
  FROM empleados e
  LEFT JOIN sucursales s ON s.id = e.sucursal_id
`;

function normalizarDatos(body) {
  return {
    email: typeof body.email === 'string' ? body.email.trim().toLowerCase() : '',
    password: typeof body.password === 'string' ? body.password : '',
    nombre: typeof body.nombre === 'string' ? body.nombre.trim() : '',
    apellido: typeof body.apellido === 'string' ? body.apellido.trim() : '',
    rol: typeof body.rol === 'string' ? body.rol.trim().toLowerCase() : '',
    sucursal_id: body.sucursal_id || null,
    estado: typeof body.estado === 'string' ? body.estado.trim().toLowerCase() : 'activo'
  };
}

function validarCamposDesconocidos(body) {
  return Object.keys(body).filter((campo) => !CAMPOS_PERMITIDOS.includes(campo));
}

function validarEmpleado(datos, { passwordObligatorio }) {
  if (!datos.email || !datos.nombre || !datos.apellido || !datos.rol || !datos.estado) {
    return 'Email, nombre, apellido, rol y estado son obligatorios.';
  }
  if (passwordObligatorio && !datos.password) {
    return 'La contrasena es obligatoria.';
  }
  if (!EMAIL_REGEX.test(datos.email)) {
    return 'El formato del email no es valido.';
  }
  if (datos.password && datos.password.length < 6) {
    return 'La contrasena debe tener al menos 6 caracteres.';
  }
  if (!ROLES_VALIDOS.includes(datos.rol)) {
    return 'El rol proporcionado no es valido.';
  }
  if (!ESTADOS_VALIDOS.includes(datos.estado)) {
    return 'El estado debe ser activo o inactivo.';
  }
  if (datos.sucursal_id && !UUID_REGEX.test(datos.sucursal_id)) {
    return 'La sucursal proporcionada no es valida.';
  }
  return null;
}

async function sucursalExiste(sucursalId) {
  if (!sucursalId) return true;
  const result = await pool.query('SELECT id FROM sucursales WHERE id = $1', [sucursalId]);
  return result.rows.length > 0;
}

function esGerenteConSucursal(req) {
  return req.user.rol === 'gerente' && Boolean(req.user.sucursal_id);
}

function puedeGestionarSucursal(req, sucursalId) {
  return !esGerenteConSucursal(req) || sucursalId === req.user.sucursal_id;
}

function responderErrorBaseDatos(err, res, next) {
  if (err.code === '23505') {
    return res.status(409).json({ ok: false, error: 'Ya existe un empleado con ese email.' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ ok: false, error: 'La sucursal seleccionada no existe.' });
  }
  return next(err);
}

async function listarEmpleados(req, res, next) {
  try {
    const { sucursal_id: sucursalId, rol, estado, search } = req.query;
    const condiciones = [];
    const valores = [];

    if (rol && !ROLES_VALIDOS.includes(rol)) {
      return res.status(400).json({ ok: false, error: 'El filtro de rol no es valido.' });
    }
    if (estado && !ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ ok: false, error: 'El filtro de estado no es valido.' });
    }
    if (sucursalId && !UUID_REGEX.test(sucursalId)) {
      return res.status(400).json({ ok: false, error: 'El filtro de sucursal no es valido.' });
    }

    const sucursalAplicada = esGerenteConSucursal(req) ? req.user.sucursal_id : sucursalId;
    if (sucursalAplicada) {
      valores.push(sucursalAplicada);
      condiciones.push(`e.sucursal_id = $${valores.length}`);
    }
    if (rol) {
      valores.push(rol);
      condiciones.push(`e.rol = $${valores.length}`);
    }
    if (estado) {
      valores.push(estado);
      condiciones.push(`e.estado = $${valores.length}`);
    }
    if (typeof search === 'string' && search.trim()) {
      valores.push(`%${search.trim()}%`);
      condiciones.push(`(
        e.nombre ILIKE $${valores.length}
        OR e.apellido ILIKE $${valores.length}
        OR e.email ILIKE $${valores.length}
        OR CONCAT(e.nombre, ' ', e.apellido) ILIKE $${valores.length}
      )`);
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const result = await pool.query(
      `${EMPLEADO_SELECT} ${where} ORDER BY e.created_at DESC`,
      valores
    );

    return res.json({ ok: true, empleados: result.rows });
  } catch (err) {
    return next(err);
  }
}

async function obtenerEmpleado(req, res, next) {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ ok: false, error: 'El identificador del empleado no es valido.' });
    }

    const condiciones = ['e.id = $1'];
    const valores = [id];
    if (esGerenteConSucursal(req)) {
      valores.push(req.user.sucursal_id);
      condiciones.push(`e.sucursal_id = $${valores.length}`);
    }

    const result = await pool.query(
      `${EMPLEADO_SELECT} WHERE ${condiciones.join(' AND ')}`,
      valores
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Empleado no encontrado.' });
    }

    return res.json({ ok: true, empleado: result.rows[0] });
  } catch (err) {
    return next(err);
  }
}

async function crearEmpleado(req, res, next) {
  try {
    const camposDesconocidos = validarCamposDesconocidos(req.body);
    if (camposDesconocidos.length) {
      return res.status(400).json({ ok: false, error: 'La solicitud contiene campos no permitidos.' });
    }

    const datos = normalizarDatos(req.body);
    const errorValidacion = validarEmpleado(datos, { passwordObligatorio: true });
    if (errorValidacion) {
      return res.status(400).json({ ok: false, error: errorValidacion });
    }
    if (!puedeGestionarSucursal(req, datos.sucursal_id)) {
      return res.status(403).json({ ok: false, error: 'Solo puedes registrar empleados en tu sucursal.' });
    }
    if (req.user.rol === 'gerente' && datos.rol === 'admin') {
      return res.status(403).json({ ok: false, error: 'Un gerente no puede asignar el rol admin.' });
    }
    if (!(await sucursalExiste(datos.sucursal_id))) {
      return res.status(400).json({ ok: false, error: 'La sucursal seleccionada no existe.' });
    }

    const passwordHash = await bcrypt.hash(datos.password, 10);
    const insert = await pool.query(
      `INSERT INTO empleados
        (email, password_hash, nombre, apellido, rol, sucursal_id, estado, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())
       RETURNING id`,
      [datos.email, passwordHash, datos.nombre, datos.apellido, datos.rol, datos.sucursal_id, datos.estado]
    );
    const result = await pool.query(`${EMPLEADO_SELECT} WHERE e.id = $1`, [insert.rows[0].id]);

    return res.status(201).json({ ok: true, empleado: result.rows[0] });
  } catch (err) {
    return responderErrorBaseDatos(err, res, next);
  }
}

async function actualizarEmpleado(req, res, next) {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ ok: false, error: 'El identificador del empleado no es valido.' });
    }
    const camposDesconocidos = validarCamposDesconocidos(req.body);
    if (camposDesconocidos.length) {
      return res.status(400).json({ ok: false, error: 'La solicitud contiene campos no permitidos.' });
    }

    const actual = await pool.query(
      'SELECT id, rol, sucursal_id FROM empleados WHERE id = $1',
      [id]
    );
    if (actual.rows.length === 0 || !puedeGestionarSucursal(req, actual.rows[0].sucursal_id)) {
      return res.status(404).json({ ok: false, error: 'Empleado no encontrado.' });
    }

    const datos = normalizarDatos(req.body);
    const errorValidacion = validarEmpleado(datos, { passwordObligatorio: false });
    if (errorValidacion) {
      return res.status(400).json({ ok: false, error: errorValidacion });
    }
    if (id === req.user.id && datos.estado === 'inactivo') {
      return res.status(400).json({ ok: false, error: 'No puedes dar de baja tu propio usuario.' });
    }
    if (!puedeGestionarSucursal(req, datos.sucursal_id)) {
      return res.status(403).json({ ok: false, error: 'Solo puedes asignar empleados a tu sucursal.' });
    }
    if (req.user.rol === 'gerente' && (actual.rows[0].rol === 'admin' || datos.rol === 'admin')) {
      return res.status(403).json({ ok: false, error: 'Un gerente no puede administrar usuarios con rol admin.' });
    }
    if (!(await sucursalExiste(datos.sucursal_id))) {
      return res.status(400).json({ ok: false, error: 'La sucursal seleccionada no existe.' });
    }

    let update;
    if (datos.password) {
      const passwordHash = await bcrypt.hash(datos.password, 10);
      update = await pool.query(
        `UPDATE empleados
         SET email = $1, password_hash = $2, nombre = $3, apellido = $4,
             rol = $5, sucursal_id = $6, estado = $7, updated_at = now()
         WHERE id = $8 RETURNING id`,
        [datos.email, passwordHash, datos.nombre, datos.apellido, datos.rol, datos.sucursal_id, datos.estado, id]
      );
    } else {
      update = await pool.query(
        `UPDATE empleados
         SET email = $1, nombre = $2, apellido = $3, rol = $4,
             sucursal_id = $5, estado = $6, updated_at = now()
         WHERE id = $7 RETURNING id`,
        [datos.email, datos.nombre, datos.apellido, datos.rol, datos.sucursal_id, datos.estado, id]
      );
    }

    const result = await pool.query(`${EMPLEADO_SELECT} WHERE e.id = $1`, [update.rows[0].id]);
    return res.json({ ok: true, empleado: result.rows[0] });
  } catch (err) {
    return responderErrorBaseDatos(err, res, next);
  }
}

async function actualizarEstado(req, res, next) {
  try {
    const { id } = req.params;
    const estado = typeof req.body.estado === 'string' ? req.body.estado.trim().toLowerCase() : '';
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ ok: false, error: 'El identificador del empleado no es valido.' });
    }
    if (Object.keys(req.body).some((campo) => campo !== 'estado')) {
      return res.status(400).json({ ok: false, error: 'Esta operacion solo permite modificar el estado.' });
    }
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ ok: false, error: 'El estado debe ser activo o inactivo.' });
    }
    if (id === req.user.id && estado === 'inactivo') {
      return res.status(400).json({ ok: false, error: 'No puedes dar de baja tu propio usuario.' });
    }

    const actual = await pool.query('SELECT id, rol, sucursal_id FROM empleados WHERE id = $1', [id]);
    if (actual.rows.length === 0 || !puedeGestionarSucursal(req, actual.rows[0].sucursal_id)) {
      return res.status(404).json({ ok: false, error: 'Empleado no encontrado.' });
    }
    if (req.user.rol === 'gerente' && actual.rows[0].rol === 'admin') {
      return res.status(403).json({ ok: false, error: 'Un gerente no puede administrar usuarios con rol admin.' });
    }

    await pool.query(
      'UPDATE empleados SET estado = $1, updated_at = now() WHERE id = $2',
      [estado, id]
    );
    const result = await pool.query(`${EMPLEADO_SELECT} WHERE e.id = $1`, [id]);

    return res.json({
      ok: true,
      message: estado === 'activo' ? 'Empleado reactivado correctamente.' : 'Empleado dado de baja correctamente.',
      empleado: result.rows[0]
    });
  } catch (err) {
    return next(err);
  }
}

async function listarSucursales(req, res, next) {
  try {
    const valores = [];
    let where = "WHERE estado = 'activo'";
    if (esGerenteConSucursal(req)) {
      valores.push(req.user.sucursal_id);
      where += ` AND id = $${valores.length}`;
    }

    const result = await pool.query(
      `SELECT id, nombre, direccion FROM sucursales ${where} ORDER BY nombre ASC`,
      valores
    );
    return res.json({ ok: true, sucursales: result.rows });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listarEmpleados,
  obtenerEmpleado,
  crearEmpleado,
  actualizarEmpleado,
  actualizarEstado,
  listarSucursales
};
