import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
    productos: any[] = [];
    stockBajo: any[] = [];
    proximosVencer: any[] = [];
    movimientosRecientes: any[] = [];
    ventasHoy = 0;

    resumen = {
        totalProductos: 0,
        valorInventario: 0,
        alertasStock: 0,
        movimientosHoy: 0
    };

    loading = true;
    apiStatus = 'Verificando...';

    constructor(private api: ApiService) { }

    ngOnInit() {
        this.cargarDatos();
        this.verificarAPI();
        this.cargarVentasHoy();
    }

    async verificarAPI() {
        this.api.checkHealth().subscribe({
            next: (res) => {
                this.apiStatus = res.database === 'Connected' ? 'Conectado' : 'Desconectado';
            },
            error: () => {
                this.apiStatus = 'API no disponible';
            }
        });
    }

    cargarVentasHoy() {
        this.api.getVentas().subscribe({
            next: (ventas) => {
                const hoy = new Date().toISOString().split('T')[0];
                this.ventasHoy = ventas.filter((v: any) =>
                    v.salfecha?.startsWith(hoy) || v.karfecha?.startsWith(hoy)
                ).length;
            },
            error: () => { this.ventasHoy = 0; }
        });
    }

    cargarDatos() {
        this.loading = true;

        this.api.getDashboard().subscribe({
            next: (data) => {
                this.resumen = {
                    totalProductos: data.totalProductos,
                    valorInventario: data.valorInventario,
                    alertasStock: data.alertasStockBajo,
                    movimientosHoy: data.productosProximosVencer
                };

                // Listas de alertas
                this.stockBajo = data.stockBajoLista;
                this.proximosVencer = data.proximosVencerLista;

                // Combinar últimas entradas y salidas para la tabla de movimientos recientes
                const entradas = data.ultimasEntradas.map((e: any) => ({
                    tipo: 'ENTRADA',
                    fecha: e.entfecha,
                    detalle: `Compra a ${e.provnombre || 'Proveedor'}`,
                    total: e.enttotal
                }));

                const salidas = data.ultimasSalidas.map((s: any) => ({
                    tipo: 'SALIDA',
                    fecha: s.salfecha,
                    detalle: `Venta ${s.salnumero}`,
                    total: s.saltotal
                }));

                this.movimientosRecientes = [...entradas, ...salidas]
                    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                    .slice(0, 5);

                this.loading = false;
            },
            error: (err) => {
                console.error('Error cargando dashboard:', err);
                this.loading = false;
            }
        });
    }
}
