// auth.js - Sistema de autenticación compartido para MediTurnos
// Incluir en cada página HTML con: <script src="auth.js"></script>

const Auth = {
    GATEWAY = 'http://172.25.66.107',

    getToken() {
        return localStorage.getItem('mt_token');
    },

    getUsuario() {
        try {
            return JSON.parse(localStorage.getItem('mt_usuario'));
        } catch {
            return null;
        }
    },

    cerrarSesion() {
        localStorage.removeItem('mt_token');
        localStorage.removeItem('mt_usuario');
        window.location.href = 'login.html';
    },

    // Verifica si hay sesión activa y si el rol tiene permiso
    // roles: array de roles permitidos, ej: ['admin', 'medico']
    verificar(rolesPermitidos) {
        const token = this.getToken();
        const usuario = this.getUsuario();

        if (!token || !usuario) {
            window.location.href = 'login.html';
            return null;
        }

        if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
            window.location.href = 'sin-permiso.html';
            return null;
        }

        return usuario;
    },

    // Inyecta el header con info del usuario y botón de logout
    inyectarHeader(nombrePagina) {
        const usuario = this.getUsuario();
        if (!usuario) return;

        const rolTexto = {
            admin: 'Administrador',
            medico: 'Médico',
            paciente: 'Paciente'
        };

        const headerEl = document.querySelector('header');
        if (!headerEl) return;

        const barra = document.createElement('div');
        barra.style.cssText = `
            background: rgba(0,0,0,0.2);
            padding: 8px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
        `;
        barra.innerHTML = `
            <span>
                ${rolTexto[usuario.rol] || usuario.rol} — 
                <strong>${usuario.nombre} ${usuario.apellido}</strong>
            </span>
            <button onclick="Auth.cerrarSesion()" style="
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.4);
                color: white;
                padding: 5px 14px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 12px;
                width: auto;
                margin-top: 0;
            ">Cerrar sesión</button>
        `;
        headerEl.appendChild(barra);
    },

    // Oculta elementos del DOM según el rol
    aplicarPermisos(usuario) {
        // Ocultar elementos con data-rol que no coincidan
        document.querySelectorAll('[data-rol]').forEach(el => {
            const rolesPermitidos = el.getAttribute('data-rol').split(',').map(r => r.trim());
            if (!rolesPermitidos.includes(usuario.rol)) {
                el.style.display = 'none';
            }
        });
    },

    // Headers con token para peticiones autenticadas
    headers() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getToken()}`
        };
    }
};
