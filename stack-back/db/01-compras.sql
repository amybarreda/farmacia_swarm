CREATE DATABASE IF NOT EXISTS compras;
USE compras;
CREATE TABLE ordenesCompra (
  idOrden INT(11) NOT NULL AUTO_INCREMENT,
  idUsuario VARCHAR(50) NOT NULL,
  nombreProveedor VARCHAR(255) NOT NULL,
  fechaOrden DATE NOT NULL,
  estado ENUM('pendiente','aprobada','enviada') NOT NULL DEFAULT 'pendiente',
  detalles LONGTEXT NOT NULL,
  cantidadCompra INT(11) NOT NULL,
  montoTotal DECIMAL(20,2) NOT NULL,
  PRIMARY KEY (idOrden)
);
INSERT INTO ordenesCompra (
  idOrden, idUsuario, nombreProveedor, fechaOrden, estado, detalles, cantidadCompra, montoTotal
) VALUES
(3, 'admin123', 'Proveedor ACME', '2025-09-19', 'enviada',
 '[{\"idMedicamento\":1,\"cantidad\":10},{\"idMedicamento\":2,\"cantidad\":5}]',
 15, 76000.00),
(4, '', 'Genfar S.A.', '2025-10-15', 'pendiente',
 '[{\"idMedicamento\":1,\"cantidad\":20,\"precioUnit\":4500},{\"idMedicamento\":2,\"cantidad\":10,\"precioUnit\":6200}]',
 30, 152000.00);
