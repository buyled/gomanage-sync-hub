import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

// Sample sync logs data
const sampleSyncLogs = [
  {
    id: 1,
    entity: 'customers',
    operation: 'pull',
    status: 'success',
    recordsProcessed: 15,
    recordsSuccess: 15,
    recordsError: 0,
    timestamp: '2024-01-20T10:30:00Z',
    duration: '2.3s',
    errorMessage: null
  },
  {
    id: 2,
    entity: 'products',
    operation: 'pull',
    status: 'success',
    recordsProcessed: 47,
    recordsSuccess: 45,
    recordsError: 2,
    timestamp: '2024-01-20T10:28:00Z',
    duration: '5.7s',
    errorMessage: '2 productos con referencias duplicadas'
  },
  {
    id: 3,
    entity: 'orders',
    operation: 'push',
    status: 'error',
    recordsProcessed: 3,
    recordsSuccess: 2,
    recordsError: 1,
    timestamp: '2024-01-20T10:25:00Z',
    duration: '1.2s',
    errorMessage: 'Error de autenticación en pedido ORD003'
  },
  {
    id: 4,
    entity: 'customers',
    operation: 'push',
    status: 'success',
    recordsProcessed: 8,
    recordsSuccess: 8,
    recordsError: 0,
    timestamp: '2024-01-20T09:45:00Z',
    duration: '1.8s',
    errorMessage: null
  }
];

const syncEntities = [
  {
    name: 'customers',
    displayName: 'Clientes',
    icon: '👥',
    description: 'Sincronizar datos de clientes con Gomanage',
    lastSync: '2024-01-20T10:30:00Z',
    status: 'connected',
    pendingRecords: 3
  },
  {
    name: 'products',
    displayName: 'Productos',
    icon: '📦',
    description: 'Sincronizar catálogo de productos',
    lastSync: '2024-01-20T10:28:00Z',
    status: 'warning',
    pendingRecords: 12
  },
  {
    name: 'orders',
    displayName: 'Pedidos',
    icon: '📋',
    description: 'Sincronizar pedidos bidireccionales',
    lastSync: '2024-01-20T10:25:00Z',
    status: 'error',
    pendingRecords: 5
  }
];

