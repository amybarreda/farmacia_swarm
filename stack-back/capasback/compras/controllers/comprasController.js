const { Router } = require('express');
const axios = require('axios');
const comprasModel = require('../models/comprasModel');

const router = Router();

const USUARIOS_BASE   = process.env.USUARIOS_BASE   || 'http://localhost:3005/api/usuarios';
const INVENTARIO_BASE = process.env.INVENTARIO_BASE || 'http://localhost:3003/api/inventario';

function toArrayDet(det) {
  if (Array.isArray(det)) return det;
  if (typeof det === 'string') {
    try { return JSON.parse(det); } catch { return null; }
  }
  return null;
}

// ================== LISTAR ==================
router.get('/', async (_req, res) => {
  try {
    const ordenes = await comprasModel.obtenerOrdenes();
    res.status(200).json(ordenes);
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    res.status(500).json({ error: 'Error del servidor al obtener órdenes' });
  }
});

// ================== OBTENER POR ID ==================
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const orden = await comprasModel.obtenerOrdenPorId(id);
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
    res.status(200).json(orden);
  } catch (error) {
    console.error('Error al obtener orden:', error);
    res.status(500).json({ error: 'Error del servidor al obtener orden' });
  }
});

// ================== CREAR ==================
router.post('/', async (req, res) => {
  try {
    const { idUsuario, nombreProveedor, fechaOrden, estado, detalles, cantidadCompra, montoTotal } = req.body;

    // 1) Validar idUsuario
    if (!idUsuario) return res.status(400).json({ error: 'idUsuario es obligatorio' });
    try {
      const u = await axios.get(`${USUARIOS_BASE}/${idUsuario}`);
      if (!u.data) return res.status(400).json({ error: 'Usuario no existe' });
    } catch (e) {
      console.error('Error validando usuario:', e?.response?.data || e.message);
      return res.status(400).json({ error: 'No se pudo validar el usuario' });
    }

    // 2) Validar detalles como arreglo JSON
    const det = toArrayDet(detalles);
    if (!det || !Array.isArray(det) || det.length === 0) {
      return res.status(400).json({ error: 'detalles debe ser un arreglo JSON no vacío' });
    }
    // Validar que existan los productos referenciados
    for (const item of det) {
      if (!item || item.idMedicamento == null) {
        return res.status(400).json({ error: 'Cada ítem en detalles debe incluir idMedicamento' });
      }
      try {
        const prodResp = await axios.get(`${INVENTARIO_BASE}/${item.idMedicamento}`);
        if (!prodResp.data) return res.status(400).json({ error: `Producto ${item.idMedicamento} no existe en inventario` });
      } catch {
        return res.status(400).json({ error: `No se pudo validar el producto ${item.idMedicamento}` });
      }
    }

    // 3) Insert
    const result = await comprasModel.crearOrden(
      nombreProveedor,
      fechaOrden,
      estado || 'pendiente',
      det,                 // el model lo serializa
      cantidadCompra,
      montoTotal
    );

    res.status(201).json({ mensaje: 'Orden creada con éxito', idOrden: result.insertId });
  } catch (error) {
    console.error('Error al crear orden:', error);
    res.status(500).json({ error: 'Error del servidor al crear orden' });
  }
});

