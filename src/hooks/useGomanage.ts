import { useState, useEffect, useCallback } from 'react';
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

  // Actualizar estado de conexión
  const updateConnectionStatus = useCallback(() => {
    const status = gomanageApi.getConnectionStatus();
    setIsConnected(status.isConnected);
    setConnectionInfo({
      proxyUrl: status.proxyUrl,
      sessionId: status.sessionId,
      lastPing: status.lastPing
    });
  }, []);

  // Conectar a Gomanage
  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Probar conexión
      const connectionResult = await gomanageApi.testConnection();
      
      if (connectionResult.connected) {
        // Hacer login
        const loginResult = await gomanageApi.login();
        
        if (loginResult.success) {
          // Esperar un momento para que la sesión se propague
          await new Promise(resolve => setTimeout(resolve, 500));
          
          updateConnectionStatus();
          toast({
            title: "Conexión exitosa",
            description: "Conectado a GO!Manage con datos actualizados",
          });
        } else {
          throw new Error('Error en login');
        }
      } else {
        throw new Error(connectionResult.message);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMsg);
      toast({
        title: "Error de conexión",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [updateConnectionStatus, toast]);

  // Desconectar
  const disconnect = useCallback(() => {
    gomanageApi.logout();
    setIsConnected(false);
    setConnectionInfo({
      proxyUrl: '',
      sessionId: null,
      lastPing: null
    });
    toast({
      title: "Desconectado",
      description: "Sesión cerrada correctamente",
    });
  }, [toast]);

  // Test de conexión
  const testConnection = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await gomanageApi.testConnection();
      updateConnectionStatus();
      
      toast({
        title: result.connected ? "Conexión OK" : "Conexión fallida",
        description: result.message,
        variant: result.connected ? "default" : "destructive",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de prueba');
    } finally {
      setIsLoading(false);
    }
  }, [updateConnectionStatus, toast]);

  // Obtener clientes
  const fetchCustomers = useCallback(async (): Promise<Customer[]> => {
    try {
      const customers = await gomanageApi.getCustomers();
      return customers;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al obtener clientes';
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      return [];
    }
  }, [toast]);

  // Obtener productos
  const fetchProducts = useCallback(async (): Promise<Product[]> => {
    try {
      const products = await gomanageApi.getProducts();
      return products;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al obtener productos';
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      return [];
    }
  }, [toast]);

  // Obtener pedidos
  const fetchOrders = useCallback(async (): Promise<Order[]> => {
    try {
      const orders = await gomanageApi.getOrders();
      return orders;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al obtener pedidos';
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      return [];
    }
  }, [toast]);

  // Sincronizar entidad
  const syncEntity = useCallback(async (
    entityType: 'customers' | 'products' | 'orders', 
    operation: 'pull' | 'push' = 'pull'
  ): Promise<SyncResult> => {
    try {
      const result = await gomanageApi.syncEntity(entityType, operation);
      
      toast({
        title: result.success ? "Sincronización exitosa" : "Sincronización con errores",
        description: result.success 
          ? `${result.recordsSuccess} registros sincronizados en ${result.duration}`
          : `${result.recordsError} errores de ${result.recordsProcessed} registros`,
        variant: result.success ? "default" : "destructive",
      });
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error de sincronización';
      toast({
        title: "Error de sincronización",
        description: errorMsg,
        variant: "destructive",
      });
      
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

  // Auto-conectar al montar
  useEffect(() => {
    connect();
  }, [connect]);

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