export default function Sync() {
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [syncLogs] = useState(sampleSyncLogs);
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(true);
  const [syncFrequency, setSyncFrequency] = useState('30');
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const handleManualSync = async (entityName: string) => {
    setIsSyncing(true);
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Sincronización completada",
        description: `${entityName} sincronizado correctamente`,
      });
    } catch (error) {
      toast({
        title: "Error en sincronización",
        description: `Error al sincronizar ${entityName}`,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFullSync = async () => {
    setIsSyncing(true);
    try {
      // Simulate full sync
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      toast({
        title: "Sincronización completa finalizada",
        description: "Todos los datos han sido sincronizados",
      });
    } catch (error) {
      toast({
        title: "Error en sincronización completa",
        description: "Ha ocurrido un error durante la sincronización",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'connected':
        return { color: 'bg-success text-success-foreground', text: 'Conectado', icon: '✅' };
      case 'warning':
        return { color: 'bg-warning text-warning-foreground', text: 'Advertencia', icon: '⚠️' };
      case 'error':
        return { color: 'bg-destructive text-destructive-foreground', text: 'Error', icon: '❌' };
      case 'disconnected':
        return { color: 'bg-muted text-muted-foreground', text: 'Desconectado', icon: '🔌' };
      default:
        return { color: 'bg-muted text-muted-foreground', text: 'Desconocido', icon: '❓' };
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLogStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-success text-success-foreground';
      case 'error':
        return 'bg-destructive text-destructive-foreground';
      case 'warning':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Panel de Sincronización</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona la sincronización con Gomanage ERP
          </p>
        </div>
        <div className="mt-4 lg:mt-0 flex items-center space-x-4">
          <Badge className={getStatusConfig(connectionStatus).color}>
            <span className="mr-1">{getStatusConfig(connectionStatus).icon}</span>
            {getStatusConfig(connectionStatus).text}
          </Badge>
          <Button 
            onClick={handleFullSync}
            disabled={isSyncing}
            className="bg-primary hover:bg-primary-hover"
          >
            {isSyncing ? '🔄 Sincronizando...' : '🔄 Sincronizar Todo'}
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🔗</span>
            <span>Estado de Conexión</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Servidor Gomanage</div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-success rounded-full"></div>
                <span className="font-medium">gomanage-proxy.vercel.app</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Última conexión</div>
              <div className="font-medium">Hace 2 minutos</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Próxima sincronización</div>
              <div className="font-medium">En 28 minutos</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Progress */}
      {isSyncing && (
        <Card>
          <CardHeader>
            <CardTitle>Sincronización en Progreso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={65} className="w-full" />
              <div className="text-sm text-muted-foreground">
                Procesando productos... (45/72)
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Entities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {syncEntities.map(entity => {
          const statusConfig = getStatusConfig(entity.status);
          return (
            <Card key={entity.name} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{entity.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{entity.displayName}</CardTitle>
                      <p className="text-sm text-muted-foreground">{entity.description}</p>
                    </div>
                  </div>
                  <Badge className={statusConfig.color}>
                    {statusConfig.icon}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Última sincronización:</span>
                  </div>
                  <div className="text-sm font-medium">
                    {formatDateTime(entity.lastSync)}
                  </div>
                </div>

                {entity.pendingRecords > 0 && (
                  <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
                    <span className="text-sm font-medium">Registros pendientes</span>
                    <Badge variant="outline" className="bg-warning text-warning-foreground">
                      {entity.pendingRecords}
                    </Badge>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleManualSync(`${entity.displayName} (Pull)`)}
                    disabled={isSyncing}
                  >
                    ⬇️ Pull
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleManualSync(`${entity.displayName} (Push)`)}
                    disabled={isSyncing}
                  >
                    ⬆️ Push
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Sincronización</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Sincronización automática</div>
                  <div className="text-sm text-muted-foreground">
                    Ejecutar sincronización periódica
                  </div>
                </div>
                <Button
                  variant={isAutoSyncEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsAutoSyncEnabled(!isAutoSyncEnabled)}
                >
                  {isAutoSyncEnabled ? 'Activado' : 'Desactivado'}
                </Button>
              </div>

              {isAutoSyncEnabled && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Frecuencia (minutos)</label>
                  <select 
                    value={syncFrequency}
                    onChange={(e) => setSyncFrequency(e.target.value)}
                    className="w-full p-2 border border-border rounded-md bg-background"
                  >
                    <option value="15">15 minutos</option>
                    <option value="30">30 minutos</option>
                    <option value="60">1 hora</option>
                    <option value="120">2 horas</option>
                    <option value="240">4 horas</option>
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="font-medium">Estadísticas de Hoy</div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-success/10 rounded-lg">
                  <div className="text-2xl font-bold text-success">47</div>
                  <div className="text-sm text-muted-foreground">Exitosas</div>
                </div>
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <div className="text-2xl font-bold text-destructive">3</div>
                  <div className="text-sm text-muted-foreground">Errores</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Sincronización</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {syncLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Badge className={getLogStatusColor(log.status)}>
                    {log.status === 'success' ? '✅' : log.status === 'error' ? '❌' : '⚠️'}
                  </Badge>
                  <div>
                    <div className="font-medium">
                      {log.entity.charAt(0).toUpperCase() + log.entity.slice(1)} - {log.operation.toUpperCase()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDateTime(log.timestamp)} • Duración: {log.duration}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {log.recordsSuccess}/{log.recordsProcessed} registros
                  </div>
                  {log.errorMessage && (
                    <div className="text-xs text-destructive mt-1">
                      {log.errorMessage}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}