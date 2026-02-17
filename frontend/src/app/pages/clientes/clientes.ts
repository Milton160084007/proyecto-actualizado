import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-clientes',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './clientes.html',
    styleUrls: ['./clientes.css']
})
export class ClientesComponent implements OnInit {
    clientes: any[] = [];
    filtro = '';
    loading = false;

    modalOpen = false;
    editando = false;
    clienteActual: any = this.nuevoCliente();

    constructor(private api: ApiService) { }

    ngOnInit() {
        this.cargarDatos();
    }

    nuevoCliente() {
        return {
            cliid: null,
            clinombre: '',
            clicidruc: '',
            clidireccion: '',
            clitelefono: '',
            cliemail: ''
        };
    }

    cargarDatos() {
        this.loading = true;
        this.api.getClientes().subscribe({
            next: (data) => {
                this.clientes = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error:', err);
                this.loading = false;
            }
        });
    }

    get clientesFiltrados(): any[] {
        if (!this.filtro) return this.clientes;
        const term = this.filtro.toLowerCase();
        return this.clientes.filter(c =>
            c.clinombre.toLowerCase().includes(term) ||
            c.clicidruc.includes(term) ||
            (c.cliemail && c.cliemail.toLowerCase().includes(term))
        );
    }

    abrirModal(cliente?: any) {
        if (cliente) {
            this.editando = true;
            this.clienteActual = { ...cliente };
        } else {
            this.editando = false;
            this.clienteActual = this.nuevoCliente();
        }
        this.modalOpen = true;
    }

    cerrarModal() {
        this.modalOpen = false;
        this.clienteActual = this.nuevoCliente();
    }

    guardar() {
        if (!this.clienteActual.clinombre || !this.clienteActual.clicidruc) {
            alert('Nombre y CI/RUC son obligatorios');
            return;
        }

        const data = {
            nombre: this.clienteActual.clinombre,
            cidruc: this.clienteActual.clicidruc,
            direccion: this.clienteActual.clidireccion,
            telefono: this.clienteActual.clitelefono,
            email: this.clienteActual.cliemail
        };

        if (this.editando) {
            this.api.updateCliente(this.clienteActual.cliid, data).subscribe({
                next: () => {
                    alert('Cliente actualizado exitosamente');
                    this.cargarDatos();
                    this.cerrarModal();
                },
                error: (err) => alert('Error: ' + (err.error?.error || err.message))
            });
        } else {
            this.api.createCliente(data).subscribe({
                next: () => {
                    alert('Cliente creado exitosamente');
                    this.cargarDatos();
                    this.cerrarModal();
                },
                error: (err) => alert('Error: ' + (err.error?.error || err.message))
            });
        }
    }

    eliminar(cliente: any) {
        if (confirm(`¿Eliminar al cliente "${cliente.clinombre}"?`)) {
            this.api.deleteCliente(cliente.cliid).subscribe({
                next: () => {
                    alert('Cliente eliminado');
                    this.cargarDatos();
                },
                error: (err) => alert('Error: ' + (err.error?.error || err.message))
            });
        }
    }
}
