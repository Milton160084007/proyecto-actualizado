import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-configuracion',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './configuracion.html',
    styleUrls: ['./configuracion.css']
})
export class ConfiguracionComponent implements OnInit {
    config: any = {
        confnombre_empresa: '', confruc: '', confdireccion: '',
        conftelefono: '', confiva_porcentaje: 15, confmoneda: 'USD'
    };
    loading = true;
    guardando = false;
    mensaje = '';

    constructor(private api: ApiService) { }

    ngOnInit() {
        this.api.getConfiguracion().subscribe({
            next: (data) => { this.config = data; this.loading = false; },
            error: () => this.loading = false
        });
    }

    guardar() {
        this.guardando = true;
        this.mensaje = '';
        this.api.updateConfiguracion(this.config).subscribe({
            next: () => {
                this.mensaje = '✅ Configuración guardada exitosamente. Recargando sistema...';
                this.guardando = false;
                // Recargamos para que el IVA nuevo se aplique a Ventas y Compras
                setTimeout(() => window.location.reload(), 1500);
            },
            error: (err) => {
                this.mensaje = '❌ Error: ' + (err.error?.error || err.message);
                this.guardando = false;
            }
        });
    }
}
