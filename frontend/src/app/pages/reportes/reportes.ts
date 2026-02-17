import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
    selector: 'app-reportes',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './reportes.html',
    styleUrls: ['./reportes.css']
})
export class ReportesComponent implements OnInit {
    periodoActual: 'diario' | 'semanal' | 'mensual' = 'diario';

    resumen: any = {
        total_ventas: 0,
        total_transacciones: 0,
        total_iva: 0
    };

    topProductos: any[] = [];
    detalleDias: any[] = [];

    constructor(private api: ApiService) { }

    ngOnInit() {
        this.cargarDatos();
    }

    cambiarPeriodo(periodo: 'diario' | 'semanal' | 'mensual') {
        this.periodoActual = periodo;
        this.cargarDatos();
    }

    cargarDatos() {
        this.api.getVentasReporte(this.periodoActual).subscribe({
            next: (data) => {
                this.resumen = data.resumen;
                this.detalleDias = data.detalle_dias || [];
            },
            error: (err) => console.error('Error cargando reporte ventas', err)
        });

        this.api.getTopProductos(this.periodoActual).subscribe({
            next: (data) => {
                this.topProductos = data;
            },
            error: (err) => console.error('Error cargando top productos', err)
        });
    }

    getPeriodoLabel(): string {
        switch (this.periodoActual) {
            case 'diario': return 'Hoy';
            case 'semanal': return 'Esta Semana';
            case 'mensual': return 'Este Mes';
            default: return '';
        }
    }

    calculateHeight(total: number): number {
        if (!this.detalleDias.length) return 0;
        const max = Math.max(...this.detalleDias.map(d => parseFloat(d.total)));
        return max > 0 ? (total / max) * 150 : 0;
    }

    // ===== PDF EXPORT =====
    exportarPDF() {
        const doc = new jsPDF();
        const fecha = new Date().toLocaleDateString('es-EC');

        // Header
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('MICROMERCADO MUÑOZ', 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Reporte de Ventas - ${this.getPeriodoLabel()}`, 105, 28, { align: 'center' });
        doc.setFontSize(9);
        doc.text(`Generado: ${fecha}`, 105, 34, { align: 'center' });

        // Line separator
        doc.setLineWidth(0.5);
        doc.line(14, 38, 196, 38);

        // Resumen
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Resumen', 14, 46);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const totalVentas = parseFloat(this.resumen.total_ventas || 0).toFixed(2);
        const totalIva = parseFloat(this.resumen.total_iva || 0).toFixed(2);
        doc.text(`Total Ventas: $${totalVentas}`, 14, 54);
        doc.text(`Transacciones: ${this.resumen.total_transacciones || 0}`, 14, 60);
        doc.text(`IVA Recaudado: $${totalIva}`, 14, 66);

        // Top Productos Table
        let yPos = 78;
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Productos Más Vendidos', 14, yPos);

        if (this.topProductos.length > 0) {
            autoTable(doc, {
                startY: yPos + 4,
                head: [['Producto', 'Código', 'Cantidad', 'Ingresos']],
                body: this.topProductos.map(p => [
                    p.prodnombre,
                    p.prodcodigo,
                    p.cantidad_vendida.toString(),
                    `$${parseFloat(p.total_ingresos).toFixed(2)}`
                ]),
                theme: 'grid',
                headStyles: { fillColor: [79, 70, 229] },
                styles: { fontSize: 9 }
            });
        }

        // Detalle por día (si aplica)
        if (this.detalleDias.length > 0) {
            const finalY = (doc as any).lastAutoTable?.finalY || yPos + 30;
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.text('Detalle por Día', 14, finalY + 12);

            autoTable(doc, {
                startY: finalY + 16,
                head: [['Fecha', 'Total Ventas']],
                body: this.detalleDias.map(d => [
                    new Date(d.fecha).toLocaleDateString('es-EC'),
                    `$${parseFloat(d.total).toFixed(2)}`
                ]),
                theme: 'grid',
                headStyles: { fillColor: [79, 70, 229] },
                styles: { fontSize: 9 }
            });
        }

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text('Micromercado Muñoz - Sistema de Gestión', 14, 290);
            doc.text(`Página ${i} de ${pageCount}`, 196, 290, { align: 'right' });
        }

        doc.save(`Reporte_${this.periodoActual}_${fecha.replace(/\//g, '-')}.pdf`);
    }
}
