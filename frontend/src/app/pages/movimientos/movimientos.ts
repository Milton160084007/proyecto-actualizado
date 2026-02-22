import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-movimientos',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './movimientos.html',
    styleUrl: './movimientos.css'
})
export class Movimientos implements OnInit {
    movimientos: any[] = [];
    productos: any[] = [];

    modalOpen = false;
    tipoMovimiento: 'ENTRADA' | 'SALIDA' | 'PERDIDA' = 'ENTRADA';
    movimientoActual: any = {
        producto_id: null,
        cantidad: 1,
        observacion: '',
        nro_lote: '',
        fecha_vencimiento: '',
        costo_compra: 0
    };

    productoSeleccionado: any = null;
    resultado: any = null;
    loading = false;

    constructor(private api: ApiService, private cd: ChangeDetectorRef) { }

    ngOnInit() {
        this.cargarDatos();
    }

    cargarDatos() {
        this.loading = true;
        this.movimientos = [];

        this.api.getProductos().subscribe({
            next: (data) => {
                this.productos = data;
                this.cd.detectChanges();
            },
            error: (err) => console.error('Error cargando productos', err)
        });

        // Cargar movimientos del Kardex unificado
        this.api.getMovimientos().subscribe({
            next: (data) => {
                this.movimientos = data;
                this.loading = false;
                this.cd.detectChanges();
            },
            error: (err) => {
                console.error('Error cargando movimientos', err);
                this.loading = false;
            }
        });
    }

    abrirModal(tipo: 'ENTRADA' | 'SALIDA' | 'PERDIDA') {
        this.tipoMovimiento = tipo;
        this.resultado = null;
        this.movimientoActual = {
            producto_id: null,
            cantidad: 1,
            observacion: '',
            nro_lote: '',
            fecha_vencimiento: '',
            costo_compra: 0
        };
        this.productoSeleccionado = null;
        this.modalOpen = true;
    }

    cerrarModal() {
        this.modalOpen = false;
        this.resultado = null;
    }

    onProductoChange() {
        if (this.movimientoActual.producto_id) {
            this.productoSeleccionado = this.productos.find(
                p => p.prodid == this.movimientoActual.producto_id
            );
        } else {
            this.productoSeleccionado = null;
        }
    }

    registrar() {
        if (!this.movimientoActual.producto_id || this.movimientoActual.cantidad < 1) {
            alert('Selecciona un producto y cantidad válida');
            return;
        }

        const hoy = new Date().toISOString().split('T')[0];

        if (this.tipoMovimiento === 'ENTRADA') {
            if (!this.movimientoActual.nro_lote || this.movimientoActual.nro_lote.trim() === '') {
                alert('⚠️ Ingrese el número de lote');
                return;
            }
            if (!this.movimientoActual.fecha_vencimiento) {
                alert('⚠️ Ingrese la fecha de vencimiento');
                return;
            }
            if (this.movimientoActual.fecha_vencimiento <= hoy) {
                alert('⚠️ La fecha de vencimiento no puede estar caducada o vencer hoy.');
                return;
            }
            if (this.movimientoActual.costo_compra <= 0) {
                alert('⚠️ Ingrese un costo de compra válido');
                return;
            }

            this.loading = true;
            // Registrar compra vía /api/entradas
            const data = {
                productos: [{
                    prodid: this.movimientoActual.producto_id,
                    cantidad: this.movimientoActual.cantidad,
                    costo_compra: this.movimientoActual.costo_compra,
                    nro_lote: this.movimientoActual.nro_lote || null,
                    fecha_vencimiento: this.movimientoActual.fecha_vencimiento || null
                }],
                observacion: this.movimientoActual.observacion
            };

            this.api.createEntrada(data).subscribe({
                next: (res: any) => {
                    this.resultado = res;
                    this.loading = false;
                    this.cargarDatos();
                },
                error: (err: any) => {
                    alert('Error: ' + (err.error?.error || 'Error desconocido'));
                    this.loading = false;
                }
            });
        } else {
            // Registrar salida manual o pérdida vía ajuste
            const isPerdida = this.tipoMovimiento === 'PERDIDA';
            const data = {
                prodid: this.movimientoActual.producto_id,
                cantidad_real: this.productoSeleccionado.prodstock_global - this.movimientoActual.cantidad,
                observacion: this.movimientoActual.observacion || (isPerdida ? 'Pérdida / Desecho' : 'Venta Manual / Salida'),
                tipo_especifico: isPerdida ? 'PERDIDA_DESECHO' : 'VENTA'
            };

            this.api.registrarAjuste(data).subscribe({
                next: (res: any) => {
                    this.resultado = res;
                    this.loading = false;
                    this.cargarDatos();
                },
                error: (err: any) => {
                    alert('Error: ' + (err.error?.error || 'Stock insuficiente'));
                    this.loading = false;
                }
            });
        }
    }

    getIVA(): number {
        if (!this.productoSeleccionado || this.tipoMovimiento === 'ENTRADA') return 0;
        if (!this.productoSeleccionado.prodtiene_iva) return 0;
        const subtotal = this.productoSeleccionado.prodprecio_venta * this.movimientoActual.cantidad;
        return Math.round(subtotal * 0.15 * 100) / 100;
    }

    getTotal(): number {
        if (!this.productoSeleccionado) return 0;
        if (this.tipoMovimiento === 'ENTRADA') {
            return Math.round(this.movimientoActual.costo_compra * this.movimientoActual.cantidad * 100) / 100;
        }
        const subtotal = this.productoSeleccionado.prodprecio_venta * this.movimientoActual.cantidad;
        return Math.round((subtotal + this.getIVA()) * 100) / 100;
    }

    getTipoBadgeClass(tipo: string): string {
        const map: Record<string, string> = {
            'COMPRA': 'badge-success',
            'VENTA': 'badge-info',
            'AJUSTE_ENTRADA': 'badge-warning',
            'AJUSTE_SALIDA': 'badge-danger',
            'DEVOLUCION': 'badge-secondary',
            'PERDIDA_DESECHO': 'badge-danger'
        };
        return map[tipo] || 'badge-info';
    }
}
