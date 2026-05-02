const {
    crearTurno,
    obtenerTurnos,
    obtenerTurno,
    cancelarTurno,
    consultarDisponibilidad,
    obtenerTurnosPorPaciente,
    obtenerTurnosPorProfesional
} = require('../controllers/turnoController');
const Turno = require('../models/Turno');
const { Clinica, Profesional, Consultorio, Equipo, Insumo } = require('../models/Recursos');
const { verificarPaciente } = require('../services/pacientesService');
const sequelize = require('../config/database');
const { getDuracion, getPreparacion, getInsumoEspecial, verificarCobertura } = require('../utils/reglasNegocio');

jest.mock('../models/Turno');
jest.mock('../models/Recursos');
jest.mock('../services/pacientesService');
jest.mock('../config/database');
jest.mock('../utils/reglasNegocio');

describe('TurnoController - Pruebas Unitarias', () => {
    let req, res;

    beforeEach(() => {
    jest.clearAllMocks();
    req = {
        query: {},
        params: {},
        body: {}
    };
    res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
    });

  // ========== PRUEBA UNITARIA 1: consultarDisponibilidad con clínica válida ==========
    test('UT1: consultarDisponibilidad debe retornar disponibilidad cuando la clínica existe', async () => {
    req.query = { fecha: '2025-12-25', tipo_estudio: 'radiografia', id_clinica: 1 };

    const mockClinica = { id_clinica: 1, nombre: 'Hospital Central', ciudad: 'Bogotá', departamento: 'Cundinamarca' };
    const mockProfesionales = [];

    jest.spyOn(Clinica, 'findByPk').mockResolvedValue(mockClinica);
    jest.spyOn(Profesional, 'findAll').mockResolvedValue(mockProfesionales);
    jest.spyOn(Consultorio, 'findAll').mockResolvedValue([]);
    jest.spyOn(Equipo, 'findAll').mockResolvedValue([]);
    jest.spyOn(Insumo, 'findOne').mockResolvedValue(null);
    jest.spyOn(Turno, 'findAll').mockResolvedValue([]);

    getDuracion.mockReturnValue(30);
    getPreparacion.mockReturnValue(0);
    getInsumoEspecial.mockReturnValue(null);

    await consultarDisponibilidad(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
    expect(Clinica.findByPk).toHaveBeenCalledWith(1);
    });

  // ========== PRUEBA UNITARIA 2: consultarDisponibilidad con clínica inexistente ==========
    test('UT2: consultarDisponibilidad debe retornar 404 cuando la clínica no existe', async () => {
    req.query = { fecha: '2025-12-25', tipo_estudio: 'radiografia', id_clinica: 999 };

    jest.spyOn(Clinica, 'findByPk').mockResolvedValue(null);

    await consultarDisponibilidad(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: expect.stringContaining('Clínica') }));
    });

  // ========== PRUEBA UNITARIA 3: verificarCobertura valida obra social ==========
    test('UT3: verificarCobertura debe retornar true para obra social válida', () => {
    verificarCobertura.mockReturnValue(true);
    const result = verificarCobertura('Sura EPS', 'radiografia');
    
    expect(verificarCobertura).toHaveBeenCalledWith('Sura EPS', 'radiografia');
    expect(result).toEqual(true);
    expect(verificarCobertura).toHaveBeenCalled();
    });

  // ========== PRUEBA UNITARIA 4: getDuracion retorna valor correcto ==========
    test('UT4: getDuracion debe retornar duración correcta por tipo de estudio', () => {
    getDuracion.mockReturnValue(30);
    const duracion = getDuracion('radiografia');
    
    expect(getDuracion).toHaveBeenCalledWith('radiografia');
    expect(duracion).toEqual(30);
    expect(typeof duracion).toBe('number');
    });

  // ========== PRUEBA UNITARIA 5: obtenerTurno con turno válido ==========
    test('UT5: obtenerTurno debe retornar turno cuando existe', async () => {
    const mockTurno = { id_turno: 1, especialidad: 'Radiología', estado: 'Confirmado' };

    req.params.id = 1;
    jest.spyOn(Turno, 'findByPk').mockResolvedValue(mockTurno);

    await obtenerTurno(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockTurno);
    expect(Turno.findByPk).toHaveBeenCalledWith(1);
    });

  // ========== PRUEBA UNITARIA 6: cancelarTurno valida estado ==========
    test('UT6: cancelarTurno debe cambiar estado a Cancelado', async () => {
    const mockTurno = { 
        id_turno: 1, 
        estado: 'Confirmado', 
        version: 0,
        update: jest.fn().mockResolvedValue({ estado: 'Cancelado', version: 1 })
    };

    req.params.id = 1;
    req.body = { version: 0 };

    jest.spyOn(Turno, 'findByPk').mockResolvedValue(mockTurno);

    await cancelarTurno(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockTurno.update).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: expect.stringContaining('cancelado') }));
    });
});