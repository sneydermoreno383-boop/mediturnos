jest.mock('./config/database', () => ({
    authenticate: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true),
    transaction: jest.fn().mockResolvedValue({
    commit: jest.fn(),
    rollback: jest.fn(),
    LOCK: { UPDATE: 'UPDATE' }
    }),
    constructor: {
    Transaction: {
        ISOLATION_LEVELS: {
        SERIALIZABLE: 'SERIALIZABLE'
        }
    }
    }
}));

jest.mock('./models/Turno', () => ({
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
}));

jest.mock('./models/Recursos', () => ({
    Clinica: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    hasMany: jest.fn()
    },
    Profesional: {
    findAll: jest.fn(),
    belongsTo: jest.fn()
    },
    Consultorio: {
    findAll: jest.fn(),
    hasMany: jest.fn()
    },
    Equipo: {
    findAll: jest.fn(),
    hasMany: jest.fn()
    },
    Insumo: {
    findOne: jest.fn(),
    update: jest.fn()
    }
}));

jest.mock('./services/pacientesService');
jest.mock('./utils/reglasNegocio');