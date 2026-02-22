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
    productos: any[] = [];
    busquedaProducto = '';
    productosFiltrados: any[] = [];

    items: any[] = [];
    observacion = '';
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
        this.observacion = '';
        this.busquedaProducto = '';
        this.productosFiltrados = [];

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

        this.api.getProducto(producto.prodid).subscribe(detalle => {
            // VALIDACIÓN: No dejar comprar si no tiene proveedor asignado
            if (!detalle.proveedores || detalle.proveedores.length === 0) {
                alert(`⚠️ ERROR: El producto "${producto.prodnombre}" NO tiene ningún proveedor asignado.\n\nPor favor, asigne un proveedor en el módulo de Productos antes de comprar.`);
                return;
            }

            this.items.push({
                prodid: producto.prodid,
                prodnombre: producto.prodnombre,
                prodcodigo: producto.prodcodigo,
                cantidad: 1,
                // Carga directo el costo referencial del primer proveedor
                costo_compra: detalle.proveedores[0].costo_referencia || 0,
                nro_lote: '',
                fecha_vencimiento: '',
                provid: detalle.proveedores[0].provid,
                proveedoresDisponibles: detalle.proveedores
            });
        });

        this.busquedaProducto = '';
        this.productosFiltrados = [];
    }

    quitarItem(index: number) {
        this.items.splice(index, 1);
    }

    get subtotalCompra(): number {
        return this.items.reduce((sum, item) => sum + (item.cantidad * item.costo_compra), 0);
    }

    get ivaCompra(): number {
        return this.subtotalCompra * (this.porcentajeIva / 100);
    }

    get totalCompra(): number {
        return this.subtotalCompra + this.ivaCompra;
    }

    procesarCompra() {
        if (this.items.length === 0) { alert('⚠️ Agregue al menos un producto'); return; }

        const hoy = new Date().toISOString().split('T')[0];

        for (const item of this.items) {
            if (!item.nro_lote || item.nro_lote.trim() === '') {
                alert(`⚠️ OBLIGATORIO: Ingrese el número de lote para: ${item.prodnombre}`);
                return;
            }
            if (!item.fecha_vencimiento) {
                alert(`⚠️ OBLIGATORIO: Ingrese la fecha de vencimiento para: ${item.prodnombre}`);
                return;
            }
            if (item.fecha_vencimiento <= hoy) {
                alert(`❌ ERROR: La fecha de vencimiento de "${item.prodnombre}" indica que el lote ya está CADUCADO o vence hoy. No se puede ingresar.`);
                return;
            }
            if (item.costo_compra <= 0) {
                alert(`⚠️ Ingrese un costo de compra válido mayor a $0 para: ${item.prodnombre}`);
                return;
            }
        }

        // Validate all items have cost and quantity
        for (const item of this.items) {
            if (!item.cantidad || item.cantidad <= 0) {
                alert(`⚠️ Ingrese una cantidad válida para: ${item.prodnombre}`);
                return;
            }
            if (!item.costo_compra || item.costo_compra <= 0) {
                alert(`⚠️ Ingrese un costo válido para: ${item.prodnombre}`);
                return;
            }
            if (!item.fecha_vencimiento) {
                alert(`⚠️ Ingrese fecha de vencimiento para: ${item.prodnombre}`);
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
                fecha_vencimiento: item.fecha_vencimiento,
                provid: item.provid || null
            })),
            observacion: this.observacion,
            usuid: this.auth.usuario?.usuid || 1
        };

        this.api.createEntrada(data).subscribe({
            next: (res) => {
                alert(`✅ Compra registrada exitosamente`);
                this.loading = false;
                this.volverHistorial();
            },
            error: (err) => {
                alert('❌ Error al registrar compra: ' + (err.error?.error || err.message));
                this.loading = false;
            }
        });
    }
}
