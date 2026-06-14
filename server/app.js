const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const equipoRoutes = require('./routes/equipoRoutes');
const mantenimientoRoutes = require('./routes/mantenimientoRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const incidenciaRoutes = require('./routes/incidenciaRoutes');
const empleadoRoutes = require('./routes/empleadoRoutes');
const horarioRoutes = require('./routes/horarioRoutes');
const tareaRoutes = require('./routes/tareaRoutes');
const areaRoutes = require('./routes/areaRoutes');
const rrhhIncidenciaRoutes = require('./routes/rrhhIncidenciaRoutes');

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
app.use('/api/empleados', empleadoRoutes);
app.use('/api/horarios-asistencias', horarioRoutes);
app.use('/api/tareas', tareaRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/rrhh/incidencias', rrhhIncidenciaRoutes);

app.use(errorHandler);

module.exports = app;
