import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  menuOpen = false;
  notificaciones: any[] = [];
  notifOpen = false;

  constructor(public auth: AuthService, private api: ApiService) { }

  ngOnInit() {
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

  toggleNotif() {
    this.notifOpen = !this.notifOpen;
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  logout() {
    this.auth.logout();
    this.menuOpen = false;
    this.notifOpen = false;
  }

  getIniciales(): string {
    const nombre = this.auth.usuario?.usuusuario || '';
    return nombre.substring(0, 2).toUpperCase();
  }
}
