CREATE DATABASE IF NOT EXISTS usuarios;
USE usuarios;
CREATE TABLE usuarios (
  idUsuario BIGINT(20) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(100) NOT NULL UNIQUE,
  telefono VARCHAR(20),
  role VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  PRIMARY KEY (idUsuario)
);
INSERT INTO usuarios (idUsuario, nombre, correo, telefono, role, password_hash) VALUES
(123456, 'Profesor Utonio', 'profesor@powerpuff.com', '3000000000', 'admin', '123456'),
(135791, 'Bombon', 'bombon@powerpuff.com', '3000000004', 'compras', '135791'),
(192837, 'Bellota', 'bellota@powerpuff.com', '3000000002', 'employer', '192837'),
(246810, 'Burbuja', 'burbuja@powerpuff.com', '3000000003', 'compras', '246810'),
(555001, 'Usuario Actualizado', 'nuevo.usuario.actualizado@example.com', '3000000998', 'admin', 'claveY'),
(987654, 'Mojo Jojo', 'mojojojo@powerpuff.com', '3000000001', 'employer', '987654'),
(999888, 'Nuevo Amy', 'Amy.usuario@example.com', '3000008899', 'compras', 'claveX');