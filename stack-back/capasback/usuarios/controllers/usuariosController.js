const { Router } = require('express');
const router = Router();
const usuariosModel = require('../models/usuariosModel');

// Obtener todos los usuarios (opcional filtro ?tipo=)
router.get('/', async (req, res) => {
  try {
    const tipo = (req.query.tipo || '').trim();
    const usuarios = tipo
      ? await usuariosModel.obtenerUsuariosPorTipo(tipo)
      : await usuariosModel.obtenerUsuarios();
    res.status(200).json(usuarios);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error del servidor al obtener los usuarios" });
  }
});

// Obtener un usuario por idUsuario
router.get('/:idUsuario', async (req, res) => {
  try {
    const { idUsuario } = req.params;
    const usuario = await usuariosModel.obtenerUsuarioPorId(idUsuario);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.status(200).json(usuario);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ error: "Error del servidor al obtener el usuario" });
  }
});

// Crear un nuevo usuario (acepta role o tipo)
router.post('/', async (req, res) => {
  try {
    const { idUsuario, nombre, correo, telefono, tipo, role, password_hash } = req.body || {};
    const tipoFinal = (tipo ?? role ?? '').trim();
    if (!tipoFinal) {
      return res.status(400).json({ error: "El campo role/tipo es obligatorio" });
    }

    const existe = await usuariosModel.obtenerUsuarioPorId(idUsuario);
    if (existe) {
      return res.status(400).json({ error: "El usuario ya existe" });
    }
    await usuariosModel.crearUsuario(
      idUsuario,
      (nombre || '').trim(),
      (correo || '').trim(),
      (telefono || '').trim(),
      tipoFinal,
      (password_hash || '').trim()
    );
    res.status(201).json({ mensaje: "Usuario creado con éxito" });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({ error: "Error del servidor al crear el usuario" });
  }
});

// Actualizar un usuario (acepta role o tipo; password opcional)
router.put('/:idUsuario', async (req, res) => {
  try {
    const { idUsuario } = req.params;
    const { nombre, correo, telefono, tipo, role, password_hash } = req.body || {};

    const usuario = await usuariosModel.obtenerUsuarioPorId(idUsuario);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Si role/tipo no viene, no lo forzamos a null: se conservará con COALESCE
    const tipoFinal = (tipo ?? role ?? null);
    await usuariosModel.actualizarUsuario(
      idUsuario,
      (nombre ?? usuario.nombre).trim(),
      (correo ?? usuario.correo).trim(),
      (telefono ?? usuario.telefono).trim(),
      tipoFinal,                              // puede ser null -> COALESCE mantiene
      (password_hash ?? null)                 // null o '' -> no cambia por CASE
    );

    res.status(200).json({ mensaje: "Usuario actualizado con éxito" });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ error: "Error del servidor al actualizar el usuario" });
  }
});

// Eliminar un usuario
router.delete('/:idUsuario', async (req, res) => {
  try {
    const { idUsuario } = req.params;
    const usuario = await usuariosModel.obtenerUsuarioPorId(idUsuario);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    await usuariosModel.eliminarProducto?.(idUsuario); // por si lo tienes así en otro módulo
    await usuariosModel.eliminarUsuario?.(idUsuario);  // y este es el correcto
    res.status(200).json({ mensaje: "Usuario eliminado con éxito" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ error: "Error del servidor al eliminar el usuario" });
  }
});

// Login (simple)
router.post('/login', async (req, res) => {
  try {
    const { idUsuario, password } = req.body || {};
    const usuario = await usuariosModel.obtenerUsuarioPorId(idUsuario);
    if (!usuario || (password || '') !== (usuario.password_hash || '')) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }
    res.status(200).json({
      mensaje: "Login exitoso",
      usuario: { idUsuario: usuario.idUsuario, nombre: usuario.nombre, tipo: usuario.tipo }
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error del servidor en login" });
  }
});

module.exports = router;