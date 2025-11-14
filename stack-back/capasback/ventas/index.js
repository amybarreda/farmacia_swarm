const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const ventasController = require('./controllers/ventasController');

const app = express();

app.use(express.json());
app.use(cors({
  origin: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.use(morgan('dev'));

app.get('/health', (_, res) => res.json({ ok: true }));
app.use('/api/ventas', ventasController);

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`Ventas ejecutándose en :${PORT}`);
});
