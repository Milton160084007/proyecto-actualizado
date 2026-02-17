import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-compras',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './compras.html',
    styleUrls: ['./compras.css']
})
export class ComprasComponent implements OnInit {
    vistaActual: 'historial' | 'nueva' = 'historial';
    compras: any[] = [];
    loading = false;

    // Nueva compra
    proveedores: any[] = [];
    productos: any[] = [];
    proveedorSeleccionado: any = null;
    busquedaProducto = '';
    productosFiltrados: any[] = [];

    items: any[] = [];
    observacion = '';

    constructor(private api: ApiService, private auth: AuthService) { }

    ngOnInit() {
        this.cargarHistorial();
    }

    // ===== HISTORIAL =====
    cargarHistorial() {
        this.loading = true;
        this.api.getEntradas().subscribe({
            next: (data) => { this.compras = data; this.loading = false; },
            error: (err) => { console.error('Error:', err); this.loading = false; }
        });
    }

    // ===== NUEVA COMPRA =====
    iniciarNuevaCompra() {
        this.vistaActual = 'nueva';
        this.items = [];
        this.proveedorSeleccionado = null;
        this.observacion = '';
        this.busquedaProducto = '';
        this.productosFiltrados = [];

        this.api.getProveedores().subscribe(data => this.proveedores = data);
        this.api.getProductos().subscribe(data => this.productos = data);
    }

    volverHistorial() {
        this.vistaActual = 'historial';
        this.cargarHistorial();
    }

    buscarProducto() {
        if (!this.busquedaProducto.trim()) { this.productosFiltrados = []; return; }
        const term = this.busquedaProducto.toLowerCase();
        this.productosFiltrados = this.productos.filter(p =>
            p.prodnombre.toLowerCase().includes(term) || p.prodcodigo.toLowerCase().includes(term)
        ).slice(0, 8);
    }

    agregarItem(producto: any) {
        const existente = this.items.find(i => i.prodid === producto.prodid);
        if (existente) {
            existente.cantidad++;
            return;
        }
        this.items.push({
            prodid: producto.prodid,
            prodnombre: producto.prodnombre,
            prodcodigo: producto.prodcodigo,
            cantidad: 1,
            costo_compra: 0,
            nro_lote: '',
            fecha_vencimiento: ''
        });
        this.busquedaProducto = '';
        this.productosFiltrados = [];
    }

    quitarItem(index: number) {
        this.items.splice(index, 1);
    }

    get totalCompra(): number {
        return this.items.reduce((sum, item) => sum + (item.cantidad * item.costo_compra), 0);
    }

    procesarCompra() {
        if (this.items.length === 0) {
            alert('Agregue al menos un producto');
            return;
        }

        // Validate all items have cost and vencimiento
        for (const item of this.items) {
            if (!item.costo_compra || item.costo_compra <= 0) {
                alert(`Ingrese un costo válido para: ${item.prodnombre}`);
                return;
            }
            if (!item.fecha_vencimiento) {
                alert(`Ingrese fecha de vencimiento para: ${item.prodnombre}`);
                return;
            }
        }

        if (!confirm(`¿Confirmar compra por $${this.totalCompra.toFixed(2)}?`)) return;

        this.loading = true;
        const data = {
            productos: this.items.map(item => ({
                prodid: item.prodid,
                cantidad: item.cantidad,
                costo_compra: item.costo_compra,
                nro_lote: item.nro_lote || null,
                fecha_vencimiento: item.fecha_vencimiento
            })),
            observacion: this.observacion,
            usuid: this.auth.usuario?.usuid || 1
        };

        this.api.createEntrada(data).subscribe({
            next: (res) => {
                alert(`✅ Compra registrada exitosamente!\nDocumento: ${res.documento}\nItems: ${res.items.length}`);
                this.loading = false;
                this.volverHistorial();
            },
            error: (err) => {
                alert('Error al registrar compra: ' + (err.error?.error || err.message));
                this.loading = false;
            }
        });
    }
}
