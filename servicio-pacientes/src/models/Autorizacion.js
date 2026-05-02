const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Autorizacion = sequelize.define('Autorizacion', {
    id_autorizacion: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    id_paciente: {
        type: DataTypes.UUID,
        allowNull: false
    },
    id_cobertura: {
        type: DataTypes.UUID,
        allowNull: false
    },
    tipo_estudio: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    codigo_autorizacion: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    estado: {
        type: DataTypes.ENUM('Pendiente', 'Aprobada', 'Rechazada', 'Vencida'),
        defaultValue: 'Pendiente'
    },
    fecha_solicitud: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    fecha_vencimiento: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    monto_autorizado: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    observaciones: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'autorizaciones',
    timestamps: true
});

module.exports = Autorizacion;