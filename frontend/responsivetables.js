/**
 * MediTurnos — responsive-tables.js
 * Envuelve automáticamente todas las tablas dentro de .card
 * en un div con overflow-x:auto para scroll horizontal en móvil.
 * Incluir con: <script src="responsive-tables.js"></script>
 * al final del <body> en todas las páginas internas.
 */
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.card table').forEach(table => {
        // No envolver si ya tiene un padre con overflow-x
        if (table.parentElement.classList.contains('table-scroll')) return;
        const wrapper = document.createElement('div');
        wrapper.style.overflowX = 'auto';
        wrapper.style.webkitOverflowScrolling = 'touch';
        wrapper.style.marginTop = '4px';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
    });
});