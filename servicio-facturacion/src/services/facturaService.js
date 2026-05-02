require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Factura = require('../models/Factura');
const { obtenerArancel } = require('../utils/aranceles');
const { obtenerTurnosCompletados } = require('./turnosService');

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://api-gateway:80';
const RUTA_FACTURAS = path.join(__dirname, '../../facturas');
if (!fs.existsSync(RUTA_FACTURAS)) fs.mkdirSync(RUTA_FACTURAS, { recursive: true });

// Genera un PDF simple sin dependencias externas usando HTML embebido como texto plano
// Si quieres PDF real, instala pdfkit: npm install pdfkit
const generarPDF = (factura, nombrePaciente) => {
    const nombreArchivo = `FACTURA_${factura.id_factura.substring(0, 8)}.pdf`;
    const rutaArchivo = path.join(RUTA_FACTURAS, nombreArchivo);

    try {
        // Intentar usar pdfkit si está disponible
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(rutaArchivo);
        doc.pipe(stream);

        // Header
        doc.fontSize(22).fillColor('#1a73e8').text('MediTurnos', { align: 'center' });
        doc.fontSize(12).fillColor('#555').text('Sistema de Gestión de Turnos Médicos', { align: 'center' });
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#1a73e8');
        doc.moveDown();

        // Título
        doc.fontSize(16).fillColor('#333').text('FACTURA MÉDICA', { align: 'center' });
        doc.moveDown();

        // Datos
        const datos = [
            ['ID Factura', factura.id_factura],
            ['Paciente', nombrePaciente],
            ['ID Turno', factura.id_turno],
            ['Obra Social', factura.obra_social || 'Particular'],
            ['Valor', `$${factura.valor.toLocaleString('es-AR')}`],
            ['Estado', factura.estado],
            ['Fecha', new Date(factura.createdAt).toLocaleDateString('es-AR')]
        ];

        datos.forEach(([clave, valor]) => {
            doc.fontSize(12).fillColor('#1a73e8').text(`${clave}: `, { continued: true });
            doc.fillColor('#333').text(valor);
        });

        doc.moveDown(2);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#ccc');
        doc.moveDown();
        doc.fontSize(10).fillColor('#888').text('Documento generado automáticamente por MediTurnos', { align: 'center' });

        doc.end();
        return nombreArchivo;
    } catch (e) {
        // Si pdfkit no está disponible, generar un HTML que el navegador puede imprimir como PDF
        const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Factura ${factura.id_factura.substring(0,8)}</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; color: #333; }
  .header { background: #1a73e8; color: white; padding: 20px; text-align: center; border-radius: 8px; }
  .header h1 { margin: 0; font-size: 24px; }
  .header p { margin: 5px 0 0; opacity: 0.85; font-size: 13px; }
  .titulo { text-align: center; font-size: 20px; font-weight: bold; margin: 25px 0; color: #1a73e8; }
  .tabla { width: 100%; border-collapse: collapse; margin-top: 20px; }
  .tabla td { padding: 12px 15px; border-bottom: 1px solid #eee; font-size: 14px; }
  .tabla td:first-child { font-weight: bold; color: #1a73e8; width: 35%; }
  .footer { text-align: center; margin-top: 40px; color: #aaa; font-size: 12px; }
  .monto { font-size: 18px; font-weight: bold; color: #34a853; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
  <div class="header">
    <h1>🏥 MediTurnos</h1>
    <p>Sistema de Gestión de Turnos Médicos</p>
  </div>
  <div class="titulo">FACTURA MÉDICA</div>
  <table class="tabla">
    <tr><td>ID Factura</td><td>${factura.id_factura}</td></tr>
    <tr><td>Paciente</td><td><strong>${nombrePaciente}</strong></td></tr>
    <tr><td>ID Turno</td><td>${factura.id_turno}</td></tr>
    <tr><td>Obra Social</td><td>${factura.obra_social || 'Particular'}</td></tr>
    <tr><td>Valor</td><td class="monto">$${factura.valor.toLocaleString('es-AR')}</td></tr>
    <tr><td>Estado</td><td>${factura.estado}</td></tr>
    <tr><td>Fecha</td><td>${new Date(factura.createdAt).toLocaleDateString('es-AR')}</td></tr>
  </table>
  <div class="footer">Documento generado automáticamente por MediTurnos</div>
</body>
</html>`;
        // Guardar como .html con extensión .pdf para que el servidor lo sirva correctamente
        const nombreHtml = `FACTURA_${factura.id_factura.substring(0, 8)}.html`;
        fs.writeFileSync(path.join(RUTA_FACTURAS, nombreHtml), htmlContent);
        return nombreHtml;
    }
};

const automatizarFacturacionMensual = async () => {
    const turnos = await obtenerTurnosCompletados();
    const facturadas = [];

    for (const turno of turnos) {
        const existe = await Factura.findOne({ where: { id_turno: turno.id_turno } });
        if (existe) continue;

        // Obtener nombre real del paciente desde el gateway
        let nombrePaciente = `Paciente ${turno.id_paciente.substring(0, 8)}`;
        try {
            const resPaciente = await axios.get(`${GATEWAY_URL}/api/v1/pacientes/${turno.id_paciente}`);
            if (resPaciente.data && resPaciente.data.nombre) {
                nombrePaciente = `${resPaciente.data.nombre} ${resPaciente.data.apellido}`;
            }
        } catch (e) {
            // Si no puede obtener el nombre, usa el nombre del turno si existe
            if (turno.nombre_paciente) nombrePaciente = turno.nombre_paciente;
        }

        let monto = 0;
        try {
            monto = obtenerArancel(turno.tipo_estudio || turno.especialidad || 'laboratorio');
        } catch (e) {
            monto = 20000; // Valor por defecto si no reconoce el estudio
        }

        const nueva = await Factura.create({
            id_turno: turno.id_turno,
            id_paciente: turno.id_paciente,
            nombre_paciente: nombrePaciente,
            obra_social: turno.obra_social || 'Particular',
            valor: monto,
            estado: 'Enviada'
        });

        // Generar PDF/HTML
        const nombreArchivo = generarPDF(nueva, nombrePaciente);
        nueva.archivo_factura = nombreArchivo;
        await nueva.save();

        facturadas.push(nueva);
    }
    return facturadas;
};

module.exports = { automatizarFacturacionMensual };