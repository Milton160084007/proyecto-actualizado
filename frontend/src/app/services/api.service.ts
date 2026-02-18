import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private baseUrl = 'http://localhost:3000/api';

    // Caché Observables
    private categorias$: Observable<any> | null = null;
    private proveedores$: Observable<any> | null = null;
    private productos$: Observable<any> | null = null;

    constructor(private http: HttpClient) { }

    // =====================================================
    // HEALTH CHECK
    // =====================================================
    checkHealth(): Observable<any> {
        return this.http.get('http://localhost:3000/health');
    }

    // =====================================================
    // DASHBOARD
    // =====================================================
    getDashboard(): Observable<any> {
        return this.http.get(`${this.baseUrl}/dashboard`);
    }

    // =====================================================
    // CATEGORÍAS
    // =====================================================
    getCategorias(): Observable<any> {
        if (!this.categorias$) {
            this.categorias$ = this.http.get(`${this.baseUrl}/categorias`).pipe(
                shareReplay(1)
            );
        }
        return this.categorias$;
    }

    getCategoria(id: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/categorias/${id}`);
    }

    createCategoria(data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/categorias`, data).pipe(
            tap(() => this.categorias$ = null)
        );
    }

    updateCategoria(id: number, data: any): Observable<any> {
        return this.http.put(`${this.baseUrl}/categorias/${id}`, data).pipe(
            tap(() => this.categorias$ = null)
        );
    }

    deleteCategoria(id: number): Observable<any> {
        return this.http.delete(`${this.baseUrl}/categorias/${id}`).pipe(
            tap(() => this.categorias$ = null)
        );
    }

    // =====================================================
    // PROVEEDORES
    // =====================================================
    getProveedores(): Observable<any> {
        if (!this.proveedores$) {
            this.proveedores$ = this.http.get(`${this.baseUrl}/proveedores`).pipe(
                shareReplay(1)
            );
        }
        return this.proveedores$;
    }

    getProveedor(id: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/proveedores/${id}`);
    }

    createProveedor(data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/proveedores`, data).pipe(
            tap(() => this.proveedores$ = null)
        );
    }

    updateProveedor(id: number, data: any): Observable<any> {
        return this.http.put(`${this.baseUrl}/proveedores/${id}`, data).pipe(
            tap(() => this.proveedores$ = null)
        );
    }

    deleteProveedor(id: number): Observable<any> {
        return this.http.delete(`${this.baseUrl}/proveedores/${id}`).pipe(
            tap(() => this.proveedores$ = null)
        );
    }

    // =====================================================
    // PRODUCTOS
    // =====================================================
    getProductos(fuerzaRecarga = false): Observable<any> {
        if (!this.productos$ || fuerzaRecarga) {
            this.productos$ = this.http.get(`${this.baseUrl}/productos`).pipe(
                shareReplay(1)
            );
        }
        return this.productos$;
    }

    getProducto(id: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/productos/${id}`);
    }

    buscarProductos(termino: string): Observable<any> {
        return this.http.get(`${this.baseUrl}/productos/buscar/${termino}`);
    }

    getProductosStockBajo(): Observable<any> {
        return this.http.get(`${this.baseUrl}/productos/alertas/stock-bajo`);
    }

    getProductosProximosVencer(): Observable<any> {
        return this.http.get(`${this.baseUrl}/productos/alertas/proximos-vencer`);
    }

    createProducto(data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/productos`, data).pipe(
            tap(() => this.productos$ = null)
        );
    }

    updateProducto(id: number, data: any): Observable<any> {
        return this.http.put(`${this.baseUrl}/productos/${id}`, data).pipe(
            tap(() => this.productos$ = null)
        );
    }

    deleteProducto(id: number): Observable<any> {
        return this.http.delete(`${this.baseUrl}/productos/${id}`).pipe(
            tap(() => this.productos$ = null)
        );
    }

    // Proveedores de un producto (M:N)
    asignarProveedorProducto(prodid: number, data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/productos/${prodid}/proveedores`, data);
    }

    quitarProveedorProducto(prodid: number, ppid: number): Observable<any> {
        return this.http.delete(`${this.baseUrl}/productos/${prodid}/proveedores/${ppid}`);
    }

    // =====================================================
    // ENTRADAS (Compras)
    // =====================================================
    getEntradas(): Observable<any> {
        return this.http.get(`${this.baseUrl}/entradas`);
    }

    getEntrada(id: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/entradas/${id}`);
    }

    createEntrada(data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/entradas`, data).pipe(
            tap(() => this.productos$ = null)
        );
    }

    // =====================================================
    // VENTAS (Salidas / Facturación)
    // =====================================================
    getVentas(): Observable<any> {
        return this.http.get(`${this.baseUrl}/ventas`);
    }

    getVenta(id: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/ventas/${id}`);
    }

    createVenta(data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/ventas`, data).pipe(
            tap(() => this.productos$ = null)
        );
    }

    anularVenta(id: number, usuid?: number): Observable<any> {
        return this.http.put(`${this.baseUrl}/ventas/${id}/anular`, { usuid: usuid || 1 }).pipe(
            tap(() => this.productos$ = null)
        );
    }

    // Alias para compatibilidad
    getSalidas(): Observable<any> { return this.getVentas(); }
    getSalida(id: number): Observable<any> { return this.getVenta(id); }
    createSalida(data: any): Observable<any> { return this.createVenta(data); }

    // =====================================================
    // CLIENTES
    // =====================================================
    getClientes(): Observable<any> {
        return this.http.get(`${this.baseUrl}/clientes`);
    }

    getCliente(id: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/clientes/${id}`);
    }

    buscarCliente(cidruc: string): Observable<any> {
        return this.http.get(`${this.baseUrl}/clientes/buscar/${cidruc}`);
    }

    createCliente(data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/clientes`, data);
    }

    updateCliente(id: number, data: any): Observable<any> {
        return this.http.put(`${this.baseUrl}/clientes/${id}`, data);
    }

    deleteCliente(id: number): Observable<any> {
        return this.http.delete(`${this.baseUrl}/clientes/${id}`);
    }

    // =====================================================
    // KARDEX
    // =====================================================
    getKardex(prodid: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/kardex/${prodid}`);
    }

    // =====================================================
    // MOVIMIENTOS
    // =====================================================
    getMovimientos(): Observable<any> {
        return this.http.get(`${this.baseUrl}/movimientos`);
    }

    getMovimientosKardex(prodid: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/movimientos/kardex/${prodid}`);
    }

    registrarAjuste(data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/movimientos/ajuste`, data).pipe(
            tap(() => this.productos$ = null)
        );
    }

    getReporteMovimientos(params: any): Observable<any> {
        const queryParams = new URLSearchParams();
        if (params.fecha_inicio) queryParams.set('fecha_inicio', params.fecha_inicio);
        if (params.fecha_fin) queryParams.set('fecha_fin', params.fecha_fin);
        if (params.tipo) queryParams.set('tipo', params.tipo);
        return this.http.get(`${this.baseUrl}/movimientos/reporte?${queryParams.toString()}`);
    }

    // =====================================================
    // LOTES
    // =====================================================
    getLotes(prodid: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/lotes/${prodid}`);
    }

    // =====================================================
    // ROLES
    // =====================================================
    getRoles(): Observable<any> {
        return this.http.get(`${this.baseUrl}/roles`);
    }

    // =====================================================
    // DESCUENTOS
    // =====================================================
    getDescuentos(): Observable<any> {
        return this.http.get(`${this.baseUrl}/descuentos`);
    }

    getDescuento(id: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/descuentos/${id}`);
    }

    createDescuento(data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/descuentos`, data);
    }

    updateDescuento(id: number, data: any): Observable<any> {
        return this.http.put(`${this.baseUrl}/descuentos/${id}`, data);
    }

    deleteDescuento(id: number): Observable<any> {
        return this.http.delete(`${this.baseUrl}/descuentos/${id}`);
    }

    getDescuentosProducto(prodid: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/descuentos/producto/${prodid}`);
    }

    // =====================================================
    // USUARIOS
    // =====================================================
    login(usuario: string, contrasena: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/usuarios/login`, { usuario, contrasena });
    }

    getUsuarios(): Observable<any> {
        return this.http.get(`${this.baseUrl}/usuarios`);
    }

    createUsuario(data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/usuarios`, data);
    }

    updateUsuario(id: number, data: any): Observable<any> {
        return this.http.put(`${this.baseUrl}/usuarios/${id}`, data);
    }

    cambiarContrasena(id: number, contrasena: string, contrasenaActual?: string): Observable<any> {
        return this.http.put(`${this.baseUrl}/usuarios/${id}/password`, { contrasena, contrasenaActual });
    }

    deleteUsuario(id: number): Observable<any> {
        return this.http.delete(`${this.baseUrl}/usuarios/${id}`);
    }

    // =====================================================
    // REPORTES
    // =====================================================
    getVentasReporte(periodo: 'diario' | 'semanal' | 'mensual'): Observable<any> {
        return this.http.get(`${this.baseUrl}/reportes/ventas/${periodo}`);
    }

    getTopProductos(periodo: 'diario' | 'semanal' | 'mensual' | 'historico'): Observable<any> {
        return this.http.get(`${this.baseUrl}/reportes/top-productos/${periodo}`);
    }

    // =====================================================
    // NOTIFICACIONES (alertas)
    // =====================================================
    getNotificaciones(): Observable<any> {
        return this.http.get(`${this.baseUrl}/productos/alertas/stock-bajo`);
    }

    // =====================================================
    // CONFIGURACION
    // =====================================================
    getConfiguracion(): Observable<any> {
        return this.http.get(`${this.baseUrl}/configuracion`);
    }

    updateConfiguracion(data: any): Observable<any> {
        return this.http.put(`${this.baseUrl}/configuracion`, data);
    }

    // =====================================================
    // AUDITORIA
    // =====================================================
    getAuditoria(limit: number, offset: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/auditoria?limit=${limit}&offset=${offset}`);
    }

    // =====================================================
    // DEVOLUCIONES
    // =====================================================
    getDevoluciones(): Observable<any> {
        return this.http.get(`${this.baseUrl}/devoluciones`);
    }

    createDevolucion(data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/devoluciones`, data);
    }

    // =====================================================
    // BUSQUEDA GLOBAL
    // =====================================================
    busquedaGlobal(query: string): Observable<any> {
        return this.http.get(`${this.baseUrl}/devoluciones/busqueda?q=${encodeURIComponent(query)}`);
    }
}
