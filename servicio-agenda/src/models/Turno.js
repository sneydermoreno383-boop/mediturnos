const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Turno = sequelize.define('Turno', {
  id_turno: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  id_paciente: {
    type: DataTypes.UUID,
    allowNull: false
  },
  nombre_paciente: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  tipo_estudio: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Ej: radiografia, resonancia, ecografia, tomografia'
  },
  especialidad: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  hora: {
    type: DataTypes.TIME,
    allowNull: false
  },
  duracion_minutos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Duración calculada según el tipo de estudio'
  },
  tiempo_preparacion_minutos: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Tiempo adicional de preparación del paciente'
  },
  id_profesional: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_consultorio: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_equipo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Equipo médico requerido (puede ser nulo si no aplica)'
  },
  obra_social: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  requiere_insumo_especial: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Ej: contraste para resonancias'
  },
  insumo_especial: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Nombre del insumo especial requerido'
  },
  estado: {
    type: DataTypes.ENUM('Pendiente', 'Confirmado', 'Cancelado', 'Completado'),
    defaultValue: 'Pendiente'
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Campo para bloqueo optimista — se incrementa en cada modificación'
  }
}, {
  tableName: 'turnos',
  timestamps: true
});

module.exports = Turno;