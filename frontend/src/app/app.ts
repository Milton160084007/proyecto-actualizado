import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from './services/auth.service';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  menuOpen = false;
  notificaciones: any[] = [];
  notifOpen = false;
  darkMode = false;

  // Global Search
  searchOpen = false;
  searchQuery = '';
  searchResults: any = { productos: [], clientes: [], ventas: [] };
  searchLoading = false;

  constructor(public auth: AuthService, private api: ApiService, private router: Router) { }

  ngOnInit() {
    // Dark mode from localStorage
    this.darkMode = localStorage.getItem('darkMode') === 'true';
    this.applyTheme();

    if (this.auth.isLoggedIn) {
      this.cargarNotificaciones();
    }
    this.auth.usuario$.subscribe(user => {
      if (user) this.cargarNotificaciones();
      else this.notificaciones = [];
    });
  }

  cargarNotificaciones() {
    this.api.getProductosStockBajo().subscribe({
      next: (data) => this.notificaciones = data || [],
      error: () => this.notificaciones = []
    });
  }

  toggleNotif() { this.notifOpen = !this.notifOpen; this.searchOpen = false; }

  toggleMenu() { this.menuOpen = !this.menuOpen; }

  logout() {
    this.auth.logout();
    this.menuOpen = false;
    this.notifOpen = false;
  }

  getIniciales(): string {
    const nombre = this.auth.usuario?.usuusuario || '';
    return nombre.substring(0, 2).toUpperCase();
  }

  // ======= Dark Mode =======
  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    localStorage.setItem('darkMode', String(this.darkMode));
    this.applyTheme();
  }

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.darkMode ? 'dark' : 'light');
  }

  // ======= Global Search =======
  toggleSearch() { this.searchOpen = !this.searchOpen; this.notifOpen = false; }

  buscar() {
    if (!this.searchQuery.trim()) { this.searchResults = { productos: [], clientes: [], ventas: [] }; return; }
    this.searchLoading = true;
    this.api.busquedaGlobal(this.searchQuery).subscribe({
      next: (res) => { this.searchResults = res; this.searchLoading = false; },
      error: () => this.searchLoading = false
    });
  }

  irA(tipo: string, id: number) {
    this.searchOpen = false;
    this.searchQuery = '';
    if (tipo === 'producto') this.router.navigate(['/productos']);
    else if (tipo === 'cliente') this.router.navigate(['/clientes']);
    else if (tipo === 'venta') this.router.navigate(['/ventas']);
  }
}
