// 🔐 Gestión de Conexión y Autenticación con Gomanage

import type { GomanageConnection, LoginResult, ConnectionResult } from './types';

export class GomanageConnectionService {
  private connection: GomanageConnection = {
    isConnected: false,
    proxyUrl: 'https://ddtbazuwvzshjahjpyek.supabase.co/functions/v1/gomanage-proxy',
    lastPing: null,
    sessionId: null
  };

  // 🟢 Test de conexión usando Edge Function
  async testConnection(): Promise<ConnectionResult> {
    console.log('🔍 Probando conexión a través del proxy:', this.connection.proxyUrl);
    
    try {
      const response = await fetch(`${this.connection.proxyUrl}?action=status`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      console.log('📡 Respuesta del proxy:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        this.connection.isConnected = data.gomanageStatus === 'online';
        this.connection.lastPing = new Date();
        
        return { 
          connected: this.connection.isConnected, 
          message: `Proxy: ${data.proxyStatus}, Gomanage: ${data.gomanageStatus}`, 
          url: this.connection.proxyUrl 
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      
      this.connection.isConnected = false;
      return { 
        connected: false, 
        message: `Error: ${error instanceof Error ? error.message : 'Conexión fallida'}`, 
        url: this.connection.proxyUrl 
      };
    }
  }

  // 🔐 Login usando Edge Function como proxy
  async login(username: string = 'distri', password: string = 'GOtmt%'): Promise<LoginResult> {
    console.log('🔑 Intentando login a través del proxy:', username);
    
    try {
      const response = await fetch(`${this.connection.proxyUrl}?action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      console.log('📄 Respuesta login:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          this.connection.sessionId = data.sessionId;
          this.connection.isConnected = true;
          console.log('✅ Login exitoso, sessionId:', data.sessionId);
          
          return { 
            success: true, 
            sessionId: data.sessionId, 
            message: data.message 
          };
        } else {
          throw new Error(data.error);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login falló');
      }
    } catch (error) {
      console.error('❌ Error de login:', error);
      this.connection.sessionId = null;
      this.connection.isConnected = false;
      return { 
        success: false, 
        message: `Login falló: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      };
    }
  }

  // 📊 Hacer petición a través del proxy
  async proxyRequest(endpoint: string): Promise<any> {
    console.log('📊 Haciendo petición proxy a:', endpoint);
    
    try {
      if (!this.connection.sessionId) {
        const loginResult = await this.login();
        if (!loginResult.success) {
          throw new Error(`Login falló: ${loginResult.message}`);
        }
      }

      const response = await fetch(
        `${this.connection.proxyUrl}?action=proxy&endpoint=${encodeURIComponent(endpoint)}&sessionId=${this.connection.sessionId}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      console.log('📄 Respuesta proxy:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('📋 Datos recibidos del proxy:', result.data);
          return result.data;
        } else {
          throw new Error(result.error);
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ Error en proxy request ${endpoint}:`, error);
      throw error;
    }
  }

  // 🔧 Utilidades de conexión
  getConnectionStatus() {
    return {
      isConnected: this.connection.isConnected,
      sessionId: this.connection.sessionId,
      lastPing: this.connection.lastPing,
      proxyUrl: this.connection.proxyUrl
    };
  }

  updateProxyUrl(newUrl: string) {
    this.connection.proxyUrl = newUrl;
    this.connection.isConnected = false;
    this.connection.sessionId = null;
  }

  logout() {
    if (this.connection.sessionId) {
      // Llamar al endpoint de logout del proxy
      fetch(`${this.connection.proxyUrl}?action=logout&sessionId=${this.connection.sessionId}`)
        .catch(console.error);
    }
    this.connection.sessionId = null;
    this.connection.isConnected = false;
    localStorage.removeItem('gomanage_session');
  }
}