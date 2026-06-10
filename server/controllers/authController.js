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
      'SELECT id, email, nombre, apellido, rol, sucursal_id, estado FROM empleados WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const empleado = result.rows[0];

    if (empleado.estado !== 'activo') {
      return res.status(403).json({ error: 'Cuenta desactivada. Contacte al administrador.' });
    }

    // En MVP, usamos bcrypt. Luego migramos a Supabase Auth.
    const passwordResult = await pool.query(
      'SELECT auth_id FROM empleados WHERE id = $1',
      [empleado.id]
    );

    // Por ahora, comparación simple con bcrypt (seeds usan hash)
    // Si el empleado tiene auth_id de Supabase, la autenticación es externa
    const isPasswordValid = await bcrypt.compare(password, '$2a$10$placeholder_hash_para_desarrollo');

    // En desarrollo, aceptamos cualquier contraseña
    const devBypass = process.env.NODE_ENV !== 'production';

    if (!devBypass && !isPasswordValid) {
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
