import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
    selector: 'app-ventas',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './ventas.html',
    styleUrls: ['./ventas.css']
})
export class VentasComponent implements OnInit {
    vistaActual: 'historial' | 'nueva' = 'historial';
    ventas: any[] = [];
    loading = false;
    ventaDetalle: any = null;
    modalDetalleOpen = false;
    clientes: any[] = [];
    productos: any[] = [];
    clienteSeleccionado: any = null;
    busquedaCliente = '';
    busquedaProducto = '';
    productosFiltrados: any[] = [];
    carrito: any[] = [];
    porcentajeIva = 15;

    constructor(private api: ApiService, private auth: AuthService) { }

    ngOnInit() {
        this.cargarHistorial();
        this.api.getConfiguracion().subscribe(data => {
            if (data && data.confiva_porcentaje) {
                this.porcentajeIva = parseFloat(data.confiva_porcentaje);
            }
        });
    }

    cargarHistorial() {
        this.loading = true;
        this.api.getVentas().subscribe({
            next: (data) => { this.ventas = data; this.loading = false; },
            error: (err) => { console.error('Error:', err); this.loading = false; }
        });
    }

    verDetalle(venta: any) {
        this.api.getVenta(venta.venid).subscribe({
            next: (data) => { this.ventaDetalle = data; this.modalDetalleOpen = true; },
            error: (err) => alert('Error cargando detalle: ' + err.message)
        });
    }

    cerrarDetalle() {
        this.modalDetalleOpen = false;
        this.ventaDetalle = null;
    }

    anularVenta(venta: any) {
        if (venta.venestado === 'ANULADA') { alert('Esta venta ya está anulada'); return; }
        if (confirm(`¿Anular la venta ${venta.vennumero}? Esto devolverá el stock.`)) {
            this.api.anularVenta(venta.venid, this.auth.usuario?.usuid).subscribe({
                next: () => { alert('Venta anulada exitosamente'); this.cargarHistorial(); this.cerrarDetalle(); },
                error: (err) => alert('Error al anular venta: ' + (err.error?.error || err.message))
            });
        }
    }

    // ===== NUEVA VENTA =====
    iniciarNuevaVenta() {
        this.vistaActual = 'nueva';
        this.carrito = [];
        this.clienteSeleccionado = null;
        this.busquedaCliente = '';
        this.busquedaProducto = '';
        this.productosFiltrados = [];

        this.api.getClientes().subscribe(data => this.clientes = data);
        this.api.getProductos().subscribe(data => this.productos = data);
    }

    volverHistorial() {
        this.vistaActual = 'historial';
        this.cargarHistorial();
    }

    filtrarClientes(): any[] {
        if (!this.busquedaCliente.trim()) return [];
        const term = this.busquedaCliente.toLowerCase();
        return this.clientes.filter(c =>
            c.clinombre.toLowerCase().includes(term) || (c.clicidruc && c.clicidruc.includes(term))
        ).slice(0, 5);
    }

    seleccionarCliente(cliente: any) {
        this.clienteSeleccionado = cliente;
        this.busquedaCliente = '';
    }

    buscarProducto() {
        if (!this.busquedaProducto.trim()) { this.productosFiltrados = []; return; }
        const term = this.busquedaProducto.toLowerCase();
        this.productosFiltrados = this.productos.filter(p =>
            (p.prodnombre.toLowerCase().includes(term) || p.prodcodigo.toLowerCase().includes(term)) && p.prodstock_global > 0
        ).slice(0, 8);
    }