// ================== ACTUALIZAR ==================
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    // 0) Orden anterior
    const anterior = await comprasModel.obtenerOrdenPorId(id);
    if (!anterior) return res.status(404).json({ error: 'Orden no encontrada para actualizar' });

    // 1) Merge de datos (si no mandan algo, usamos lo anterior)
    const idUsuario       = req.body.idUsuario ?? anterior.idUsuario;
    const nombreProveedor = (req.body.nombreProveedor ?? anterior.nombreProveedor)?.toString();
    const fechaOrden      = req.body.fechaOrden ?? anterior.fechaOrden;
    const estado          = req.body.estado ?? anterior.estado;
    const cantidadCompra  = req.body.cantidadCompra ?? anterior.cantidadCompra;
    const montoTotal      = req.body.montoTotal ?? anterior.montoTotal;

    // detalles puede venir como array, string, objeto o no venir
    let det = req.body.detalles;
    if (det === undefined) {
      det = anterior.detalles; // lo que ya estaba
    }

    // 2) Validar usuario (siempre)
    if (!idUsuario) return res.status(400).json({ error: 'idUsuario es obligatorio' });
    try {
      const u = await axios.get(`${USUARIOS_BASE}/${idUsuario}`);
      if (!u.data) return res.status(400).json({ error: 'Usuario no existe' });
    } catch (e) {
      console.error('Error validando usuario:', e?.response?.data || e.message);
      return res.status(400).json({ error: 'No se pudo validar el usuario' });
    }

    // 3) Validar productos SOLO si cambia a "recibido"
    const antes = String(anterior.estado).toLowerCase();
    const ahora = String(estado).toLowerCase();
    const vaARecibido = (antes !== 'recibido' && ahora === 'recibido');

    if (vaARecibido) {
      // Para recibido SÍ exigimos arreglo JSON con idMedicamento/cantidad
      const detArr = toArrayDet(det ?? anterior.detalles);
      if (!Array.isArray(detArr)) {
        return res.status(400).json({ error: 'Para marcar como "recibido", detalles debe ser un arreglo JSON' });
      }
      for (const item of detArr) {
        if (!item || item.idMedicamento == null) {
          return res.status(400).json({ error: 'Cada ítem debe incluir idMedicamento y cantidad' });
        }
        try {
          const prodResp = await axios.get(`${INVENTARIO_BASE}/${item.idMedicamento}`);
          if (!prodResp.data) return res.status(400).json({ error: `Producto ${item.idMedicamento} no existe en inventario` });
        } catch {
          return res.status(400).json({ error: `No se pudo validar el producto ${item.idMedicamento}` });
        }
      }
      det = detArr; // nos aseguramos que sea arreglo para persistir
    }
    // En estados distintos de "recibido" NO obligamos a que sea arreglo;
    // puede quedarse como venía (texto/JSON), el model lo guardará correctamente.

    // 4) Update en DB
    const upd = await comprasModel.actualizarOrden(
      id,
      nombreProveedor,
      fechaOrden,
      estado,
      det,
      cantidadCompra,
      montoTotal
    );
    if (upd.affectedRows === 0) {
      return res.status(404).json({ error: 'Orden no encontrada para actualizar' });
    }

    // 5) Si cambió a “recibido”, sumar stock
    if (vaARecibido) {
      try {
        for (const item of det) {
          const r = await axios.get(`${INVENTARIO_BASE}/${item.idMedicamento}`);
          const prod = r.data;
          if (!prod) continue;
          const nuevaCantidad = Number(prod.cantidadStock || 0) + Number(item.cantidad || 0);
          await axios.put(`${INVENTARIO_BASE}/${item.idMedicamento}/stock`, { cantidad: nuevaCantidad });
        }
      } catch (e) {
        console.error('Orden actualizada, pero error al sumar stock:', e?.response?.data || e.message);
      }
    }

    const ordenActualizada = await comprasModel.obtenerOrdenPorId(id);
    res.status(200).json({ mensaje: 'Orden actualizada con éxito', orden: ordenActualizada });

  } catch (error) {
    console.error('Error al actualizar orden:', error);
    res.status(500).json({ error: 'Error del servidor al actualizar orden' });
  }
});

// ================== ELIMINAR ==================
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const r = await comprasModel.eliminarOrden(id);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Orden no encontrada para eliminar' });
    res.status(200).json({ mensaje: 'Orden eliminada con éxito' });
  } catch (error) {
    console.error('Error al eliminar orden:', error);
    res.status(500).json({ error: 'Error del servidor al eliminar orden' });
  }
});

module.exports = router;