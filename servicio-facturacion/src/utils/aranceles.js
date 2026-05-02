const ARANCELES_POR_ESTUDIO = {
    radiografia: 30000,
    ecografia: 40000,
    tomografia: 60000,
    resonancia: 80000,
    densitometria: 25000,
    mamografia: 35000,
    electrocardiograma: 20000,
    laboratorio: 15000
};

const obtenerArancel = (tipoEstudio) => {
    const valor = ARANCELES_POR_ESTUDIO[tipoEstudio.toLowerCase()];
    if (!valor) throw new Error(`Tipo de estudio no válido: ${tipoEstudio}`);
    return valor;
};

module.exports = { obtenerArancel };