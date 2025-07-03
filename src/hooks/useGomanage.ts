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
    
    console.log('🔄 Estado de conexión actualizado:', {
      isConnected: status.isConnected,
      sessionId: status.sessionId ? 'PRESENTE' : 'AUSENTE',
      lastPing: status.lastPing
    });
  }, []);

  // Conectar a Gomanage
  const connect = useCallback(async () => {
    console.log('🔌 Iniciando proceso de conexión...');
    setIsLoading(true);
    setError(null);
    
    try {
      // Probar conexión primero
      console.log('🔍 Probando conexión...');
      const connectionResult = await gomanageApi.testConnection();
      console.log('📡 Resultado de conexión:', connectionResult);
      
      if (connectionResult.connected) {
        // Hacer login
        console.log('🔑 Intentando login...');
        const loginResult = await gomanageApi.login();
        console.log('🔐 Resultado de login:', loginResult);
        
        if (loginResult.success) {
          // Esperar un momento para que la sesión se propague
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          updateConnectionStatus();
          
          // Verificar que realmente tenemos datos
          console.log('📊 Verificando datos disponibles...');
          try {
            const customers = await gomanageApi.getCustomers();
            console.log(`✅ Verificación exitosa: ${customers.length} clientes disponibles`);
            
            toast({
              title: "Conexión exitosa",
              description: `Conectado a GO!Manage - ${customers.length} clientes disponibles`,
            });
          } catch (dataError) {
            console.warn('⚠️ Conexión establecida pero error obteniendo datos:', dataError);
            toast({
              title: "Conexión parcial",
              description: "Conectado pero algunos datos no están disponibles",
              variant: "destructive",
            });
          }
        } else {
          throw new Error(loginResult.message || 'Error en login');
        }
      } else {
        throw new Error(connectionResult.message || 'Error de conexión');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error de conexión';
      console.error('❌ Error en conexión:', errorMsg);
      setError(errorMsg);
      setIsConnected(false);
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
    console.log('🔌 Desconectando...');
    gomanageApi.logout();
    setIsConnected(false);
    setError(null);
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
    console.log('🧪 Ejecutando test de conexión...');
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await gomanageApi.testConnection();
      console.log('🧪 Resultado del test:', result);
      updateConnectionStatus();
      
      toast({
        title: result.connected ? "Conexión OK" : "Conexión fallida",
        description: result.message,
        variant: result.connected ? "default" : "destructive",
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error de prueba';
      console.error('❌ Error en test:', errorMsg);
      setError(errorMsg);
      toast({
        title: "Error en test",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [updateConnectionStatus, toast]);

  // Obtener clientes
  const fetchCustomers = useCallback(async (): Promise<Customer[]> => {
    console.log('👥 Obteniendo clientes...');
    try {
      const customers = await gomanageApi.getCustomers();
      console.log(`✅ ${customers.length} clientes obtenidos`);
      return customers;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al obtener clientes';
      console.error('❌ Error obteniendo clientes:', errorMsg);
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
    console.log('📦 Obteniendo productos...');
    try {
      const products = await gomanageApi.getProducts();
      console.log(`✅ ${products.length} productos obtenidos`);
      return products;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al obtener productos';
      console.error('❌ Error obteniendo productos:', errorMsg);
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
    console.log('📋 Obteniendo pedidos...');
    try {
      const orders = await gomanageApi.getOrders();
      console.log(`✅ ${orders.length} pedidos obtenidos`);
      return orders;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al obtener pedidos';
      console.error('❌ Error obteniendo pedidos:', errorMsg);
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
    console.log(`🔄 Sincronizando ${entityType} (${operation})...`);
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
      console.error('❌ Error en sincronización:', errorMsg);
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

  // Auto-conectar al montar y verificar estado inicial
  useEffect(() => {
    console.log('🚀 useGomanage: Inicializando...');
    
    // Verificar estado inicial
    updateConnectionStatus();
    
    // Intentar conectar automáticamente
    const autoConnect = async () => {
      console.log('🔄 Auto-conectando...');
      await connect();
    };
    
    autoConnect();
  }, [connect, updateConnectionStatus]);

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