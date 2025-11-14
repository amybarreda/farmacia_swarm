const mysql = require('mysql2/promise');

const connection = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'amymysql',
  database: process.env.DB_NAME || 'inventario',
  port: Number(process.env.DB_PORT || 3306)
});

// ===== SELECTS =====
async function obtenerInventarios() {
  const [rows] = await connection.query(
    `SELECT idMedicamento, nombreMarca, nombreGenerico, concentracion, undMedida,
            presentacion, fechaExpiracion, cantidadStock, nombreProveedor,
            precioCompra, precioVenta, correo, telefono
       FROM inventario
   ORDER BY idMedicamento`
  );
  return rows;
}

async function obtenerProductoPorId(idMedicamento) {
  const [rows] = await connection.query(
    `SELECT idMedicamento, nombreMarca, nombreGenerico, concentracion, undMedida,
            presentacion, fechaExpiracion, cantidadStock, nombreProveedor,
            precioCompra, precioVenta, correo, telefono
       FROM inventario
      WHERE idMedicamento = ?`,
    [idMedicamento]
  );
  return rows[0];
}

// Búsqueda (por id/nombreMarca/nombreGenerico)
async function buscarProductos({ idMedicamento, nombreMarca, nombreGenerico }) {
  const parts = [];
  const params = [];

  if (idMedicamento) { parts.push('idMedicamento = ?'); params.push(idMedicamento); }
  if (nombreMarca)    { parts.push('nombreMarca LIKE ?'); params.push(`%${nombreMarca}%`); }
  if (nombreGenerico) { parts.push('nombreGenerico LIKE ?'); params.push(`%${nombreGenerico}%`); }

  const where = parts.length ? `WHERE ${parts.join(' AND ')}` : '';
  const [rows] = await connection.query(
    `SELECT idMedicamento, nombreMarca, nombreGenerico, concentracion, undMedida,
            presentacion, fechaExpiracion, cantidadStock, nombreProveedor,
            precioCompra, precioVenta, correo, telefono
       FROM inventario
       ${where}
   ORDER BY idMedicamento`,
    params
  );
  return rows;
}

// ===== INSERT =====
async function crearProducto(datos) {
  const {
    nombreMarca, nombreGenerico, concentracion, undMedida, presentacion,
    fechaExpiracion, cantidadStock, nombreProveedor, precioCompra, precioVenta,
    correo, telefono,
  } = datos;

  const sql = `
    INSERT INTO inventario
      (nombreMarca, nombreGenerico, concentracion, undMedida, presentacion,
       fechaExpiracion, cantidadStock, nombreProveedor, precioCompra, precioVenta,
       correo, telefono)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `;

  const [result] = await connection.query(sql, [
    nombreMarca, nombreGenerico, concentracion, undMedida, presentacion,
    fechaExpiracion, cantidadStock, nombreProveedor, precioCompra, precioVenta,
    correo, telefono,
  ]);
  return result;
}

// ===== UPDATE (parcial con COALESCE) =====
async function actualizarProducto(idMedicamento, datos) {
  const {
    nombreMarca, nombreGenerico, concentracion, undMedida, presentacion,
    fechaExpiracion, cantidadStock, nombreProveedor, precioCompra, precioVenta,
    correo, telefono,
  } = datos;

  const sql = `
    UPDATE inventario
       SET nombreMarca     = COALESCE(?, nombreMarca),
           nombreGenerico  = COALESCE(?, nombreGenerico),
           concentracion   = COALESCE(?, concentracion),
           undMedida       = COALESCE(?, undMedida),
           presentacion    = COALESCE(?, presentacion),
           fechaExpiracion = COALESCE(?, fechaExpiracion),
           cantidadStock   = COALESCE(?, cantidadStock),
           nombreProveedor = COALESCE(?, nombreProveedor),
           precioCompra    = COALESCE(?, precioCompra),
           precioVenta     = COALESCE(?, precioVenta),
           correo          = COALESCE(?, correo),
           telefono        = COALESCE(?, telefono)
     WHERE idMedicamento = ?
  `;

  const [result] = await connection.query(sql, [
    nombreMarca ?? null,
    nombreGenerico ?? null,
    concentracion ?? null,
    undMedida ?? null,
    presentacion ?? null,
    fechaExpiracion ?? null,
    cantidadStock ?? null,
    nombreProveedor ?? null,
    precioCompra ?? null,
    precioVenta ?? null,
    correo ?? null,
    telefono ?? null,
    idMedicamento,
  ]);
  return result;
}

// ===== UPDATE STOCK =====
async function actualizarStock(idMedicamento, cantidad) {
  const [result] = await connection.query(
    'UPDATE inventario SET cantidadStock = ? WHERE idMedicamento = ?',
    [cantidad, idMedicamento]
  );
  return result;
}

// ===== DELETE =====
async function eliminarProducto(idMedicamento) {
  const [result] = await connection.query(
    'DELETE FROM inventario WHERE idMedicamento = ?',
    [idMedicamento]
  );
  return result;
}

module.exports = { connection,
  obtenerInventarios,
  obtenerProductoPorId,
  buscarProductos,
  crearProducto,
  actualizarProducto,
  actualizarStock,
  eliminarProducto,
};
