const express = require('express');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

const app = express();
app.use(express.json());

// Puerto dinámico para Railway
const PORT = process.env.PORT || 4000;

// ============ CONFIGURACIÓN NODEMAILER ============
let transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.SMTP_USER || 'segundollengle157@gmail.com',
        pass: process.env.SMTP_PASSWORD || 'sfxgvavaipxdpgij'
    },
});

// ============ ENDPOINT DE SALUD ============
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        services: ['notificaciones', 'reportes-pdf'] 
    });
});

// ============ ENDPOINTS DE NOTIFICACIONES ============
app.post('/api/enviar-confirmacion', async (req, res) => {
    console.log("-> Petición recibida para enviar email de confirmación...");
    const { emailCliente, numeroPedido } = req.body;

    if (!emailCliente || !numeroPedido) {
        return res.status(400).json({ message: "Faltan datos requeridos." });
    }

    try {
        await transporter.sendMail({
            from: '"Libros como Alas" <segundollengle157@gmail.com>',
            to: emailCliente,
            subject: `✅ Confirmación de tu Pedido #${numeroPedido}`,
            html: `<h1>¡Gracias por tu compra!</h1><p>Tu pedido #${numeroPedido} ha sido confirmado y está siendo preparado.</p>`,
        });

        console.log("Correo enviado exitosamente a:", emailCliente);
        res.status(200).json({ message: "Correo de confirmación enviado exitosamente." });

    } catch (error) {
        console.error("Error al enviar el correo:", error);
        res.status(500).json({ message: "Error interno al enviar el correo." });
    }
});

app.post('/api/enviar-rechazo', async (req, res) => {
    console.log("-> Petición recibida para enviar email de RECHAZO...");
    const { emailCliente, numeroPedido } = req.body;

    if (!emailCliente || !numeroPedido) {
        return res.status(400).json({ message: "Faltan datos requeridos." });
    }

    try {
        await transporter.sendMail({
            from: '"Libros como Alas" <segundollengle157@gmail.com>',
            to: emailCliente,
            subject: `❌ Novedades sobre tu Pedido #${numeroPedido}`,
            html: `
                <h1>Lo sentimos</h1>
                <p>Hubo un problema al procesar el pago de tu pedido #${numeroPedido} y ha sido anulado.</p>
                <p>El stock de los productos ha sido restaurado. Si crees que esto es un error, por favor, contáctanos.</p>
            `,
        });

        console.log("Correo de rechazo enviado exitosamente a:", emailCliente);
        res.status(200).json({ message: "Correo de rechazo enviado." });

    } catch (error) {
        console.error("Error al enviar el correo de rechazo:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
});

// ============ ENDPOINT DE REPORTES PDF ============
app.post('/reporte-libros-vendidos', (req, res) => {
    try {
        console.log('Petición recibida para generar Reporte PDF...');
        const libros = req.body.libros;
        const fecha = req.body.fecha;

        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            res.writeHead(200, {
                'Content-Length': Buffer.byteLength(pdfData),
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment;filename=reporte.pdf',
            }).end(pdfData);
        });

        doc.fontSize(20).text('Reporte de Libros Más Vendidos', { align: 'center' });
        doc.fontSize(12).text(`Generado el: ${fecha}`, { align: 'center' });
        doc.moveDown(2);

        const tableTop = 150;
        const tableHeaders = ['ID del Libro', 'Título', 'Unidades Vendidas'];
        const columnWidths = [100, 300, 150];
        let currentX = 50;

        doc.fontSize(12).font('Helvetica-Bold');
        tableHeaders.forEach((header, i) => {
            doc.text(header, currentX, tableTop, { width: columnWidths[i], align: 'left' });
            currentX += columnWidths[i];
        });
        doc.font('Helvetica');
        
        doc.moveTo(50, tableTop + 20)
           .lineTo(550, tableTop + 20)
           .stroke();
           
        let currentY = tableTop + 30;
        libros.forEach(libro => {
            const rowData = [libro.id, libro.nombre, libro.totalVendido];
            currentX = 50;
            rowData.forEach((cell, i) => {
                doc.text(String(cell), currentX, currentY, { width: columnWidths[i], align: 'left' });
                currentX += columnWidths[i];
            });
            currentY += 25;
        });

        console.log('PDF generado exitosamente.');
        doc.end();

    } catch (error) {
        console.error('Error al generar PDF:', error);
        res.status(500).send('Error interno al generar el PDF.');
    }
});

// ============ INICIAR SERVIDOR ============
// IMPORTANTE: Usar 0.0.0.0 para Railway
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servicios corriendo en puerto ${PORT}`);
    console.log(`   - Notificaciones: /api/enviar-confirmacion, /api/enviar-rechazo`);
    console.log(`   - Reportes: /reporte-libros-vendidos`);
});
