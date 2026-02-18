import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-descuentos',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './descuentos.html',
    styleUrls: ['./descuentos.css']
})
export class DescuentosComponent implements OnInit {
    descuentos: any[] = [];
    productos: any[] = [];
    categorias: any[] = [];
    loading = false;
    modalOpen = false;
    editando = false;

    form: any = {
        descid: null,
        descnombre: '',
        descalcance: 'PRODUCTO',
        refid: null,
        descporcentaje: 0,
        descfechainicio: '',
        descfechafin: '',
        descactivo: 1
    };

    constructor(private api: ApiService) { }

    ngOnInit() {
        this.cargarDatos();
    }

    cargarDatos() {
        this.loading = true;
        this.api.getDescuentos().subscribe({
            next: (data) => { this.descuentos = data; this.loading = false; },
            error: (err) => { console.error('Error:', err); this.loading = false; }
        });
        this.api.getProductos().subscribe(data => this.productos = data);
        this.api.getCategorias().subscribe(data => this.categorias = data);
    }

    abrirModal(descuento?: any) {
        if (descuento) {
            this.editando = true;
            this.form = {
                descid: descuento.descid,
                descnombre: descuento.descnombre,
                descalcance: descuento.descalcance,
                refid: descuento.refid,
                descporcentaje: descuento.descporcentaje,
                descfechainicio: descuento.descfechainicio?.split('T')[0],
                descfechafin: descuento.descfechafin?.split('T')[0],
                descactivo: descuento.descactivo
            };
        } else {
            this.editando = false;
            this.form = {
                descid: null,
                descnombre: '',
                descalcance: 'PRODUCTO',
                refid: null,
                descporcentaje: 0,
                descfechainicio: '',
                descfechafin: '',
                descactivo: 1
            };
        }
        this.modalOpen = true;
    }

    cerrarModal() {
        this.modalOpen = false;
    }

    guardar() {
        if (!this.form.descnombre || !this.form.refid || !this.form.descporcentaje || !this.form.descfechainicio || !this.form.descfechafin) {
            alert('⚠️ Complete todos los campos obligatorios');
            return;
        }

        // Validate dates
        const hoy = new Date().toISOString().split('T')[0];
        if (this.form.descfechafin < hoy) {
            alert('⚠️ La fecha de fin no puede ser una fecha pasada');
            return;
        }
        if (this.form.descfechafin < this.form.descfechainicio) {
            alert('⚠️ La fecha de fin debe ser posterior a la fecha de inicio');
            return;
        }
        if (this.form.descporcentaje <= 0 || this.form.descporcentaje > 100) {
            alert('⚠️ El porcentaje debe estar entre 0.01 y 100');
            return;
        }

        const data = { ...this.form };

        if (this.editando && data.descid) {
            this.api.updateDescuento(data.descid, data).subscribe({
                next: () => { alert('✅ Descuento actualizado'); this.cargarDatos(); this.cerrarModal(); },
                error: (err) => alert('❌ Error: ' + (err.error?.error || err.message))
            });
        } else {
            this.api.createDescuento(data).subscribe({
                next: () => { alert('✅ Descuento creado'); this.cargarDatos(); this.cerrarModal(); },
                error: (err) => alert('❌ Error: ' + (err.error?.error || err.message))
            });
        }
    }

    eliminar(descuento: any) {
        if (!confirm(`⚠️ ¿Está seguro de desactivar el descuento "${descuento.descnombre}"?\n\nEsta acción desactivará la promoción.`)) return;
        this.api.deleteDescuento(descuento.descid).subscribe({
            next: () => { alert('✅ Descuento desactivado'); this.cargarDatos(); },
            error: (err) => alert('❌ Error: ' + (err.error?.error || err.message))
        });
    }

    estaActivo(d: any): boolean {
        const hoy = new Date().toISOString().split('T')[0];
        return d.descactivo && d.descfechainicio <= hoy && d.descfechafin >= hoy;
    }
}
