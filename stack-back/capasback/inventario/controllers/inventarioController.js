const { Router } = require('express');
const router = Router();
const inventarioModel = require('../models/inventarioModel');

// helpers
function toNumber2(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
function toInt(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}
function toDateISO(v) {
  if (!v) return null;
  // acepta "2027-01-15" o "15/01/2027"
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = String(v).match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const [ , d, M, y ] = m;
    return `${y}-${String(M).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }
  return v; // lo deja pasar tal cual si ya viene válido
}

// ===== RUTAS =====

// Buscar productos (debe ir antes del :id)
router.get('/buscar/productos', async (req, res) => {
  try {
    const { id, marca, generico } = req.query;
    const productos = await inventarioModel.buscarProductos({
      idMedicamento: id,
      nombreMarca: marca,
      nombreGenerico: generico
    });
    return res.status(200).json(productos);
  } catch (error) {
    return res.status(500).json({ error: 'Error en la búsqueda' });
  }
});

// Obtener todo o filtrar por query
router.get('/', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store'); // evita 304 cacheado en el front
    const { id, nombreMarca, nombreGenerico } = req.query;
    if (id || nombreMarca || nombreGenerico) {
      const productos = await inventarioModel.buscarProductos({
        idMedicamento: id,
        nombreMarca,
        nombreGenerico
      });
      return res.status(200).json(productos);
    }
    const inventarios = await inventarioModel.obtenerInventarios();
    return res.status(200).json(inventarios);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener inventario' });
  }
});

// Obtener un producto por idMedicamento
router.get('/:idMedicamento', async (req, res) => {
  try {
    const { idMedicamento } = req.params;
    const item = await inventarioModel.obtenerProductoPorId(idMedicamento);
    if (!item) return res.status(404).json({ error: 'Producto no encontrado' });
    return res.status(200).json(item);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener el producto' });
  }
});

// Actualizar SOLO stock (lo usa ventas)
router.put('/:idMedicamento/stock', async (req, res) => {
  try {
    const { idMedicamento } = req.params;
    const { cantidad } = req.body;
    const cantidadNum = toInt(cantidad);
    if (cantidadNum === null) {
      return res.status(400).json({ error: 'cantidad (number) es obligatoria' });
    }
    const result = await inventarioModel.actualizarStock(idMedicamento, cantidadNum);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto no encontrado para actualizar stock' });
    }
    return res.status(200).json({ mensaje: 'Stock actualizado con éxito' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar stock' });
  }
});

// Crear nuevo producto (TODAS las columnas requeridas)
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const nuevo = {
      nombreMarca:     String(body.nombreMarca || '').trim(),
      nombreGenerico:  String(body.nombreGenerico || '').trim(),
      concentracion:   toNumber2(body.concentracion),
      undMedida:       String(body.undMedida || '').trim(),
      presentacion:    String(body.presentacion || '').trim(),
      fechaExpiracion: toDateISO(body.fechaExpiracion),
      cantidadStock:   toInt(body.cantidadStock),
      nombreProveedor: String(body.nombreProveedor || '').trim(),
      precioCompra:    toNumber2(body.precioCompra),
      precioVenta:     toNumber2(body.precioVenta),
      correo:          String(body.correo || '').trim(),
      telefono:        String(body.telefono || '').trim(),
    };

    // Validaciones mínimas (todas las NO NULL del esquema)
    for (const k of Object.keys(nuevo)) {
      if (nuevo[k] === null || nuevo[k] === '') {
        return res.status(400).json({ error: `Campo obligatorio faltante: ${k}` });
      }
    }

    const result = await inventarioModel.crearProducto(nuevo);
    return res.status(201).json({ mensaje: 'Producto insertado con éxito', insertId: result.insertId });
  } catch (error) {
    return res.status(500).json({ error: 'Error al insertar el producto' });
  }
});

// Actualizar producto (TODOS los campos del schema)
router.put('/:idMedicamento', async (req, res) => {
  try {
    const { idMedicamento } = req.params;
    const body = req.body || {};

    const datos = {
      nombreMarca:     body.nombreMarca != null ? String(body.nombreMarca).trim() : null,
      nombreGenerico:  body.nombreGenerico != null ? String(body.nombreGenerico).trim() : null,
      concentracion:   body.concentracion != null ? toNumber2(body.concentracion) : null,
      undMedida:       body.undMedida != null ? String(body.undMedida).trim() : null,
      presentacion:    body.presentacion != null ? String(body.presentacion).trim() : null,
      fechaExpiracion: body.fechaExpiracion != null ? toDateISO(body.fechaExpiracion) : null,
      cantidadStock:   body.cantidadStock != null ? toInt(body.cantidadStock) : null,
      nombreProveedor: body.nombreProveedor != null ? String(body.nombreProveedor).trim() : null,
      precioCompra:    body.precioCompra != null ? toNumber2(body.precioCompra) : null,
      precioVenta:     body.precioVenta != null ? toNumber2(body.precioVenta) : null,
      correo:          body.correo != null ? String(body.correo).trim() : null,
      telefono:        body.telefono != null ? String(body.telefono).trim() : null,
    };

    const result = await inventarioModel.actualizarProducto(idMedicamento, datos);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto no encontrado para actualizar' });
    }
    return res.status(200).json({ mensaje: 'Producto actualizado con éxito' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar el producto' });
  }
});

// Eliminar producto
router.delete('/:idMedicamento', async (req, res) => {
  try {
    const { idMedicamento } = req.params;
    const result = await inventarioModel.eliminarProducto(idMedicamento);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto no encontrado para eliminar' });
    }
    return res.status(200).json({ mensaje: 'Producto eliminado con éxito' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al eliminar el producto' });
  }
});

module.exports = router;