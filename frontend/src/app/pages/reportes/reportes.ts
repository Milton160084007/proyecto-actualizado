import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Chart, registerables } from 'chart.js';
import * as XLSX from 'xlsx';

Chart.register(...registerables);

@Component({
    selector: 'app-reportes',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './reportes.html',
    styleUrls: ['./reportes.css']
})
export class ReportesComponent implements OnInit {
    periodoActual: 'diario' | 'semanal' | 'mensual' = 'mensual';

    resumen: any = { total_ventas: 0, total_transacciones: 0, total_iva: 0 };
    topProductos: any[] = [];
    detalleDias: any[] = [];

    private ventasChart: Chart | null = null;
    private topChart: Chart | null = null;

    constructor(private api: ApiService) { }

    ngOnInit() { this.cargarDatos(); }

    cambiarPeriodo(periodo: 'diario' | 'semanal' | 'mensual') {
        this.periodoActual = periodo;
        this.cargarDatos();
    }

    cargarDatos() {
        this.api.getVentasReporte(this.periodoActual).subscribe({
            next: (data) => {
                this.resumen = data.resumen;
                this.detalleDias = data.detalle_dias || [];
                setTimeout(() => this.renderVentasChart(), 100);
            },
            error: (err) => console.error('Error cargando reporte ventas', err)
        });

        this.api.getTopProductos(this.periodoActual).subscribe({
            next: (data) => {
                this.topProductos = data;
                setTimeout(() => this.renderTopChart(), 100);
            },
            error: (err) => console.error('Error cargando top productos', err)
        });
    }

    // ===== CHARTS =====
    renderVentasChart() {
        if (this.ventasChart) this.ventasChart.destroy();
        const canvas = document.getElementById('ventasChart') as HTMLCanvasElement;
        if (!canvas || this.detalleDias.length === 0) return;

        this.ventasChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: this.detalleDias.map(d => new Date(d.fecha).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })),
                datasets: [{
                    label: 'Ventas ($)',
                    data: this.detalleDias.map(d => parseFloat(d.total)),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#6366f1',
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { callback: (v) => '$' + v } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    renderTopChart() {
        if (this.topChart) this.topChart.destroy();
        const canvas = document.getElementById('topChart') as HTMLCanvasElement;
        if (!canvas || this.topProductos.length === 0) return;

        const colors = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#818cf8', '#7c3aed', '#6d28d9'];
        this.topChart = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: this.topProductos.slice(0, 8).map(p => p.prodnombre),
                datasets: [{
                    data: this.topProductos.slice(0, 8).map(p => parseFloat(p.total_ingresos)),
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } }
                }
            }
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

    // ===== EXCEL EXPORT =====
    exportarExcel() {
        const wb = XLSX.utils.book_new();

        // Sheet 1: Resumen
        const resumenData = [
            ['Periodo', this.getPeriodoLabel()],
            ['Total Ventas', this.resumen.total_ventas],
            ['Transacciones', this.resumen.total_transacciones],
            ['IVA Recaudado', this.resumen.total_iva]
        ];
        const wsResumen = XLSX.utils.aoa_to_sheet([['Indicador', 'Valor'], ...resumenData]);
        XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

        // Sheet 2: Top Productos
        if (this.topProductos.length > 0) {
            const topData = this.topProductos.map(p => ({
                Producto: p.prodnombre, Código: p.prodcodigo,
                Cantidad: p.cantidad_vendida, Ingresos: parseFloat(p.total_ingresos)
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(topData), 'Top Productos');
        }

        // Sheet 3: Detalle por Día
        if (this.detalleDias.length > 0) {
            const detalleData = this.detalleDias.map(d => ({
                Fecha: new Date(d.fecha).toLocaleDateString('es-EC'),
                Total: parseFloat(d.total)
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detalleData), 'Detalle Diario');
        }

        XLSX.writeFile(wb, `Reporte_${this.periodoActual}_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    // ===== PDF EXPORT =====
    exportarPDF() {
        const doc = new jsPDF();
        const fecha = new Date().toLocaleDateString('es-EC');

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('MICROMERCADO MUÑOZ', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Reporte de Ventas - ${this.getPeriodoLabel()}`, 105, 28, { align: 'center' });
        doc.setFontSize(9);
        doc.text(`Generado: ${fecha}`, 105, 34, { align: 'center' });
        doc.setLineWidth(0.5);
        doc.line(14, 38, 196, 38);

        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Resumen', 14, 46);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Ventas: $${parseFloat(this.resumen.total_ventas || 0).toFixed(2)}`, 14, 54);
        doc.text(`Transacciones: ${this.resumen.total_transacciones || 0}`, 14, 60);
        doc.text(`IVA Recaudado: $${parseFloat(this.resumen.total_iva || 0).toFixed(2)}`, 14, 66);

        let yPos = 78;
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Productos Más Vendidos', 14, yPos);

        if (this.topProductos.length > 0) {
            autoTable(doc, {
                startY: yPos + 4,
                head: [['Producto', 'Código', 'Cantidad', 'Ingresos']],
                body: this.topProductos.map(p => [p.prodnombre, p.prodcodigo, p.cantidad_vendida.toString(), `$${parseFloat(p.total_ingresos).toFixed(2)}`]),
                theme: 'grid', headStyles: { fillColor: [79, 70, 229] }, styles: { fontSize: 9 }
            });
        }

        if (this.detalleDias.length > 0) {
            const finalY = (doc as any).lastAutoTable?.finalY || yPos + 30;
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.text('Detalle por Día', 14, finalY + 12);
            autoTable(doc, {
                startY: finalY + 16,
                head: [['Fecha', 'Total Ventas']],
                body: this.detalleDias.map(d => [new Date(d.fecha).toLocaleDateString('es-EC'), `$${parseFloat(d.total).toFixed(2)}`]),
                theme: 'grid', headStyles: { fillColor: [79, 70, 229] }, styles: { fontSize: 9 }
            });
        }

        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text('Micromercado Muñoz - Sistema de Gestión', 14, 290);
            doc.text(`Página ${i} de ${pageCount}`, 196, 290, { align: 'right' });
        }

        doc.save(`Reporte_${this.periodoActual}_${fecha.replace(/\//g, '-')}.pdf`);
    }
}
