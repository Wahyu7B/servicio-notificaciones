const express = require('express');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');

const app = express();
const port = 4001;

app.use(bodyParser.json());


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
            const rowData = [
                libro.id,
                libro.nombre,
                libro.totalVendido
            ];
            
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

app.listen(port, () => {
    console.log(`Servicio de reportes PDF escuchando en http://localhost:${port}`);
});