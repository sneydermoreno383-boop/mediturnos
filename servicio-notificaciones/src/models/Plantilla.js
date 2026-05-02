const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Plantilla = sequelize.define('Plantilla', {
  id_plantilla: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tipo: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  asunto: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  contenido: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  centro: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'general'
  }
}, {
  tableName: 'plantillas',
  timestamps: true
});

module.exports = Plantilla;