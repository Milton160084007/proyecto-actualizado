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
        data: { modulo: 'productos' },
        loadComponent: () => import('./pages/productos/productos').then(m => m.Productos)
    },
    {
        path: 'categorias',
        canActivate: [authGuard],
        data: { modulo: 'categorias' },
        loadComponent: () => import('./pages/categorias/categorias').then(m => m.Categorias)
    },
    {
        path: 'movimientos',
        canActivate: [authGuard],
        data: { modulo: 'movimientos' },
        loadComponent: () => import('./pages/movimientos/movimientos').then(m => m.Movimientos)
    },
    {
        path: 'proveedores',
        canActivate: [authGuard],
        data: { modulo: 'proveedores' },
        loadComponent: () => import('./pages/proveedores/proveedores').then(m => m.Proveedores)
    },
    {
        path: 'reportes',
        canActivate: [authGuard],
        data: { modulo: 'reportes' },
        loadComponent: () => import('./pages/reportes/reportes').then(m => m.ReportesComponent)
    },
    {
        path: 'usuarios',
        canActivate: [authGuard],
        data: { modulo: 'usuarios' },
        loadComponent: () => import('./pages/usuarios/usuarios').then(m => m.UsuariosComponent)
    },
    {
        path: 'ventas',
        canActivate: [authGuard],
        data: { modulo: 'ventas' },
        loadComponent: () => import('./pages/ventas/ventas').then(m => m.VentasComponent)
    },
    {
        path: 'clientes',
        canActivate: [authGuard],
        data: { modulo: 'clientes' },
        loadComponent: () => import('./pages/clientes/clientes').then(m => m.ClientesComponent)
    },
    {
        path: 'compras',
        canActivate: [authGuard],
        data: { modulo: 'compras' },
        loadComponent: () => import('./pages/compras/compras').then(m => m.ComprasComponent)
    },
    {
        path: 'descuentos',
        canActivate: [authGuard],
        data: { modulo: 'descuentos' },
        loadComponent: () => import('./pages/descuentos/descuentos').then(m => m.DescuentosComponent)
    },
    {
        path: '**',
        redirectTo: ''
    }
];