    agregarAlCarrito(producto: any) {
        const existente = this.carrito.find(item => item.prodid === producto.prodid);
        if (existente) {
            if (existente.cantidad < producto.prodstock_global) {
                existente.cantidad++;
                this.recalcularLinea(existente);
            } else { alert(`Stock insuficiente. Disponible: ${producto.prodstock_global}`); }
        } else {
            const precioUnit = parseFloat(producto.prodprecio_venta);
            const tieneIva = producto.prodtiene_iva;
            const item: any = {
                prodid: producto.prodid, prodnombre: producto.prodnombre, prodcodigo: producto.prodcodigo,
                precio_unitario: precioUnit, cantidad: 1, descuento: 0, tiene_iva: tieneIva,
                subtotal: 0, iva: 0, total: 0, stock_disponible: producto.prodstock_global,
                descuento_nombre: '', descuento_pct: 0, descuento_pct_input: 0
            };

            // Auto-aplicar descuento activo
            this.api.getDescuentosProducto(producto.prodid).subscribe({
                next: (descuentos) => {
                    if (descuentos && descuentos.length > 0) {
                        const mejor = descuentos[0];
                        item.descuento_nombre = mejor.descnombre;
                        item.descuento_pct = parseFloat(mejor.descporcentaje);
                        item.descuento_pct_input = item.descuento_pct;
                        item.descuento = +(precioUnit * item.descuento_pct / 100).toFixed(2);
                    }
                    this.recalcularLinea(item);
                },
                error: () => this.recalcularLinea(item)
            });

            this.recalcularLinea(item);
            this.carrito.push(item);
        }
        this.busquedaProducto = '';
        this.productosFiltrados = [];
    }

    recalcularLinea(item: any) {
        // Aseguramos que tome el valor tal cual lo escribe el usuario (ej: 10 para 10%)
        let porcentaje = parseFloat(item.descuento_pct_input);

        if (isNaN(porcentaje) || porcentaje < 0) porcentaje = 0;
        if (porcentaje > 100) porcentaje = 100;

        item.descuento_pct_input = porcentaje; // Mantenemos el número visible

        // Calculamos el dinero a descontar en base al porcentaje
        item.descuento = +(item.precio_unitario * (porcentaje / 100)).toFixed(2);

        // Subtotal, IVA y Total
        const precioConDescuento = Math.max(0, item.precio_unitario - item.descuento);
        const subtotal = precioConDescuento * item.cantidad;
        const iva = item.tiene_iva ? subtotal * (this.porcentajeIva / 100) : 0;

        item.subtotal = +subtotal.toFixed(2);
        item.iva = +iva.toFixed(2);
        item.total = +(subtotal + iva).toFixed(2);
    }

    actualizarCantidad(item: any) {
        if (item.cantidad > item.stock_disponible) { item.cantidad = item.stock_disponible; alert(`Stock máximo: ${item.stock_disponible}`); }
        if (item.cantidad < 1) item.cantidad = 1;
        this.recalcularLinea(item);
    }

    quitarDelCarrito(index: number) { this.carrito.splice(index, 1); }

    get subtotalGeneral(): number { return this.carrito.reduce((sum, item) => sum + item.subtotal, 0); }
    get totalIva(): number { return this.carrito.reduce((sum, item) => sum + item.iva, 0); }
    get totalGeneral(): number { return this.subtotalGeneral + this.totalIva; }

    procesarVenta() {
        if (!this.clienteSeleccionado) { alert('Seleccione un cliente'); return; }
        if (this.carrito.length === 0) { alert('Agregue al menos un producto'); return; }
        if (!confirm(`¿Confirmar venta por $${this.totalGeneral.toFixed(2)}?`)) return;

        const data = {
            cliid: this.clienteSeleccionado.cliid,
            porcentaje_iva: this.porcentajeIva,
            usuid: this.auth.usuario?.usuid || 1,
            detalles: this.carrito.map(item => ({ prodid: item.prodid, cantidad: item.cantidad, descuento: item.descuento }))
        };

        this.api.createVenta(data).subscribe({
            next: (res) => {
                alert(`✅ Venta creada exitosamente!\nTotal: $${this.totalGeneral.toFixed(2)}`);
                this.volverHistorial();
            },
            error: (err) => alert('Error al procesar venta: ' + (err.error?.error || err.message))
        });
    }

    // ===== PDF FACTURA =====
    generarFacturaPDF(venta?: any) {
        const data = venta || this.ventaDetalle;
        if (!data) return;

        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('MICROMERCADO MUÑOZ', 14, 20);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Sistema de Gestión de Inventario', 14, 26);
        doc.text('RUC: 0000000000001', 14, 31);

        // Invoice number (right)
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(79, 70, 229);
        doc.text('FACTURA', 196, 20, { align: 'right' });
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`N° ${data.vennumero || 'S/N'}`, 196, 28, { align: 'right' });

