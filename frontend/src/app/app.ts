import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  menuOpen = false;

  constructor(public auth: AuthService) { }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  logout() {
    this.auth.logout();
    this.menuOpen = false;
  }

  getIniciales(): string {
    const nombre = this.auth.usuario?.usuusuario || '';
    return nombre.substring(0, 2).toUpperCase();
  }
}
