import { useState, useEffect, useCallback, useRef } from 'react';
import { gomanageApi, type Customer, type Product, type Order, type SyncResult } from '@/services/gomanage';
import { useToast } from '@/hooks/use-toast';

interface UseGomanageReturn {
  // Estados
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connectionInfo: {
    proxyUrl: string;
    sessionId: string | null;
    lastPing: Date | null;
  };

  // Acciones
  connect: () => Promise<void>;
  disconnect: () => void;
  testConnection: () => Promise<void>;
  
  // Datos
  fetchCustomers: () => Promise<Customer[]>;
  fetchProducts: () => Promise<Product[]>;
  fetchOrders: () => Promise<Order[]>;
  
  // Sincronización
  syncEntity: (entityType: 'customers' | 'products' | 'orders', operation?: 'pull' | 'push') => Promise<SyncResult>;
}

export function useGomanage(): UseGomanageReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionInfo, setConnectionInfo] = useState({
    proxyUrl: '',
    sessionId: null as string | null,
    lastPing: null as Date | null
  });
  
  const { toast } = useToast();
  const hasInitialized = useRef(false);
  const isConnecting = useRef(false);

  // Actualizar estado de conexión (estable)
  const updateConnectionStatus = useCallback(() => {
    try {
      const status = gomanageApi.getConnectionStatus();
      setIsConnected(status.isConnected);
      setConnectionInfo({
        proxyUrl: status.proxyUrl,
        sessionId: status.sessionId,
        lastPing: status.lastPing
      });
    } catch (err) {
      console.error('Error actualizando estado:', err);
    }
  }, []);

  // Conectar a Gomanage (estable)
  const connect = useCallback(async () => {
    if (isConnecting.current) {
      console.log('🔄 Ya hay una conexión en progreso, saltando...');
      return;
    }

    isConnecting.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔌 Iniciando conexión...');
      
      // Test de conexión
      const connectionResult = await gomanageApi.testConnection();
      
      if (connectionResult.connected) {
        // Login
        const loginResult = await gomanageApi.login();
        
        if (loginResult.success) {
          updateConnectionStatus();
          console.log('✅ Conexión exitosa');
        } else {
          throw new Error(loginResult.message || 'Error en login');
        }
      } else {
        throw new Error(connectionResult.message || 'Error de conexión');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error de conexión';
      console.error('❌ Error:', errorMsg);
      setError(errorMsg);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
      isConnecting.current = false;
    }
  }, [updateConnectionStatus]);

  // Desconectar (estable)
  const disconnect = useCallback(() => {
    gomanageApi.logout();
    setIsConnected(false);
    setError(null);
    setConnectionInfo({
      proxyUrl: '',
      sessionId: null,
      lastPing: null
    });
  }, []);

  // Test de conexión (estable)
  const testConnection = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await gomanageApi.testConnection();
      updateConnectionStatus();
      
      if (!result.connected) {
        setError(result.message);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error de prueba';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [updateConnectionStatus]);

  // Obtener clientes (estable)
  const fetchCustomers = useCallback(async (): Promise<Customer[]> => {
    try {
      return await gomanageApi.getCustomers();
    } catch (err) {
      console.error('Error obteniendo clientes:', err);
      return [];
    }
  }, []);

  // Obtener productos (estable)
  const fetchProducts = useCallback(async (): Promise<Product[]> => {
    try {
      return await gomanageApi.getProducts();
    } catch (err) {
      console.error('Error obteniendo productos:', err);
      return [];
    }
  }, []);

  // Obtener pedidos (estable)
  const fetchOrders = useCallback(async (): Promise<Order[]> => {
    try {
      return await gomanageApi.getOrders();
    } catch (err) {
      console.error('Error obteniendo pedidos:', err);
      return [];
    }
  }, []);

  // Sincronizar entidad (estable)
  const syncEntity = useCallback(async (
    entityType: 'customers' | 'products' | 'orders', 
    operation: 'pull' | 'push' = 'pull'
  ): Promise<SyncResult> => {
    try {
      const result = await gomanageApi.syncEntity(entityType, operation);
      
      toast({
        title: result.success ? "Sincronización exitosa" : "Sincronización con errores",
        description: result.success 
          ? `${result.recordsSuccess} registros sincronizados`
          : `${result.recordsError} errores`,
        variant: result.success ? "default" : "destructive",
      });
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error de sincronización';
      
      return {
        success: false,
        recordsProcessed: 0,
        recordsSuccess: 0,
        recordsError: 1,
        errorMessage: errorMsg,
        duration: '0.0s'
      };
    }
  }, [toast]);

  // Inicialización única
  useEffect(() => {
    if (hasInitialized.current) return;
    
    hasInitialized.current = true;
    console.log('🚀 Inicializando useGomanage...');
    
    // Verificar estado inicial
    updateConnectionStatus();
    
    // Auto-conectar solo una vez
    const timer = setTimeout(() => {
      if (!isConnected && !isConnecting.current) {
        connect();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return {
    // Estados
    isConnected,
    isLoading,
    error,
    connectionInfo,
    
    // Acciones
    connect,
    disconnect,
    testConnection,
    
    // Datos
    fetchCustomers,
    fetchProducts,
    fetchOrders,
    
    // Sincronización
    syncEntity
  };
}