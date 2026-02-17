import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-proveedores',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './proveedores.html',
    styleUrl: './proveedores.css'
})
export class Proveedores implements OnInit {
    proveedores: any[] = [];
    loading = false;
    modalOpen = false;
    modoEdicion = false;

    proveedorActual = {
        provid: null as number | null,
        nombre: '',
        ruc: '',
        telefono: '',
        direccion: ''
    };

    constructor(private api: ApiService, private cd: ChangeDetectorRef) { }

    ngOnInit() {
        this.cargarProveedores();
    }

    cargarProveedores() {
        this.loading = true;
        this.api.getProveedores().subscribe({
            next: (data: any[]) => {
                this.proveedores = data;
                this.loading = false;
                this.cd.detectChanges();
            },
            error: (err) => {
                console.error('Error cargando proveedores', err);
                this.loading = false;
            }
        });
    }

    abrirModal(proveedor?: any) {
        if (proveedor) {
            this.modoEdicion = true;
            this.proveedorActual = {
                provid: proveedor.provid,
                nombre: proveedor.provnombre,
                ruc: proveedor.provruc || '',
                telefono: proveedor.provtelefono || '',
                direccion: proveedor.provdireccion || ''
            };
        } else {
            this.modoEdicion = false;
            this.proveedorActual = {
                provid: null,
                nombre: '',
                ruc: '',
                telefono: '',
                direccion: ''
            };
        }
        this.modalOpen = true;
    }

    cerrarModal() {
        this.modalOpen = false;
    }

    guardar() {
        if (!this.proveedorActual.nombre) {
            alert('El nombre es obligatorio');
            return;
        }

        this.loading = true;
        if (this.modoEdicion && this.proveedorActual.provid) {
            this.api.updateProveedor(this.proveedorActual.provid, this.proveedorActual).subscribe({
                next: () => {
                    this.loading = false;
                    alert('Proveedor actualizado exitosamente');
                    this.cerrarModal();
                    this.cargarProveedores();
                },
                error: (err) => {
                    console.error(err);
                    alert('Error al actualizar proveedor');
                    this.loading = false;
                }
            });
        } else {
            this.api.createProveedor(this.proveedorActual).subscribe({
                next: () => {
                    this.loading = false;
                    alert('Proveedor creado exitosamente');
                    this.cerrarModal();
                    this.cargarProveedores();
                },
                error: (err) => {
                    console.error(err);
                    alert('Error al crear proveedor');
                    this.loading = false;
                }
            });
        }
    }

    eliminar(id: number) {
        if (confirm('¿Estás seguro de eliminar este proveedor?')) {
            this.loading = true;
            this.api.deleteProveedor(id).subscribe({
                next: () => {
                    this.loading = false;
                    this.cargarProveedores();
                },
                error: (err) => {
                    console.error(err);
                    alert('Error al eliminar proveedor');
                    this.loading = false;
                }
            });
        }
    }
}
