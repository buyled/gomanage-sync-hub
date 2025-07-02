import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGomanage } from '@/hooks/useGomanage';

const syncEntities = [
  {
    name: 'customers',
    displayName: 'Clientes',
    icon: '👥',
    description: 'Sincronizar datos de clientes con Gomanage'
  },
  {
    name: 'products',
    displayName: 'Productos',
    icon: '📦',
    description: 'Sincronizar catálogo de productos'
  },
  {
    name: 'orders',
    displayName: 'Pedidos',
    icon: '📋',
    description: 'Sincronizar pedidos bidireccionales'
  }
];

export default function Sync() {
  const gomanage = useGomanage();
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(true);
  const [syncFrequency, setSyncFrequency] = useState('30');
  const [isSyncing, setIsSyncing] = useState(false);
  const [customProxyUrl, setCustomProxyUrl] = useState('');

  // Manejar sincronización individual
  const handleManualSync = async (entityName: string, entityType: 'customers' | 'products' | 'orders', operation: 'pull' | 'push' = 'pull') => {
    setIsSyncing(true);
    try {
      const result = await gomanage.syncEntity(entityType, operation);
      
      // Agregar al log
      const newLog = {
        id: Date.now(),
        entity: entityType,
        operation,
        status: result.success ? 'success' : 'error',
        recordsProcessed: result.recordsProcessed,
        recordsSuccess: result.recordsSuccess,
        recordsError: result.recordsError,
        timestamp: new Date().toISOString(),
        duration: result.duration,
        errorMessage: result.errorMessage
      };
      
      setSyncLogs(prev => [newLog, ...prev.slice(0, 9)]); // Mantener solo 10 logs
    } catch (error) {
      console.error('Error en sincronización:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Sincronización completa
  const handleFullSync = async () => {
    setIsSyncing(true);
    try {
      for (const entity of syncEntities) {
        await gomanage.syncEntity(entity.name as 'customers' | 'products' | 'orders', 'pull');
        // Pequeña pausa entre sincronizaciones
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Error en sincronización completa:', error);
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
          <Badge className={getStatusConfig(gomanage.isConnected ? 'connected' : 'disconnected').color}>
            <span className="mr-1">{getStatusConfig(gomanage.isConnected ? 'connected' : 'disconnected').icon}</span>
            {getStatusConfig(gomanage.isConnected ? 'connected' : 'disconnected').text}
          </Badge>
          <Button 
            onClick={handleFullSync}
            disabled={isSyncing || gomanage.isLoading}
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
                <div className={`w-3 h-3 rounded-full ${gomanage.isConnected ? 'bg-success' : 'bg-destructive'}`}></div>
                <span className="font-medium text-sm">
                  {gomanage.connectionInfo.proxyUrl || 'No configurado'}
                </span>
              </div>
              {gomanage.error && (
                <div className="text-xs text-destructive">
                  {gomanage.error}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Última conexión</div>
              <div className="font-medium">
                {gomanage.connectionInfo.lastPing 
                  ? formatDateTime(gomanage.connectionInfo.lastPing.toISOString())
                  : 'Nunca'
                }
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Sesión</div>
              <div className="font-medium">
                {gomanage.connectionInfo.sessionId || 'No autenticado'}
              </div>
            </div>
          </div>

          <div className="mt-4 flex space-x-2">
            <Button 
              onClick={gomanage.testConnection}
              disabled={gomanage.isLoading}
              variant="outline"
              size="sm"
            >
              🔍 Probar Conexión
            </Button>
            <Button 
              onClick={gomanage.connect}
              disabled={gomanage.isLoading}
              variant="outline"
              size="sm"
            >
              🔌 Reconectar
            </Button>
            {gomanage.isConnected && (
              <Button 
                onClick={gomanage.disconnect}
                disabled={gomanage.isLoading}
                variant="outline"
                size="sm"
              >
                🔌 Desconectar
              </Button>
            )}
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
                Procesando datos...
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Entities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {syncEntities.map(entity => {
          const statusConfig = getStatusConfig(gomanage.isConnected ? 'connected' : 'disconnected');
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
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleManualSync(`${entity.displayName} (Pull)`, entity.name as 'customers' | 'products' | 'orders', 'pull')}
                    disabled={isSyncing || !gomanage.isConnected}
                  >
                    ⬇️ Pull
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleManualSync(`${entity.displayName} (Push)`, entity.name as 'customers' | 'products' | 'orders', 'push')}
                    disabled={isSyncing || !gomanage.isConnected}
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
                  <Label htmlFor="frequency">Frecuencia (minutos)</Label>
                  <select 
                    id="frequency"
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

              <div className="space-y-2">
                <Label htmlFor="proxyUrl">URL del Proxy (opcional)</Label>
                <div className="flex space-x-2">
                  <Input
                    id="proxyUrl"
                    value={customProxyUrl}
                    onChange={(e) => setCustomProxyUrl(e.target.value)}
                    placeholder="https://tu-proxy.vercel.app/api/gomanage"
                  />
                  <Button 
                    size="sm"
                    onClick={() => {
                      if (customProxyUrl) {
                        // Aquí podrías actualizar la URL del proxy
                        console.log('Actualizando proxy URL:', customProxyUrl);
                      }
                    }}
                    disabled={!customProxyUrl}
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="font-medium">Estadísticas de Hoy</div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-success/10 rounded-lg">
                  <div className="text-2xl font-bold text-success">
                    {syncLogs.filter(log => log.status === 'success').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Exitosas</div>
                </div>
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <div className="text-2xl font-bold text-destructive">
                    {syncLogs.filter(log => log.status === 'error').length}
                  </div>
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
            {syncLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay registros de sincronización aún.
                <br />
                Ejecuta una sincronización para ver los logs aquí.
              </div>
            ) : (
              syncLogs.map(log => (
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
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}