import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './login.html',
    styleUrl: './login.css'
})
export class Login {
    usuario = '';
    contrasena = '';
    loading = false;
    error = '';

    constructor(private auth: AuthService, private router: Router) {
        // Si ya está logueado, ir al dashboard
        if (this.auth.isLoggedIn) {
            this.router.navigate(['/']);
        }
    }

    onSubmit() {
        if (!this.usuario || !this.contrasena) {
            this.error = 'Ingresa usuario y contraseña';
            return;
        }

        this.loading = true;
        this.error = '';

        this.auth.login(this.usuario, this.contrasena).subscribe({
            next: () => {
                this.loading = false;
                this.router.navigate(['/']);
            },
            error: (err) => {
                // AQUÍ ESTABA EL ERROR: Forzamos a que loading sea false pase lo que pase
                this.loading = false;
                this.error = err.error?.error || 'Usuario o contraseña incorrectos. Verifica tus datos.';
                this.contrasena = ''; // Limpiamos la clave por seguridad
            }
        });
    }
}
