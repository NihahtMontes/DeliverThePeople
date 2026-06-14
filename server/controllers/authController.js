const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { sign } = require('../utils/jwt');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const result = await pool.query(
      'SELECT id, email, nombre, apellido, rol, sucursal_id, estado, password_hash FROM empleados WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const empleado = result.rows[0];

    if (empleado.estado !== 'activo') {
      return res.status(403).json({ error: 'Cuenta desactivada. Contacte al administrador.' });
    }

    if (!empleado.password_hash) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isPasswordValid = await bcrypt.compare(password, empleado.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = sign({
      id: empleado.id,
      email: empleado.email,
      rol: empleado.rol,
      sucursal_id: empleado.sucursal_id,
      nombre: empleado.nombre,
      apellido: empleado.apellido
    });

    res.json({
      token,
      user: {
        id: empleado.id,
        email: empleado.email,
        nombre: empleado.nombre,
        apellido: empleado.apellido,
        rol: empleado.rol,
        sucursal_id: empleado.sucursal_id
      }
    });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT id, email, nombre, apellido, rol, sucursal_id, estado FROM empleados WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, me };
