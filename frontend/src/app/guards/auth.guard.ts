import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn) {
        router.navigate(['/login']);
        return false;
    }

    // Check role-based permissions if route has data.modulo
    const modulo = route.data?.['modulo'];
    if (modulo && !auth.tieneAcceso(modulo)) {
        alert('❌ Acceso denegado: No tienes permisos para acceder al módulo de ' + modulo);
        router.navigate(['/']);
        return false;
    }

    return true;
};
