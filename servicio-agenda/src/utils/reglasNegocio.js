const DURACIONES_POR_ESTUDIO = {
    radiografia:        15,
    ecografia:          30,
    tomografia:         45,
    resonancia:         60,
    densitometria:      20,
    mamografia:         25,
    electrocardiograma: 20,
    laboratorio:        15
};

const PREPARACION_POR_ESTUDIO = {
    radiografia:        0,
    ecografia:          10,  
    tomografia:         15,
    resonancia:         20,  
    densitometria:      5,
    mamografia:         10,
    electrocardiograma: 5,
    laboratorio:        0
};

const INSUMOS_POR_ESTUDIO = {
    resonancia:  'Contraste yodado',
    tomografia:  'Contraste yodado',
    ecografia:   'Gel conductor'
};

const COBERTURAS_POR_OBRA_SOCIAL = {
    'Sura EPS':       ['radiografia', 'ecografia', 'tomografia', 'resonancia', 'densitometria', 'mamografia', 'electrocardiograma', 'laboratorio'],
    'Sanitas EPS':    ['radiografia', 'ecografia', 'tomografia', 'resonancia', 'densitometria', 'mamografia', 'electrocardiograma', 'laboratorio'],
    'Nueva EPS':      ['radiografia', 'ecografia', 'electrocardiograma', 'laboratorio', 'densitometria'],
    'Compensar EPS':  ['radiografia', 'ecografia', 'tomografia', 'mamografia', 'laboratorio', 'electrocardiograma'],
    'Famisanar EPS':  ['radiografia', 'ecografia', 'tomografia', 'resonancia', 'mamografia', 'laboratorio'],
    'Coosalud EPS':   ['radiografia', 'ecografia', 'electrocardiograma', 'laboratorio'],
    'Medimas EPS':    ['radiografia', 'ecografia', 'tomografia', 'laboratorio', 'electrocardiograma'],
    'Particular':     ['radiografia', 'ecografia', 'tomografia', 'resonancia', 'densitometria', 'mamografia', 'electrocardiograma', 'laboratorio']
};

const getDuracion = (tipo_estudio) => {
    const tipo = tipo_estudio.toLowerCase();
    const duracion = DURACIONES_POR_ESTUDIO[tipo];
    if (!duracion) {
    throw new Error(`Tipo de estudio no reconocido: "${tipo_estudio}". Tipos válidos: ${Object.keys(DURACIONES_POR_ESTUDIO).join(', ')}`);
    }
    return duracion;
};

const getPreparacion = (tipo_estudio) => {
    const tipo = tipo_estudio.toLowerCase();
    return PREPARACION_POR_ESTUDIO[tipo] ?? 0;
};

const getInsumoEspecial = (tipo_estudio) => {
    const tipo = tipo_estudio.toLowerCase();
    return INSUMOS_POR_ESTUDIO[tipo] ?? null;
};

const verificarCobertura = (obra_social, tipo_estudio) => {
    if (!obra_social) return true;

    const cobertura = COBERTURAS_POR_OBRA_SOCIAL[obra_social];
    if (!cobertura) {
    throw new Error(`Obra social no reconocida: "${obra_social}". Obras sociales válidas: ${Object.keys(COBERTURAS_POR_OBRA_SOCIAL).join(', ')}`);
    }

    return cobertura.includes(tipo_estudio.toLowerCase());
};

module.exports = {
    getDuracion,
    getPreparacion,
    getInsumoEspecial,
    verificarCobertura,
    DURACIONES_POR_ESTUDIO,
    COBERTURAS_POR_OBRA_SOCIAL
};