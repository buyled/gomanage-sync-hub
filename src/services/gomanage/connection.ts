// 🔐 Gestión de Conexión y Autenticación con Gomanage

import type { GomanageConnection, LoginResult, ConnectionResult } from './types';

export class GomanageConnectionService {
  private connection: GomanageConnection = {
    isConnected: false,
    proxyUrl: '/api/gomanage',
    lastPing: null,
    sessionId: null
  };

  // 🟢 Test de conexión mejorado
  async testConnection(): Promise<ConnectionResult> {
    console.log('🔍 Probando conexión a través del proxy mejorado...');
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(`${this.connection.proxyUrl}?action=status`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('📡 Respuesta del proxy:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        this.connection.isConnected = data.gomanageStatus === 'online';
        this.connection.lastPing = new Date();
        
        console.log('✅ Estado del proxy:', data);
        
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
      
      let errorMessage = 'Conexión fallida';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Timeout de conexión (10s)';
        } else {
          errorMessage = error.message;
        }
      }
      
      return { 
        connected: false, 
        message: `Error: ${errorMessage}`, 
        url: this.connection.proxyUrl 
      };
    }
  }

  // 🔐 Login PASOE según documentación oficial
  async login(username: string = 'distri', password: string = 'GOtmt%'): Promise<LoginResult> {
    console.log('🔑 Intentando login PASOE:', username);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      // Preparar datos del formulario para PASOE
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch(
        `${this.connection.proxyUrl}/gomanage/static/auth/j_spring_security_check`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: formData,
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);
      console.log('📄 Respuesta login PASOE:', response.status);
      
      if (response.ok) {
        // Para PASOE, verificar si tenemos cookies de sesión
        const cookies = response.headers.get('set-cookie');
        
        if (cookies && (cookies.includes('JSESSIONID') || cookies.includes('SPRING_SECURITY'))) {
          this.connection.sessionId = username;
          this.connection.isConnected = true;
          this.connection.lastPing = new Date();
          
          console.log('✅ Login PASOE exitoso');
          
          return { 
            success: true, 
            sessionId: username, 
            message: 'Login PASOE exitoso'
          };
        } else {
          throw new Error('No se recibieron cookies de sesión');
        }
      } else if (response.status === 401) {
        throw new Error('Credenciales inválidas');
      } else {
        throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Error en login PASOE:', error);
      this.connection.sessionId = null;
      this.connection.isConnected = false;
      
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  // 📊 Hacer petición a través del proxy mejorado
  async proxyRequest(endpoint: string): Promise<any> {
    console.log('📊 Haciendo petición proxy mejorada a:', endpoint);
    
    try {
      // Asegurar que tenemos sesión válida
      if (!this.connection.sessionId) {
        console.log('🔑 No hay sesión, haciendo login automático...');
        const loginResult = await this.login();
        if (!loginResult.success) {
          throw new Error(`Login automático falló: ${loginResult.message}`);
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout para datos

      const response = await fetch(
        `${this.connection.proxyUrl}?action=proxy&endpoint=${encodeURIComponent(endpoint)}&sessionId=${encodeURIComponent(this.connection.sessionId)}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);
      console.log('📄 Respuesta proxy:', response.status);

      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          console.log('✅ Datos recibidos exitosamente');
          this.connection.lastPing = new Date();
          return result.data;
        } else {
          // Si necesita reautenticación, intentar una vez más
          if (result.needsReauth) {
            console.log('🔄 Necesita reautenticación, intentando login...');
            this.connection.sessionId = null;
            const loginResult = await this.login();
            
            if (loginResult.success) {
              // Reintentar la petición original
              return this.proxyRequest(endpoint);
            }
          }
          
          throw new Error(result.error || 'Error en proxy');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ Error en proxy request ${endpoint}:`, error);
      
      // Si es timeout, dar mensaje específico
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Timeout en petición de datos (20s)');
      }
      
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
    console.log('🔧 Proxy URL actualizada:', newUrl);
  }

  logout() {
    if (this.connection.sessionId) {
      // Llamar al endpoint de logout del proxy
      fetch(`${this.connection.proxyUrl}?action=logout&sessionId=${encodeURIComponent(this.connection.sessionId)}`)
        .catch(console.error);
    }
    
    this.connection.sessionId = null;
    this.connection.isConnected = false;
    console.log('👋 Sesión cerrada');
  }
}