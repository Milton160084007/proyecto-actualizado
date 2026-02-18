import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-auditoria',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './auditoria.html',
    styleUrls: ['./auditoria.css']
})
export class AuditoriaComponent implements OnInit {
    logs: any[] = [];
    total = 0;
    pagina = 0;
    limit = 30;
    loading = true;

    constructor(private api: ApiService) { }

    ngOnInit() { this.cargar(); }

    cargar() {
        this.loading = true;
        this.api.getAuditoria(this.limit, this.pagina * this.limit).subscribe({
            next: (res) => { this.logs = res.data; this.total = res.total; this.loading = false; },
            error: () => this.loading = false
        });
    }

    siguiente() { this.pagina++; this.cargar(); }
    anterior() { if (this.pagina > 0) { this.pagina--; this.cargar(); } }

    getBadge(accion: string): string {
        const map: Record<string, string> = {
            'CREATE': 'badge-success', 'UPDATE': 'badge-warning',
            'DELETE': 'badge-danger', 'LOGIN': 'badge-info'
        };
        return map[accion] || 'badge-secondary';
    }
}
