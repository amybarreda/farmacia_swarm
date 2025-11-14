CREATE DATABASE IF NOT EXISTS inventario;
USE inventario;
CREATE TABLE inventario (
  idMedicamento INT(11) NOT NULL AUTO_INCREMENT,
  nombreMarca VARCHAR(100) NOT NULL,
  nombreGenerico VARCHAR(100) NOT NULL,
  concentracion DECIMAL(10,2) NOT NULL,
  undMedida VARCHAR(20) NOT NULL,
  presentacion VARCHAR(100) NOT NULL,
  fechaExpiracion DATE NOT NULL,
  cantidadStock INT(11) NOT NULL,
  nombreProveedor VARCHAR(100) NOT NULL,
  precioCompra DECIMAL(12,2) NOT NULL,
  precioVenta DECIMAL(12,2) NOT NULL,
  correo VARCHAR(100) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  PRIMARY KEY (idMedicamento)
);
INSERT INTO inventario (
  idMedicamento, nombreMarca, nombreGenerico, concentracion, undMedida, presentacion, fechaExpiracion,
  cantidadStock, nombreProveedor, precioCompra, precioVenta, correo, telefono
) VALUES
(1, 'Dolex', 'Acetaminofen', 500.00, 'mg', 'Tabletas', '2025-06-30', 146, 'Genfar S.A.', 4500.00, 8500.00, 'ventas@genfar.com', '6013456789'),
(2, 'Naproxeno', 'Naproxeno sodico', 275.00, 'mg', 'Tabletas recubiertas', '2024-12-15', 80, 'Laboratorios Lafrancol', 6200.00, 12500.00, 'contacto@lafrancol.com', '6012345678'),
(3, 'Amoxicilina', 'Amoxicilina trihidratada', 250.00, 'mg', 'Cápsulas', '2024-09-30', 120, 'Tecnoquímicas S.A.', 3800.00, 7500.00, 'info@tecnquimicas.com', '6019876543'),
(4, 'Sal de Frutas Lua', 'Bicarbonato de sodio', 3.50, 'g', 'Sobres efervescentes', '2025-03-20', 200, 'Laboratorios Lua', 2800.00, 5200.00, 'pedidos@lua.com.co', '6018765432'),
(5, 'Loratadina', 'Loratadina', 10.00, 'mg', 'Tabletas masticables', '2025-01-10', 95, 'Procaps S.A.', 3200.00, 6800.00, 'clientes@procaps.com', '6017654321'),
(7, 'Dolex', 'Dolex niños jarabe', 90.00, 'ml', 'frasco x 90 ml', '2027-01-15', 98, '', 0.00, 2600.00, '', '');