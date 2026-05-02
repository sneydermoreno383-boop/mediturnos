const verificarRol = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({ mensaje: 'No autenticado' });
        }
        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({ mensaje: 'No tienes permiso para realizar esta acción' });
        }
        next();
    };
};

module.exports = { verificarRol };