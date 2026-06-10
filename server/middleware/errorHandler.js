function errorHandler(err, req, res, _next) {
  console.error('Error:', err.message);
  console.error(err.stack);

  if (err.code === '23505') {
    return res.status(409).json({ error: 'El registro ya existe (violación de unicidad)' });
  }

  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referencia inválida: el registro relacionado no existe' });
  }

  if (err.code === '23502') {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(status).json({ error: message });
}

module.exports = { errorHandler };
