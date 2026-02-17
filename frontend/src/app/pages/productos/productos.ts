import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-productos',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './productos.html',
    styleUrl: './productos.css'
})
export class Productos implements OnInit {
    productos: any[] = [];
    categorias: any[] = [];
    proveedores: any[] = [];

    filtro = '';
    loading = false;

    // Modal Crear/Editar
    modalOpen = false;
    editando = false;
    productoActual: any = this.nuevoProducto();

    // Modal Proveedores
    modalProveedoresOpen = false;
    productoProveedores: any = null;
    proveedoresDelProducto: any[] = [];
    proveedorSeleccionado: number | null = null;
    costoReferencia = 0;
    diasEntrega = 1;

    constructor(private api: ApiService, private cd: ChangeDetectorRef) { }

    ngOnInit() {
        this.cargarDatos();
    }

    nuevoProducto() {
        return {
            prodid: null,
            prodcodigo: '',
            prodnombre: '',
            proddescripcion: '',
            prodprecio_venta: 0,
            prodtiene_iva: 1,
            prodstock_global: 0,
            prodminimo: 5,
            catid: null
        };
    }

    cargarDatos() {
        this.loading = true;

        this.api.getProductos().subscribe({
            next: (data) => {
                this.productos = data;
                this.loading = false;
                this.cd.detectChanges();
            },
            error: (err) => {
                console.error('Error:', err);
                this.loading = false;
            }
        });

        this.api.getCategorias().subscribe(data => {
            this.categorias = data;
            this.cd.detectChanges();
        });
        this.api.getProveedores().subscribe(data => {
            this.proveedores = data;
            this.cd.detectChanges();
        });
    }

    buscar() {
        if (this.filtro.trim()) {
            this.api.buscarProductos(this.filtro).subscribe(data => this.productos = data);
        } else {
            this.cargarDatos();
        }
    }

    abrirModal(producto?: any) {
        if (producto) {
            this.editando = true;
            this.productoActual = { ...producto };
        } else {
            this.editando = false;
            this.productoActual = this.nuevoProducto();
        }
        this.modalOpen = true;
    }

    cerrarModal() {
        this.modalOpen = false;
        this.productoActual = this.nuevoProducto();
    }

    guardar() {
        const dataToSend = {
            catid: this.productoActual.catid,
            codigo: this.productoActual.prodcodigo,
            nombre: this.productoActual.prodnombre,
            descripcion: this.productoActual.proddescripcion,
            precio_venta: this.productoActual.prodprecio_venta,
            tiene_iva: this.productoActual.prodtiene_iva,
            stock_minimo: this.productoActual.prodminimo
        };

        if (this.editando) {
            this.api.updateProducto(this.productoActual.prodid, dataToSend).subscribe({
                next: () => {
                    alert('Producto actualizado exitosamente');
                    this.cargarDatos();
                    this.cerrarModal();
                },
                error: (err) => alert('Error: ' + err.error?.error)
            });
        } else {
            this.api.createProducto(dataToSend).subscribe({
                next: () => {
                    alert('Producto creado exitosamente');
                    this.cargarDatos();
                    this.cerrarModal();
                },
                error: (err) => alert('Error: ' + err.error?.error)
            });
        }
    }

    eliminar(producto: any) {
        if (confirm(`¿Eliminar "${producto.prodnombre}"?`)) {
            this.api.deleteProducto(producto.prodid).subscribe(() => this.cargarDatos());
        }
    }

    get productosFiltrados() {
        if (!this.filtro) return this.productos;
        const term = this.filtro.toLowerCase();
        return this.productos.filter(p =>
            p.prodnombre.toLowerCase().includes(term) ||
            p.prodcodigo.toLowerCase().includes(term)
        );
    }

    // ===== MODAL PROVEEDORES =====
    abrirModalProveedores(producto: any) {
        this.productoProveedores = producto;
        this.proveedorSeleccionado = null;
        this.costoReferencia = 0;
        this.diasEntrega = 1;
        this.cargarProveedoresProducto(producto.prodid);
        this.modalProveedoresOpen = true;
    }

    cerrarModalProveedores() {
        this.modalProveedoresOpen = false;
        this.productoProveedores = null;
        this.proveedoresDelProducto = [];
    }

    cargarProveedoresProducto(prodid: number) {
        this.api.getProducto(prodid).subscribe({
            next: (data) => {
                this.proveedoresDelProducto = data.proveedores || [];
                this.cd.detectChanges();
            },
            error: (err) => console.error('Error cargando proveedores del producto', err)
        });
    }

    get proveedoresDisponibles(): any[] {
        const idsAsignados = this.proveedoresDelProducto.map(p => p.provid);
        return this.proveedores.filter(p => !idsAsignados.includes(p.provid));
    }

    asignarProveedor() {
        if (!this.proveedorSeleccionado) {
            alert('Seleccione un proveedor');
            return;
        }

        this.api.asignarProveedorProducto(this.productoProveedores.prodid, {
            provid: this.proveedorSeleccionado,
            costo_referencia: this.costoReferencia,
            dias_entrega: this.diasEntrega
        }).subscribe({
            next: () => {
                this.cargarProveedoresProducto(this.productoProveedores.prodid);
                this.proveedorSeleccionado = null;
                this.costoReferencia = 0;
                this.diasEntrega = 1;
            },
            error: (err) => alert('Error: ' + (err.error?.error || err.message))
        });
    }

    quitarProveedor(ppid: number) {
        if (confirm('¿Desvincular este proveedor del producto?')) {
            this.api.quitarProveedorProducto(this.productoProveedores.prodid, ppid).subscribe({
                next: () => this.cargarProveedoresProducto(this.productoProveedores.prodid),
                error: (err) => alert('Error: ' + (err.error?.error || err.message))
            });
        }
    }
}
