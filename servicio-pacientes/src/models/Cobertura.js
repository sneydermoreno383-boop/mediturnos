const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cobertura = sequelize.define('Cobertura', {
    id_cobertura: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    id_paciente: {
        type: DataTypes.UUID,
        allowNull: false
    },
    eps: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    numero_afiliado: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    tipo_afiliacion: {
        type: DataTypes.ENUM('Contributivo', 'Subsidiado', 'Especial'),
        allowNull: false
    },
    fecha_inicio: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    fecha_fin: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Null significa vigencia indefinida'
    },
    activa: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    saldo_disponible: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: 'Saldo disponible para servicios cubiertos'
    },
    copago_porcentaje: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
        comment: 'Porcentaje de copago del paciente'
    }
}, {
    tableName: 'coberturas',
    timestamps: true
});

module.exports = Cobertura;