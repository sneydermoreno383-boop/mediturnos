require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const Usuario = require('../models/Usuario');

const GATEWAY_URL = process.env.GATEWAY_URL;

const registrar = async (req, res) => {
  try {
    const { nombre, apellido, email, password, rol } = req.body;

    if (!nombre || !apellido || !email || !password || !rol) {
      return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
    }
    if (password.length < 6) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const existe = await Usuario.findOne({ where: { email } });
    if (existe) {
      return res.status(400).json({ mensaje: 'El email ya está registrado' });
    }

    // Bloquear registro de médicos desde el formulario público
    if (rol === 'medico' || rol === 'admin') {
      return res.status(403).json({ mensaje: 'No puedes registrarte con ese rol' });
    }

    let id_paciente = null;

    if (rol === 'paciente') {
      try {
        const resPaciente = await axios.post(`${GATEWAY_URL}/api/v1/pacientes`, {
          nombre, apellido, email,
          documento:        req.body.documento,
          fecha_nacimiento: req.body.fecha_nacimiento,
          telefono:         req.body.telefono || null
        });
        id_paciente = resPaciente.data.id_paciente;
      } catch (error) {
        if (error.response?.status === 400) {
          return res.status(400).json({ mensaje: error.response.data.mensaje || 'Error al crear el paciente' });
        }
        return res.status(503).json({ mensaje: 'No se pudo crear el perfil de paciente' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const usuario = await Usuario.create({
      nombre, apellido, email,
      password: passwordHash,
      rol,
      id_profesional: null,
      id_paciente,
      activo: true
    });

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario: {
        id_usuario:  usuario.id_usuario,
        nombre:      usuario.nombre,
        apellido:    usuario.apellido,
        email:       usuario.email,
        rol:         usuario.rol
      }
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al registrar usuario', error: error.message });
  }
};

const registrarMedico = async (req, res) => {
  try {
    const { nombre, apellido, email, password, especialidad, id_clinica, obras_sociales_aceptadas } = req.body;

    if (!nombre || !apellido || !email || !password || !especialidad || !id_clinica) {
      return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
    }
    if (password.length < 6) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const existe = await Usuario.findOne({ where: { email } });
    if (existe) {
      return res.status(400).json({ mensaje: 'El email ya está registrado' });
    }

    // Paso 1 — Crear el profesional en agenda
    let id_prof;
    try {
      const resProfesional = await axios.post(`${GATEWAY_URL}/api/v1/profesionales`, {
        nombre,
        apellido,
        especialidad,
        id_clinica,
        obras_sociales_aceptadas: obras_sociales_aceptadas || []
      });
      id_prof = resProfesional.data.id_profesional;
    } catch (error) {
      return res.status(503).json({ mensaje: 'No se pudo crear el profesional en el sistema de agenda' });
    }

    // Paso 2 — Crear la cuenta de usuario
    const passwordHash = await bcrypt.hash(password, 12);

    const usuario = await Usuario.create({
      nombre,
      apellido,
      email,
      password: passwordHash,
      rol: 'medico',
      id_profesional: id_prof,
      activo: true
    });

    res.status(201).json({
      mensaje: 'Médico registrado exitosamente',
      usuario: {
        id_usuario:     usuario.id_usuario,
        nombre:         usuario.nombre,
        apellido:       usuario.apellido,
        email:          usuario.email,
        rol:            usuario.rol,
        id_profesional: usuario.id_profesional
      }
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al registrar médico', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ mensaje: 'Email y contraseña son obligatorios' });
    }

    const usuario = await Usuario.findOne({ where: { email, activo: true } });
    if (!usuario) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      {
        id_usuario:     usuario.id_usuario,
        nombre:         usuario.nombre,
        apellido:       usuario.apellido,
        email:          usuario.email,
        rol:            usuario.rol,
        id_profesional: usuario.id_profesional,
        id_paciente:    usuario.id_paciente
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id_usuario:     usuario.id_usuario,
        nombre:         usuario.nombre,
        apellido:       usuario.apellido,
        email:          usuario.email,
        rol:            usuario.rol,
        id_profesional: usuario.id_profesional,
        id_paciente:    usuario.id_paciente
      }
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al iniciar sesión', error: error.message });
  }
};

const verificar = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id_usuario, {
      attributes: ['id_usuario', 'nombre', 'apellido', 'email', 'rol', 'id_profesional', 'id_paciente']
    });
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    res.status(200).json({ usuario });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al verificar token', error: error.message });
  }
};

const crearAdmin = async (req, res) => {
  try {
    const adminExiste = await Usuario.findOne({ where: { rol: 'admin' } });
    if (adminExiste) {
      return res.status(400).json({ mensaje: 'Ya existe un administrador' });
    }
    const passwordHash = await bcrypt.hash('admin1234', 12);
    await Usuario.create({
      nombre: 'Administrador', apellido: 'Sistema',
      email: 'admin@mediturnos.com',
      password: passwordHash, rol: 'admin'
    });
    res.status(201).json({
      mensaje: 'Administrador creado exitosamente',
      credenciales: { email: 'admin@mediturnos.com', password: 'admin1234' }
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear admin', error: error.message });
  }
};

const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar usuarios', error: error.message });
  }
};

const toggleUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    if (usuario.rol === 'admin') return res.status(403).json({ mensaje: 'No se puede desactivar al administrador' });

    await usuario.update({ activo: !usuario.activo });
    res.status(200).json({
      mensaje: `Usuario ${usuario.activo ? 'activado' : 'desactivado'} exitosamente`,
      activo: usuario.activo
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar usuario', error: error.message });
  }
};

module.exports = { registrar, registrarMedico, login, verificar, crearAdmin, listarUsuarios, toggleUsuario };