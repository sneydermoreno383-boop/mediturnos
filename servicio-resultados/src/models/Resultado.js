const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Resultado = sequelize.define('Resultado', {
  id_resultado: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  id_turno: {
    type: DataTypes.UUID,
    allowNull: false
  },
  id_paciente: {
    type: DataTypes.UUID,
    allowNull: false
  },
  nombre_paciente: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  especialidad: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  fecha_resultado: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM('Pendiente', 'Disponible'),
    defaultValue: 'Pendiente'
  }
}, {
  tableName: 'resultados',
  timestamps: true
});

module.exports = Resultado;