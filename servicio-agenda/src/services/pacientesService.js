require('dotenv').config();
const axios = require('axios');

const GATEWAY_URL = process.env.PACIENTES_SERVICE_URL;

const verificarPaciente = async (id_paciente) => {
    const respuesta = await axios.get(`${GATEWAY_URL}/api/v1/pacientes/${id_paciente}`);
    return respuesta.data;
};

module.exports = { verificarPaciente };