// 🔐 Gestión de Conexión y Autenticación con Gomanage

import type { GomanageConnection, LoginResult, ConnectionResult } from './types';

export class GomanageConnectionService {
  private connection: GomanageConnection = {
    isConnected: false,
    proxyUrl: 'https://ddtbazuwvzshjahjpyek.supabase.co/functions/v1/gomanage-proxy',
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

  // 🔐 Login mejorado con reintentos
  async login(username: string = 'distri', password: string = 'GOtmt%'): Promise<LoginResult> {
    console.log('🔑 Intentando login mejorado:', username);
    
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Intento de login ${attempt}/${maxRetries}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const response = await fetch(
          `${this.connection.proxyUrl}?action=login&sessionId=${encodeURIComponent(username)}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);
        console.log(`📄 Respuesta login intento ${attempt}:`, response.status);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success) {
            this.connection.sessionId = username; // Usar username como sessionId
            this.connection.isConnected = true;
            this.connection.lastPing = new Date();
            
            console.log('✅ Login exitoso en intento', attempt);
            
            return { 
              success: true, 
              sessionId: username, 
              message: data.message || 'Login exitoso'
            };
          } else {
            throw new Error(data.error || 'Login falló');
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Error de respuesta' }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Error desconocido');
        console.error(`❌ Error en intento ${attempt}:`, lastError.message);
        
        // Esperar antes del siguiente intento (excepto en el último)
        if (attempt < maxRetries) {
          const delay = 1000 * attempt; // Incrementar delay
          console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Todos los intentos fallaron
    console.error('❌ Todos los intentos de login fallaron');
    this.connection.sessionId = null;
    this.connection.isConnected = false;
    
    return { 
      success: false, 
      message: `Login falló después de ${maxRetries} intentos: ${lastError?.message || 'Error desconocido'}` 
    };
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