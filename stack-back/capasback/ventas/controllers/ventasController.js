const { Router } = require('express');
const axios = require('axios');
const ventasModel = require('../models/ventasModel');

const router = Router();

// Bases de microservicios (directo, no gateway)
const USUARIOS_BASE   = process.env.USUARIOS_BASE   || 'http://localhost:3005/api/usuarios';
const INVENTARIO_BASE = process.env.INVENTARIO_BASE || 'http://localhost:3003/api/inventario';

router.get('/ping', (_req, res) => res.json({ ok: true, svc: 'ventas' }));

// LISTAR
router.get('/', async (_req, res) => {
  try {
    const ventas = await ventasModel.obtenerVentas();
    res.status(200).json(ventas);
  } catch (e) {
    console.error('Error al obtener ventas:', e);
    res.status(500).json({ error: 'Error del servidor al obtener ventas' });
  }
});

// OBTENER POR ID
router.get('/:idVenta', async (req, res) => {
  try {
    const venta = await ventasModel.obtenerVentaPorId(req.params.idVenta);
    if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
    res.status(200).json(venta);
  } catch (e) {
    console.error('Error al obtener venta:', e);
    res.status(500).json({ error: 'Error del servidor al obtener la venta' });
  }
});

// CREAR
router.post('/', async (req, res) => {
  try {
    // --- Validación básica de body ---
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Body vacío. Envía JSON con Content-Type: application/json' });
    }

    const { idVendedor, idMedicamento, cantidadVendida, medioPago } = req.body;
    if (!idVendedor || !idMedicamento || cantidadVendida == null || !medioPago) {
      return res.status(400).json({ error: 'Faltan datos obligatorios (idVendedor, idMedicamento, cantidadVendida, medioPago)' });
    }

    const qty = Number(cantidadVendida);
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ error: 'cantidadVendida inválida' });
    }

    // --- Usuario (3005) ---
    let usuario;
    try {
      const u = await axios.get(`${USUARIOS_BASE}/${idVendedor}`);
      usuario = u.data;
      if (!usuario) return res.status(404).json({ error: 'Vendedor no encontrado' });
    } catch (e) {
      console.error('Error validando usuario:', e?.response?.data || e.message);
      return res.status(400).json({ error: 'No se pudo validar el vendedor' });
    }
    const rol = String(usuario.role ?? usuario.tipo ?? '').toLowerCase();
    if (rol !== 'employer' && rol !== 'admin') {
      return res.status(403).json({ error: 'Solo employer/admin pueden realizar ventas' });
    }

    // --- Producto (3003) ---
    let producto;
    try {
      const p = await axios.get(`${INVENTARIO_BASE}/${idMedicamento}`);
      producto = p.data;
      if (!producto) return res.status(404).json({ error: 'Medicamento no encontrado' });
    } catch (e) {
      console.error('Error consultando inventario:', e?.response?.data || e.message);
      return res.status(400).json({ error: 'No se pudo consultar el inventario' });
    }

    const stockActual = Number(producto.cantidadStock || 0);
    if (!Number.isFinite(stockActual) || stockActual < qty) {
      return res.status(400).json({ error: 'Stock insuficiente' });
    }

    // --- Cálculos ---
    const precioUnitario = Number(producto.precioVenta ?? req.body.precioUnitario ?? NaN);
    if (!Number.isFinite(precioUnitario) || precioUnitario <= 0) {
      return res.status(400).json({ error: 'precioUnitario inválido o no disponible' });
    }
    const nombreMedicamento = String(
      req.body.nombreMedicamento ?? producto.nombreMarca ?? producto.nombreGenerico ?? 'Producto'
    );
    const totalVenta = Number((precioUnitario * qty).toFixed(2));
    if (!Number.isFinite(totalVenta) || totalVenta <= 0) {
      return res.status(400).json({ error: 'totalVenta inválido' });
    }

    // --- Insert en BD ---
    const idVenta = await ventasModel.crearVenta(
      String(idVendedor),
      String(idMedicamento),
      nombreMedicamento,
      qty,
      String(medioPago),
      precioUnitario,
      totalVenta
    );

    // --- Restar stock ---
    try {
      await axios.put(`${INVENTARIO_BASE}/${idMedicamento}/stock`, {
        cantidad: stockActual - qty
      });
    } catch (e) {
      console.error('Venta creada, pero error restando inventario:', e?.response?.data || e.message);
    }

    // --- Devolver registro creado ---
    const creada = await ventasModel.obtenerVentaPorId(idVenta);

    return res.status(201).json({
      mensaje: 'Factura creada con éxito',
      idVenta,
      venta: creada,
      vendedor: usuario?.nombre,
      producto: nombreMedicamento,
      precioUnitario,
      cantidadVendida: qty,
      totalVenta
    });

  } catch (e) {
    console.error('Error al crear factura:', e);
    res.status(500).json({ error: 'Error del servidor al crear la factura' });
  }
});

module.exports = router;