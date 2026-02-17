import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-usuarios',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './usuarios.html',
    styleUrls: ['./usuarios.css']
})
export class UsuariosComponent implements OnInit {
    usuarios: any[] = [];
    roles: any[] = [];
    loading = false;

    // Modal
    modalOpen = false;
    editando = false;
    usuarioActual: any = this.nuevoUsuario();

    // Modal cambiar contraseña
    modalPasswordOpen = false;
    passwordUsuarioId: number | null = null;
    passwordUsuarioNombre = '';
    nuevaContrasena = '';
    confirmarContrasena = '';

    constructor(private api: ApiService) { }

    ngOnInit() {
        this.cargarDatos();
    }

    nuevoUsuario() {
        return {
            usuid: null,
            usuusuario: '',
            contrasena: '',
            rolid: null
        };
    }

    cargarDatos() {
        this.loading = true;

        this.api.getUsuarios().subscribe({
            next: (data) => {
                this.usuarios = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error cargando usuarios:', err);
                this.loading = false;
            }
        });

        this.api.getRoles().subscribe({
            next: (data) => this.roles = data,
            error: (err) => console.error('Error cargando roles:', err)
        });
    }

    getRolNombre(rolid: number): string {
        const rol = this.roles.find(r => r.rolid === rolid);
        return rol ? rol.rolnombre : '-';
    }

    getRolClass(rolnombre: string): string {
        switch (rolnombre) {
            case 'Administrador': return 'badge-admin';
            case 'Cajero': return 'badge-cajero';
            case 'Bodeguero': return 'badge-bodeguero';
            default: return '';
        }
    }

    // --- Modal Crear/Editar ---
    abrirModal(usuario?: any) {
        if (usuario) {
            this.editando = true;
            this.usuarioActual = {
                usuid: usuario.usuid,
                usuusuario: usuario.usuusuario,
                contrasena: '',
                rolid: usuario.rolid
            };
        } else {
            this.editando = false;
            this.usuarioActual = this.nuevoUsuario();
        }
        this.modalOpen = true;
    }

    cerrarModal() {
        this.modalOpen = false;
        this.usuarioActual = this.nuevoUsuario();
    }

    guardar() {
        if (!this.usuarioActual.usuusuario || !this.usuarioActual.rolid) {
            alert('Complete los campos obligatorios');
            return;
        }

        if (this.editando) {
            // Actualizar usuario (nombre y rol)
            this.api.updateUsuario(this.usuarioActual.usuid, {
                rolid: this.usuarioActual.rolid,
                usuario: this.usuarioActual.usuusuario
            }).subscribe({
                next: () => {
                    alert('Usuario actualizado exitosamente');
                    this.cargarDatos();
                    this.cerrarModal();
                },
                error: (err) => alert('Error: ' + (err.error?.error || err.message))
            });
        } else {
            // Crear nuevo usuario
            if (!this.usuarioActual.contrasena) {
                alert('La contraseña es obligatoria para nuevos usuarios');
                return;
            }
            this.api.createUsuario({
                rolid: this.usuarioActual.rolid,
                usuario: this.usuarioActual.usuusuario,
                contrasena: this.usuarioActual.contrasena
            }).subscribe({
                next: () => {
                    alert('Usuario creado exitosamente');
                    this.cargarDatos();
                    this.cerrarModal();
                },
                error: (err) => alert('Error: ' + (err.error?.error || err.message))
            });
        }
    }

    // --- Modal Cambiar Contraseña ---
    abrirModalPassword(usuario: any) {
        this.passwordUsuarioId = usuario.usuid;
        this.passwordUsuarioNombre = usuario.usuusuario;
        this.nuevaContrasena = '';
        this.confirmarContrasena = '';
        this.modalPasswordOpen = true;
    }

    cerrarModalPassword() {
        this.modalPasswordOpen = false;
        this.passwordUsuarioId = null;
        this.nuevaContrasena = '';
        this.confirmarContrasena = '';
    }

    cambiarContrasena() {
        if (!this.nuevaContrasena) {
            alert('Ingrese la nueva contraseña');
            return;
        }
        if (this.nuevaContrasena !== this.confirmarContrasena) {
            alert('Las contraseñas no coinciden');
            return;
        }
        if (this.nuevaContrasena.length < 5) {
            alert('La contraseña debe tener al menos 5 caracteres');
            return;
        }

        this.api.cambiarContrasena(this.passwordUsuarioId!, this.nuevaContrasena).subscribe({
            next: () => {
                alert('Contraseña actualizada exitosamente');
                this.cerrarModalPassword();
            },
            error: (err) => alert('Error: ' + (err.error?.error || err.message))
        });
    }

    // --- Eliminar ---
    eliminar(usuario: any) {
        if (usuario.usuid === 1) {
            alert('No se puede eliminar al administrador principal');
            return;
        }
        if (confirm(`¿Eliminar al usuario "${usuario.usuusuario}"?`)) {
            this.api.deleteUsuario(usuario.usuid).subscribe({
                next: () => {
                    alert('Usuario eliminado');
                    this.cargarDatos();
                },
                error: (err) => alert('Error: ' + (err.error?.error || err.message))
            });
        }
    }
}