        const fecha = new Date(data.venfecha).toLocaleDateString('es-EC', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Fecha: ${fecha}`, 196, 34, { align: 'right' });

        // Line
        doc.setDrawColor(79, 70, 229);
        doc.setLineWidth(1);
        doc.line(14, 38, 196, 38);

        // Client data
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Datos del Cliente', 14, 46);
        doc.setFont('helvetica', 'normal');
        doc.text(`Nombre: ${data.clinombre || 'N/A'}`, 14, 53);
        doc.text(`CI/RUC: ${data.clicidruc || 'N/A'}`, 14, 59);
        doc.text(`Cajero: ${data.usuusuario || 'N/A'}`, 120, 53);

        // ANULADA stamp
        if (data.venestado === 'ANULADA') {
            doc.setTextColor(220, 38, 38);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('ANULADA', 196, 53, { align: 'right' });
            doc.setTextColor(0, 0, 0);
        }

        // Products table
        const detalles = data.detalles || [];
        autoTable(doc, {
            startY: 68,
            head: [['#', 'Código', 'Producto', 'Cant.', 'P.Unit.', 'Desc.', 'Subtotal', 'IVA', 'Total']],
            body: detalles.map((d: any, i: number) => [
                (i + 1).toString(),
                d.prodcodigo || '-',
                d.prodnombre,
                (d.dvcantidad || d.vdetcantidad || d.cantidad || 0).toString(),
                `$${parseFloat(d.dvprecio_unitario || d.vdetprecio_unitario || d.precio_unitario || 0).toFixed(2)}`,
                `$${parseFloat(d.dvdescuento || d.vdetdescuento || d.descuento || 0).toFixed(2)}`,
                `$${parseFloat(d.dvsubtotal || d.vdetsubtotal || d.subtotal || 0).toFixed(2)}`,
                `$${parseFloat(d.dviva || d.vdetiva || d.iva || 0).toFixed(2)}`,
                `$${parseFloat(d.dvtotal || d.vdettotal || d.total || 0).toFixed(2)}`
            ]),
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 8, halign: 'center' as const },
            styles: { fontSize: 8 },
            columnStyles: {
                0: { halign: 'center' as const, cellWidth: 10 },
                3: { halign: 'center' as const },
                4: { halign: 'right' as const },
                5: { halign: 'right' as const },
                6: { halign: 'right' as const },
                7: { halign: 'right' as const },
                8: { halign: 'right' as const }
            }
        });

        // Totals
        const finalY = (doc as any).lastAutoTable?.finalY || 120;
        const subtotal = parseFloat(data.vensubtotal || data.venbase_imponible || 0).toFixed(2);
        const iva = parseFloat(data.venmonto_iva || 0).toFixed(2);
        const total = parseFloat(data.ventotal || 0).toFixed(2);

        const boxX = 130;
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(248, 248, 255);
        doc.rect(boxX, finalY + 5, 66, 32, 'FD');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Subtotal:', boxX + 4, finalY + 13);
        doc.text(`$${subtotal}`, 192, finalY + 13, { align: 'right' });
        doc.text(`IVA (${this.porcentajeIva}%):`, boxX + 4, finalY + 20);
        doc.text(`$${iva}`, 192, finalY + 20, { align: 'right' });

        doc.setLineWidth(0.3);
        doc.line(boxX + 4, finalY + 23, 192, finalY + 23);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL:', boxX + 4, finalY + 32);
        doc.setTextColor(79, 70, 229);
        doc.text(`$${total}`, 192, finalY + 32, { align: 'right' });
        doc.setTextColor(0, 0, 0);

        // Footer
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Gracias por su compra - Micromercado Muñoz', 105, 280, { align: 'center' });
        doc.text('Este documento es una representación impresa de la factura electrónica', 105, 285, { align: 'center' });

        doc.save(`Factura_${data.vennumero || 'venta'}.pdf`);
    }
}
