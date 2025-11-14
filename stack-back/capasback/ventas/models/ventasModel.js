// ventas/models/ventasModel.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'amymysql',
  database: process.env.DB_NAME || 'ventas',
  port: Number(process.env.DB_PORT || 3306)
});

async function obtenerVentas() {
  const [rows] = await pool.query('SELECT * FROM ventas ORDER BY idVenta DESC');
  return rows;
}

async function obtenerVentaPorId(idVenta) {
  const [rows] = await pool.query('SELECT * FROM ventas WHERE idVenta = ?', [idVenta]);
  return rows[0];
}

async function crearVenta(idVendedor, idMedicamento, nombreMedicamento, cantidadVendida, medioPago, precioUnitario, totalVenta) {
  // Validación de seguridad: si algo viene mal, cortamos aquí con un error claro
  const qty   = Number(cantidadVendida);
  const pu    = Number(precioUnitario);
  const total = Number(totalVenta);
  if (!idVendedor || !idMedicamento || !nombreMedicamento || !medioPago || !Number.isFinite(qty) || !Number.isFinite(pu) || !Number.isFinite(total)) {
    throw new Error('crearVenta: parámetros inválidos (undefined/NaN)');
  }

  const sql = `
    INSERT INTO ventas
      (idVendedor, idMedicamento, nombreMedicamento, cantidadVendida, medioPago, precioUnitario, totalVenta, fechaVenta)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
  `;
  const [result] = await pool.query(sql, [
    String(idVendedor),
    String(idMedicamento),
    String(nombreMedicamento),
    qty,
    String(medioPago),
    pu,
    total
  ]);
  return result.insertId;
}

module.exports = { pool, obtenerVentas, obtenerVentaPorId, crearVenta };