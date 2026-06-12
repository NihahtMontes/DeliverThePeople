const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const equipoRoutes = require('./routes/equipoRoutes');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);

// TODO: Registrar más rutas aquí a medida que se implementen
// app.use('/api/empleados', empleadoRoutes);
// app.use('/api/pedidos', pedidoRoutes);
// app.use('/api/inventario', inventarioRoutes);
app.use('/api/equipos', equipoRoutes);
// app.use('/api/tareas', tareaRoutes);
// app.use('/api/incidencias', incidenciaRoutes);
// app.use('/api/horarios-asistencias', horarioAsistenciaRoutes);

app.use(errorHandler);

module.exports = app;
