CREATE DATABASE IF NOT EXISTS ventas;
USE ventas;
CREATE TABLE ventas (
  idVenta INT(11) NOT NULL AUTO_INCREMENT,
  idVendedor VARCHAR(50) NOT NULL,
  idMedicamento VARCHAR(50) NOT NULL,
  nombreMedicamento VARCHAR(100) NOT NULL,
  cantidadVendida INT(11) NOT NULL,
  medioPago VARCHAR(30) NOT NULL,
  precioUnitario DECIMAL(12,2) NOT NULL,
  totalVenta DECIMAL(12,2) NOT NULL,
  fechaVenta DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (idVenta)
);
INSERT INTO ventas (
  idVenta, idVendedor, idMedicamento, nombreMedicamento, cantidadVendida, medioPago, precioUnitario, totalVenta, fechaVenta
) VALUES
(1, '987654', '1', 'Ibuprofeno', 2, 'efectivo', 400.00, 800.00, '2025-09-14 10:00:00'),
(2, '987654', '2', 'Acetaminofen', 5, 'tarjeta', 300.00, 1500.00, '2025-09-14 10:05:00'),
(3, '192837', '3', 'Naproxeno', 3, 'efectivo', 450.00, 1350.00, '2025-09-14 10:10:00'),
(4, '192837', '1', 'Dolex', 2, 'efectivo', 8500.00, 17000.00, '2025-09-19 01:56:29'),
(5, '192837', '1', 'Dolex', 2, 'efectivo', 8500.00, 17000.00, '2025-09-19 02:06:37');