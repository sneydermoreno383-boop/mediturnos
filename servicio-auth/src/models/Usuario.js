const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  id_usuario: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  apellido: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  rol: {
    type: DataTypes.ENUM('paciente', 'medico', 'admin'),
    allowNull: false,
    defaultValue: 'paciente'
  },
  // Para médicos: referencia al id_profesional de la tabla profesionales
  id_profesional: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  // Para pacientes: referencia al id_paciente del servicio de pacientes
  id_paciente: {
    type: DataTypes.UUID,
    allowNull: true
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'usuarios',
  timestamps: true
});

module.exports = Usuario;