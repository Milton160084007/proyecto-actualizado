import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface Usuario {
    usuid: number;
    usuusuario: string;
    rolid: number;
    rolnombre: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:3000/api/usuarios';
    private usuarioSubject = new BehaviorSubject<Usuario | null>(this.getStoredUser());
    usuario$ = this.usuarioSubject.asObservable();

    constructor(private http: HttpClient, private router: Router) { }

    private getStoredUser(): Usuario | null {
        const data = localStorage.getItem('usuario');
        return data ? JSON.parse(data) : null;
    }

    get usuario(): Usuario | null {
        return this.usuarioSubject.value;
    }

    get isLoggedIn(): boolean {
        return !!this.usuario;
    }

    get rolNombre(): string {
        return this.usuario?.rolnombre || '';
    }

    login(usuario: string, contrasena: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/login`, { usuario, contrasena }).pipe(
            tap((res: any) => {
                localStorage.setItem('usuario', JSON.stringify(res.usuario));
                this.usuarioSubject.next(res.usuario);
            })
        );
    }

    logout(): void {
        localStorage.removeItem('usuario');
        this.usuarioSubject.next(null);
        this.router.navigate(['/login']);
    }

    // Permisos por rol estandarizados
    tieneAcceso(modulo: string): boolean {
        if (!this.usuario) return false;
        const rol = this.usuario.rolnombre;

        const permisos: Record<string, string[]> = {
            'Administrador': ['dashboard', 'productos', 'categorias', 'movimientos', 'proveedores', 'clientes', 'ventas', 'usuarios', 'reportes', 'compras', 'descuentos', 'configuracion', 'auditoria'],
            // Cajero: SOLO Ventas y Clientes (NO Compras, NO Proveedores, NO Movimientos de bodega)
            'Cajero': ['dashboard', 'ventas', 'clientes'],
            // Bodeguero: SOLO Compras, Inventario, Proveedores (NO Ventas, NO Clientes, NO Reportes financieros)
            'Bodeguero': ['dashboard', 'productos', 'movimientos', 'categorias', 'proveedores', 'compras']
        };

        return permisos[rol]?.includes(modulo) || false;
    }
}
