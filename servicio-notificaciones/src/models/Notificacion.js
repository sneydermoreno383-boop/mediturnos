const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notificacion = sequelize.define('Notificacion', {
  id_notificacion: {
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
  tipo: {
    type: DataTypes.ENUM(
      'Turno_confirmado',
      'Turno_cancelado',
      'Resultado_disponible',
      'Recordatorio_48h',
      'Recordatorio_24h'
    ),
    allowNull: false
  },
  mensaje: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  canal: {
    type: DataTypes.ENUM('email', 'whatsapp', 'sistema'),
    defaultValue: 'sistema'
  },
  estado: {
    type: DataTypes.ENUM('Pendiente', 'Enviado', 'Fallido'),
    defaultValue: 'Pendiente'
  },
  fecha_envio: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'notificaciones',
  timestamps: true
});

module.exports = Notificacion;