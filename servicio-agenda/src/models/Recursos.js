const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Clinica = sequelize.define('Clinica', {
    id_clinica: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nombre: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    departamento: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    ciudad: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    direccion: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    disponible: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'clinicas',
    timestamps: true
});

const Profesional = sequelize.define('Profesional', {
    id_profesional: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    id_clinica: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    apellido: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    especialidad: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    obras_sociales_aceptadas: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    disponible: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'profesionales',
    timestamps: true
});

const Consultorio = sequelize.define('Consultorio', {
    id_consultorio: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    id_clinica: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    tipo: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    disponible: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'consultorios',
    timestamps: true
});

const Equipo = sequelize.define('Equipo', {
    id_equipo: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    id_clinica: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    tipo: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    disponible: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'equipos',
    timestamps: true
});

const Insumo = sequelize.define('Insumo', {
    id_insumo: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    stock: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'insumos',
    timestamps: true
});

Clinica.hasMany(Profesional, { foreignKey: 'id_clinica' });
Profesional.belongsTo(Clinica, { foreignKey: 'id_clinica' });

Clinica.hasMany(Consultorio, { foreignKey: 'id_clinica' });
Consultorio.belongsTo(Clinica, { foreignKey: 'id_clinica' });

Clinica.hasMany(Equipo, { foreignKey: 'id_clinica' });
Equipo.belongsTo(Clinica, { foreignKey: 'id_clinica' });

module.exports = { Clinica, Profesional, Consultorio, Equipo, Insumo };