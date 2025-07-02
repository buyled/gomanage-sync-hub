// 🚀 Cliente Principal de Gomanage API

import { GomanageConnectionService } from './connection';
import { GomanageDataService } from './dataService';
import { GomanageSyncService } from './syncService';
import type { Customer, Product, Order, SyncResult, ConnectionResult, LoginResult } from './types';

export class GomanageApiClient {
  private connectionService: GomanageConnectionService;
  private dataService: GomanageDataService;
  private syncService: GomanageSyncService;

  constructor() {
    this.connectionService = new GomanageConnectionService();
    this.dataService = new GomanageDataService(this.connectionService);
    this.syncService = new GomanageSyncService();
  }

  // 🔗 Métodos de conexión
  async testConnection(): Promise<ConnectionResult> {
    return this.connectionService.testConnection();
  }

  async login(username?: string, password?: string): Promise<LoginResult> {
    return this.connectionService.login(username, password);
  }

  logout() {
    this.connectionService.logout();
  }

  getConnectionStatus() {
    return this.connectionService.getConnectionStatus();
  }

  updateProxyUrl(newUrl: string) {
    this.connectionService.updateProxyUrl(newUrl);
  }

  // 📊 Métodos de datos
  async getCustomers(): Promise<Customer[]> {
    return this.dataService.getCustomers();
  }

  async getProducts(): Promise<Product[]> {
    return this.dataService.getProducts();
  }

  async getOrders(): Promise<Order[]> {
    return this.dataService.getOrders();
  }

  // 🔄 Métodos de sincronización
  async syncEntity(entityType: 'customers' | 'products' | 'orders', operation: 'pull' | 'push' = 'pull'): Promise<SyncResult> {
    return this.syncService.syncEntity(entityType, operation);
  }
}