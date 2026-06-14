const { pool } = require('../config/db');

// Obtener todo el inventario
async function getInventario(req, res, next) {
  try {
    const sucursalId = req.user.sucursal_id;
    const rol = req.user.rol;
    
    let result;
    // Permitir ver todo el inventario si es administrador, o si no tiene sucursal
    if (rol === 'administrador' || rol === 'admin' || !sucursalId) {
      result = await pool.query(
        `SELECT * FROM inventario 
         ORDER BY nombre ASC`
      );
    } else {
      // Filtrar por sucursal si el usuario pertenece a una
      result = await pool.query(
        `SELECT * FROM inventario 
         WHERE sucursal_id = $1
         ORDER BY nombre ASC`,
        [sucursalId]
      );
    }

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// Crear un nuevo insumo (Alta)
async function crearInsumo(req, res, next) {
  try {
    const sucursalId = req.user.sucursal_id;
    if (!sucursalId && req.user.rol !== 'admin' && req.user.rol !== 'administrador') {
      return res.status(400).json({ error: 'No tienes una sucursal asignada.' });
    }
    const finalSucursalId = req.body.sucursal_id || sucursalId;
    const { nombre, categoria, unidad, stock_minimo, costo_unitario } = req.body;

    if (!nombre || !categoria || !unidad || stock_minimo === undefined) {
      return res.status(400).json({ error: 'Faltan campos requeridos para crear el insumo.' });
    }

    // Validar unicidad (nombre en la misma sucursal y activo)
    const existe = await pool.query(
      `SELECT id FROM inventario WHERE nombre = $1 AND sucursal_id = $2 AND activo = true`,
      [nombre, finalSucursalId]
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'Ya existe un insumo activo con ese nombre en esta sucursal.' });
    }

    const result = await pool.query(
      `INSERT INTO inventario (sucursal_id, nombre, categoria, cantidad_actual, unidad, stock_minimo, costo_unitario, activo, created_at, updated_at) 
       VALUES ($1, $2, $3, 0, $4, $5, $6, true, now(), now()) RETURNING *`,
      [finalSucursalId, nombre, categoria, unidad, stock_minimo, costo_unitario || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// Editar insumo
async function editarInsumo(req, res, next) {
  try {
    const { id } = req.params;
    const { nombre, categoria, unidad, stock_minimo, costo_unitario } = req.body;

    // Obtener insumo actual para sacar sucursal
    const insumo = await pool.query(`SELECT sucursal_id FROM inventario WHERE id = $1`, [id]);
    if (insumo.rows.length === 0) return res.status(404).json({ error: 'Insumo no encontrado.' });
    const sucursalId = insumo.rows[0].sucursal_id;

    // Validar unicidad de nombre excluyendo el actual
    const existe = await pool.query(
      `SELECT id FROM inventario WHERE nombre = $1 AND sucursal_id = $2 AND activo = true AND id != $3`,
      [nombre, sucursalId, id]
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'Ya existe otro insumo activo con ese nombre en esta sucursal.' });
    }

    // No se edita cantidad_actual ni activo desde aquí
    const result = await pool.query(
      `UPDATE inventario 
       SET nombre = COALESCE($1, nombre),
           categoria = COALESCE($2, categoria),
           unidad = COALESCE($3, unidad),
           stock_minimo = COALESCE($4, stock_minimo),
           costo_unitario = COALESCE($5, costo_unitario),
           updated_at = now()
       WHERE id = $6 RETURNING *`,
      [nombre, categoria, unidad, stock_minimo, costo_unitario, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// Inactivar insumo
async function inactivarInsumo(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE inventario SET activo = false, updated_at = now() WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Insumo no encontrado.' });
    res.json({ message: 'Insumo inactivado correctamente.', insumo: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// Reactivar insumo (volver a activo)
async function reactivarInsumo(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE inventario SET activo = true, updated_at = now() WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Insumo no encontrado.' });
    res.json({ message: 'Insumo reactivado correctamente.', insumo: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// Registrar movimiento transaccional
async function registrarMovimiento(req, res, next) {
  const client = await pool.connect();
  try {
    const { id: inventario_id } = req.params;
    const empleado_id = req.user.id;
    const { tipo_movimiento, cantidad, motivo, observaciones, costo_compra } = req.body;

    if (!tipo_movimiento || !cantidad || Number(cantidad) <= 0) {
      return res.status(400).json({ error: 'Se requiere un tipo de movimiento y una cantidad mayor a cero.' });
    }

    if (tipo_movimiento === 'MERMA' && !motivo) {
      return res.status(400).json({ error: 'El motivo es obligatorio para mermas.' });
    }

    await client.query('BEGIN');

    // Bloquear fila para actualización
    const insumoRes = await client.query('SELECT * FROM inventario WHERE id = $1 FOR UPDATE', [inventario_id]);
    if (insumoRes.rows.length === 0) {
      throw new Error('El insumo no existe');
    }
    const insumo = insumoRes.rows[0];

    const stockAnterior = Number(insumo.cantidad_actual);
    const costoPromedioAnterior = Number(insumo.costo_unitario || 0);
    const cantOperacion = Number(cantidad);
    
    let stockNuevo = stockAnterior;
    let costoPromedioNuevo = costoPromedioAnterior;
    let costoMovimientoUnitario = 0;
    let costoMovimientoTotal = 0;

    if (tipo_movimiento === 'INGRESO') {
      if (costo_compra === undefined || Number(costo_compra) < 0) {
        throw new Error('El costo de compra es requerido para ingresos.');
      }
      costoMovimientoUnitario = Number(costo_compra);
      costoMovimientoTotal = cantOperacion * costoMovimientoUnitario;
      
      const valorAnterior = stockAnterior * costoPromedioAnterior;
      stockNuevo = stockAnterior + cantOperacion;
      const valorTotalNuevo = valorAnterior + costoMovimientoTotal;
      costoPromedioNuevo = valorTotalNuevo / stockNuevo;
      
    } else if (tipo_movimiento === 'MERMA') {
      if (cantOperacion > stockAnterior) {
        throw new Error('No se puede mermar más stock del disponible. Saldo negativo no permitido.');
      }
      costoMovimientoUnitario = costoPromedioAnterior;
      costoMovimientoTotal = cantOperacion * costoMovimientoUnitario;
      stockNuevo = stockAnterior - cantOperacion;
    } else {
      throw new Error('Tipo de movimiento inválido (INGRESO / MERMA).');
    }

    // Insertar movimiento
    const movRes = await client.query(
      `INSERT INTO movimiento_inventario 
       (inventario_id, empleado_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, observaciones, costo_unitario, costo_total, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now()) RETURNING *`,
      [inventario_id, empleado_id, tipo_movimiento, cantOperacion, stockAnterior, stockNuevo, motivo || null, observaciones || null, costoMovimientoUnitario, costoMovimientoTotal]
    );

    // Actualizar inventario
    await client.query(
      `UPDATE inventario SET cantidad_actual = $1, costo_unitario = $2, updated_at = now() WHERE id = $3`,
      [stockNuevo, costoPromedioNuevo, inventario_id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Movimiento registrado correctamente.',
      movimiento: movRes.rows[0],
      nuevoStock: stockNuevo
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
}

// Obtener movimientos de un insumo
async function getMovimientos(req, res, next) {
  try {
    const { id } = req.params;
    // Hacemos JOIN para traer también el nombre del empleado si existe
    const result = await pool.query(
      `SELECT m.*, e.nombre as empleado_nombre, e.apellido as empleado_apellido
       FROM movimiento_inventario m
       LEFT JOIN empleados e ON m.empleado_id = e.id
       WHERE m.inventario_id = $1
       ORDER BY m.created_at DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getInventario,
  crearInsumo,
  editarInsumo,
  inactivarInsumo,
  reactivarInsumo,
  registrarMovimiento,
  getMovimientos
};

