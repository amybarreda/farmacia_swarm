const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const comprasRouter = require('./controllers/comprasController');

const app = express();
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => res.json({ ok: true }));
app.use('/api/compras', comprasRouter);

app.use((req, res) => res.status(404).json({ mensaje: 'Ruta no encontrada' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ mensaje: 'Error del servidor' });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Compras ejecutándose en :${PORT}`));