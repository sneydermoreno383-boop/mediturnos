const request = require('supertest');
const express = require('express');
const turnoRoutes = require('../routes/turnoRoutes');
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

describe('TurnoRoutes - Pruebas de Integración', () => {
    let app;

    beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/turnos', turnoRoutes);
    jest.clearAllMocks();
    });

  // ========== PRUEBA INTEGRACIÓN 1: GET /disponibilidad con parámetros válidos ==========
    test('IT1: GET /api/v1/turnos/disponibilidad debe retornar 200 con datos válidos', async () => {
    const mockClinica = { id_clinica: 1, nombre: 'Hospital', ciudad: 'Bogotá', departamento: 'Cundinamarca' };

    jest.spyOn(Clinica, 'findByPk').mockResolvedValue(mockClinica);
    jest.spyOn(Profesional, 'findAll').mockResolvedValue([]);
    jest.spyOn(Consultorio, 'findAll').mockResolvedValue([]);
    jest.spyOn(Equipo, 'findAll').mockResolvedValue([]);
    jest.spyOn(Insumo, 'findOne').mockResolvedValue(null);
    jest.spyOn(Turno, 'findAll').mockResolvedValue([]);

    getDuracion.mockReturnValue(30);
    getPreparacion.mockReturnValue(0);
    getInsumoEspecial.mockReturnValue(null);

    const response = await request(app)
        .get('/api/v1/turnos/disponibilidad')
        .query({
        fecha: '2025-12-25',
        tipo_estudio: 'radiografia',
        id_clinica: 1
        });

    expect(response.status).toEqual(200);
    expect(response.body).toHaveProperty('fecha');
    expect(response.body).toHaveProperty('tipo_estudio');
    expect(response.body.fecha).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

  // ========== PRUEBA INTEGRACIÓN 2: GET /disponibilidad sin parámetros requeridos ==========
    test('IT2: GET /api/v1/turnos/disponibilidad debe retornar 400 sin parámetros', async () => {
    const response = await request(app)
        .get('/api/v1/turnos/disponibilidad');

    expect(response.status).toEqual(400);
    expect(response.body).toHaveProperty('mensaje');
    expect(response.body.mensaje).toContain('requieren');
    });

  // ========== PRUEBA INTEGRACIÓN 3: GET / para obtener todos los turnos ==========
    test('IT3: GET /api/v1/turnos debe retornar lista de turnos', async () => {
    const mockTurnos = [
        { id_turno: 1, estado: 'Confirmado' },
        { id_turno: 2, estado: 'Pendiente' }
    ];

    jest.spyOn(Turno, 'findAll').mockResolvedValue(mockTurnos);

    const response = await request(app)
        .get('/api/v1/turnos');

    expect(response.status).toEqual(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(0);
    });

  // ========== PRUEBA INTEGRACIÓN 4: GET /:id para obtener turno específico ==========
    test('IT4: GET /api/v1/turnos/:id debe retornar turno específico', async () => {
    const mockTurno = { 
        id_turno: 1, 
        especialidad: 'Radiología', 
        estado: 'Confirmado',
        fecha: '2025-12-25',
        hora: '14:00:00'
    };

    jest.spyOn(Turno, 'findByPk').mockResolvedValue(mockTurno);

    const response = await request(app)
        .get('/api/v1/turnos/1');

    expect(response.status).toEqual(200);
    expect(response.body).toHaveProperty('especialidad');
    expect(response.body.estado).toEqual('Confirmado');
    expect(Turno.findByPk).toHaveBeenCalledWith('1');
    });

  // ========== PRUEBA INTEGRACIÓN 5: GET /paciente/:id para obtener turnos del paciente ==========
    test('IT5: GET /api/v1/turnos/paciente/:id debe retornar turnos del paciente', async () => {
    const mockTurnos = [
        { id_turno: 1, id_paciente: 1, estado: 'Confirmado' },
        { id_turno: 2, id_paciente: 1, estado: 'Pendiente' }
    ];

    jest.spyOn(Turno, 'findAll').mockResolvedValue(mockTurnos);

    const response = await request(app)
        .get('/api/v1/turnos/paciente/1');

    expect(response.status).toEqual(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(0);
    });

  // ========== PRUEBA INTEGRACIÓN 6: DELETE /:id para cancelar turno ==========
    test('IT6: DELETE /api/v1/turnos/:id debe cancelar turno correctamente', async () => {
    const mockTurno = {
        id_turno: 1,
        estado: 'Confirmado',
        version: 0,
        update: jest.fn().mockResolvedValue({ estado: 'Cancelado', version: 1 })
    };

    jest.spyOn(Turno, 'findByPk').mockResolvedValue(mockTurno);

    const response = await request(app)
        .delete('/api/v1/turnos/1')
        .send({ version: 0 });

    expect(response.status).toEqual(200);
    expect(response.body).toHaveProperty('mensaje');
    expect(response.body.mensaje).toMatch(/cancelado/i);
    });
});