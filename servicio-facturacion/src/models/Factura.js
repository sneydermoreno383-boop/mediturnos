const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Factura = sequelize.define('Factura', {
    id_factura: {
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
        allowNull: true
    },
    obra_social: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    valor: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    estado: {
        type: DataTypes.ENUM('Pendiente', 'Enviada', 'Rechazada', 'Aceptada'),
        defaultValue: 'Pendiente'
    },
    archivo_factura: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    id_factura_original: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Referencia a la factura original en caso de re-facturación'
    }
}, {
    tableName: 'facturas',
    timestamps: true
});

module.exports = Factura;