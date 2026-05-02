const Paciente = require('../models/Paciente');

// Crear paciente
const crearPaciente = async (req, res) => {
  try {
    const paciente = await Paciente.create(req.body);
    res.status(201).json(paciente);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al crear paciente', error: error.message });
  }
};

// Obtener paciente por ID
const obtenerPaciente = async (req, res) => {
  try {
    const paciente = await Paciente.findByPk(req.params.id);
    if (!paciente) {
      return res.status(404).json({ mensaje: 'Paciente no encontrado' });
    }
    res.status(200).json(paciente);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener paciente', error: error.message });
  }
};

// Obtener todos los pacientes
const obtenerPacientes = async (req, res) => {
  try {
    const pacientes = await Paciente.findAll();
    res.status(200).json(pacientes);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener pacientes', error: error.message });
  }
};

// Buscar paciente por documento
const buscarPorDocumento = async (req, res) => {
  try {
    const paciente = await Paciente.findOne({
      where: { documento: req.params.documento }
    });
    if (!paciente) {
      return res.status(404).json({ mensaje: 'Paciente no encontrado' });
    }
    res.status(200).json(paciente);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al buscar paciente', error: error.message });
  }
};

module.exports = { crearPaciente, obtenerPaciente, obtenerPacientes, buscarPorDocumento };