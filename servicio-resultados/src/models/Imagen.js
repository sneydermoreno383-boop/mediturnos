const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Imagen = sequelize.define('Imagen', {
  id_imagen: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  id_resultado: {
    type: DataTypes.UUID,
    allowNull: false
  },
  nombre_archivo: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  tipo_archivo: {
    type: DataTypes.ENUM('PDF', 'IMAGEN', 'VIDEO', 'DICOM'),
    allowNull: false
  },
  ruta_archivo: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  tamanio_bytes: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'imagenes',
  timestamps: true
});

module.exports = Imagen;