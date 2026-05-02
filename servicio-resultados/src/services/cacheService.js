const redis = require('redis');

let clienteRedis = null;

const obtenerCliente = async () => {
  if (clienteRedis && clienteRedis.isOpen) return clienteRedis;
  try {
    clienteRedis = redis.createClient({ url: process.env.REDIS_URL });
    await clienteRedis.connect();
    console.log('Redis conectado');
    return clienteRedis;
  } catch (error) {
    console.log('Redis no disponible, continuando sin caché:', error.message);
    return null;
  }
};

const obtenerCache = async (clave) => {
  try {
    const cliente = await obtenerCliente();
    if (!cliente) return null;
    const valor = await cliente.get(clave);
    return valor ? JSON.parse(valor) : null;
  } catch {
    return null;
  }
};

const guardarCache = async (clave, valor, segundos = 300) => {
  try {
    const cliente = await obtenerCliente();
    if (!cliente) return;
    await cliente.setEx(clave, segundos, JSON.stringify(valor));
  } catch {
    // Si Redis falla, continúa sin caché
  }
};

const eliminarCache = async (clave) => {
  try {
    const cliente = await obtenerCliente();
    if (!cliente) return;
    await cliente.del(clave);
  } catch { }
};

module.exports = { obtenerCache, guardarCache, eliminarCache };