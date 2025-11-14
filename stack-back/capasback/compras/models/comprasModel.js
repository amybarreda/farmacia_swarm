const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'amymysql',
  database: process.env.DB_NAME || 'compras',
  port: Number(process.env.DB_PORT || 3306)
});

function serializeDetalles(detalles) {
  // Si ya es string, guardar tal cual (evita doble-serialización de legados)
  if (typeof detalles === 'string') return detalles;
  // Si es objeto/arreglo, serializar
  try { return JSON.stringify(detalles); } catch { return String(detalles ?? ''); }
}

async function obtenerOrdenes() {
  const [rows] = await pool.query('SELECT * FROM ordenesCompra');
  return rows.map(row => {
    let detalles = row.detalles;
    try { detalles = JSON.parse(row.detalles); } catch {}
    return { ...row, detalles };
  });
}

async function obtenerOrdenPorId(id) {
  const [rows] = await pool.query('SELECT * FROM ordenesCompra WHERE idOrden = ?', [id]);
  if (!rows[0]) return null;
  let detalles = rows[0].detalles;
  try { detalles = JSON.parse(rows[0].detalles); } catch {}
  return { ...rows[0], detalles };
}

async function crearOrden(nombreProveedor, fechaOrden, estado, detalles, cantidadCompra, montoTotal) {
  const [result] = await pool.query(
    `INSERT INTO ordenesCompra 
     (nombreProveedor, fechaOrden, estado, detalles, cantidadCompra, montoTotal) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      nombreProveedor,
      fechaOrden,
      estado,
      serializeDetalles(detalles),
      cantidadCompra,
      montoTotal
    ]
  );
  return result;
}

async function actualizarOrden(id, nombreProveedor, fechaOrden, estado, detalles, cantidadCompra, montoTotal) {
  const [result] = await pool.query(
    `UPDATE ordenesCompra
     SET nombreProveedor = ?, fechaOrden = ?, estado = ?, detalles = ?, cantidadCompra = ?, montoTotal = ?
     WHERE idOrden = ?`,
    [
      nombreProveedor,
      fechaOrden,
      estado,
      serializeDetalles(detalles),
      cantidadCompra,
      montoTotal,
      id
    ]
  );
  return result;
}

async function eliminarOrden(id) {
  const [result] = await pool.query('DELETE FROM ordenesCompra WHERE idOrden = ?', [id]);
  return result;
}

module.exports = { pool,
  obtenerOrdenes,
  obtenerOrdenPorId,
  crearOrden,
  actualizarOrden,
  eliminarOrden
};