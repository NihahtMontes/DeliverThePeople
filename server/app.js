const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const equipoRoutes = require('./routes/equipoRoutes');
const mantenimientoRoutes = require('./routes/mantenimientoRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const incidenciaRoutes = require('./routes/incidenciaRoutes');
const pagoRoutes = require('./routes/pagoRoutes');
const mensajeRoutes = require('./routes/mensajeRoutes');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/equipos', equipoRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/mantenimientos', mantenimientoRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/incidencias', incidenciaRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/mensajes', mensajeRoutes);

app.use(errorHandler);

module.exports = app;
