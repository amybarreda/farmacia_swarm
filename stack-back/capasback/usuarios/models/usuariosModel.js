const mysql = require('mysql2/promise');

const connection = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'amymysql',
  database: process.env.DB_NAME || 'usuarios',
  port: Number(process.env.DB_PORT || 3306)
});

// Normaliza una fila de BD al objeto que usa el resto del código
function mapUserRow(row) {
  const role = row.role ?? null;
  return {
    idUsuario: row.idUsuario,
    nombre: row.nombre,
    correo: row.correo,
    telefono: row.telefono,
    role,            // columna real en la BD
    tipo: role,      // alias para compatibilidad
    password_hash: row.password_hash ?? null
  };
}

// Obtener todos los usuarios
async function obtenerUsuarios() {
  try {
    const [rows] = await connection.query(
      'SELECT idUsuario, nombre, correo, telefono, role FROM usuarios'
    );
    return rows.map(mapUserRow);
  } catch (error) {
    console.error('Error en obtenerUsuarios:', error);
    throw error;
  }
}

// Obtener un usuario por idUsuario
async function obtenerUsuarioPorId(idUsuario) {
  try {
    const [rows] = await connection.query(
      'SELECT idUsuario, nombre, correo, telefono, role, password_hash FROM usuarios WHERE idUsuario = ?',
      [idUsuario]
    );
    return rows[0] ? mapUserRow(rows[0]) : null;
  } catch (error) {
    console.error('Error en obtenerUsuarioPorId:', error);
    throw error;
  }
}

// Obtener usuarios por "tipo" (role)
async function obtenerUsuariosPorTipo(tipo) {
  try {
    const [rows] = await connection.query(
      'SELECT idUsuario, nombre, correo, telefono, role FROM usuarios WHERE role = ?',
      [tipo]
    );
    return rows.map(mapUserRow);
  } catch (error) {
    console.error('Error en obtenerUsuariosPorTipo:', error);
    throw error;
  }
}

// Crear un nuevo usuario
async function crearUsuario(idUsuario, nombre, correo, telefono, tipo, password_hash) {
  try {
    const sql = `
      INSERT INTO usuarios (idUsuario, nombre, correo, telefono, role, password_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await connection.query(sql, [
      idUsuario, nombre, correo, telefono, tipo, password_hash
    ]);
    return result;
  } catch (error) {
    console.error('Error en crearUsuario:', error);
    throw error;
  }
}

// Actualizar un usuario (NO sobreescribe role si viene null/undefined; password opcional)
async function actualizarUsuario(idUsuario, nombre, correo, telefono, tipo, password_hash) {
  try {
    const sql = `
      UPDATE usuarios
         SET nombre = ?,
             correo = ?,
             telefono = ?,
             role = COALESCE(?, role),
             password_hash = CASE
                               WHEN ? IS NULL OR ? = '' THEN password_hash
                               ELSE ?
                             END
       WHERE idUsuario = ?
    `;
    const [result] = await connection.query(sql, [
      nombre,
      correo,
      telefono,
      (tipo ?? null),     // si viene undefined -> no cambia (COALESCE)
      password_hash,      // CASE
      password_hash,      // CASE
      password_hash,      // nuevo valor si trae algo
      idUsuario
    ]);
    return result;
  } catch (error) {
    console.error('Error en actualizarUsuario:', error);
    throw error;
  }
}

// Eliminar un usuario
async function eliminarUsuario(idUsuario) {
  try {
    const [result] = await connection.query(
      'DELETE FROM usuarios WHERE idUsuario = ?',
      [idUsuario]
    );
    return result;
  } catch (error) {
    console.error('Error en eliminarUsuario:', error);
    throw error;
  }
}

module.exports = {connection,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  obtenerUsuariosPorTipo,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario
};
