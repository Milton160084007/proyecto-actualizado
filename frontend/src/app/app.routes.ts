import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./pages/login/login').then(m => m.Login)
    },
    {
        path: '',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard)
    },
    {
        path: 'productos',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/productos/productos').then(m => m.Productos)
    },
    {
        path: 'categorias',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/categorias/categorias').then(m => m.Categorias)
    },
    {
        path: 'movimientos',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/movimientos/movimientos').then(m => m.Movimientos)
    },
    {
        path: 'proveedores',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/proveedores/proveedores').then(m => m.Proveedores)
    },
    {
        path: '**',
        redirectTo: ''
    }
];
