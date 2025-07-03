import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useGomanage } from '@/hooks/useGomanage';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const [config, setConfig] = useState({
    baseUrl: 'http://buyled.clonico.es:8181',
    environment: 'PASOE',
    username: 'distri',
    password: 'GOtmt%',
    timeout: 30000
  });
  const [isLoading, setIsLoading] = useState(false);
  const gomanage = useGomanage();
  const { toast } = useToast();

  const handleTest = async () => {
    setIsLoading(true);
    try {
      await gomanage.testConnection();
      
      toast({
        title: gomanage.isConnected ? "Conexión exitosa" : "Error de conexión",
        description: gomanage.error || "Conexión establecida correctamente",
        variant: gomanage.isConnected ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Configuración de GO!Manage</h1>
        <Badge variant={gomanage.isConnected ? "default" : "destructive"}>
          {gomanage.isConnected ? "Conectado" : "Desconectado"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuración del Servidor Real</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="baseUrl">URL del Servidor</Label>
              <Input
                id="baseUrl"
                value={config.baseUrl}
                onChange={(e) => setConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                placeholder="http://buyled.clonico.es:8181"
                disabled
              />
              <p className="text-xs text-muted-foreground mt-1">
                Servidor configurado según documentación oficial
              </p>
            </div>
            <div>
              <Label htmlFor="environment">Entorno</Label>
              <Input
                id="environment"
                value={config.environment}
                disabled
              />
              <p className="text-xs text-muted-foreground mt-1">
                Entorno PASOE según configuración
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                value={config.username}
                disabled
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={config.password}
                disabled
              />
            </div>
          </div>

          <div>
            <Label htmlFor="timeout">Timeout (ms)</Label>
            <Input
              id="timeout"
              type="number"
              value={config.timeout}
              disabled
            />
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleTest} variant="outline" disabled={isLoading}>
              {isLoading ? "Probando..." : "Probar Conexión"}
            </Button>
            <Button onClick={gomanage.connect} disabled={isLoading || gomanage.isLoading}>
              {gomanage.isLoading ? "Conectando..." : "Reconectar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {gomanage.connectionInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Estado de la Conexión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Servidor</Label>
                <p className="text-sm text-muted-foreground">{gomanage.connectionInfo.proxyUrl}</p>
              </div>
              <div>
                <Label>Último Ping</Label>
                <p className="text-sm text-muted-foreground">
                  {gomanage.connectionInfo.lastPing?.toLocaleString() || 'Nunca'}
                </p>
              </div>
              <div>
                <Label>ID de Sesión</Label>
                <p className="text-sm text-muted-foreground">
                  {gomanage.connectionInfo.sessionId || 'No disponible'}
                </p>
              </div>
              <div>
                <Label>Estado</Label>
                <p className="text-sm text-muted-foreground">
                  {gomanage.isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Información del Servidor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div><strong>Servidor:</strong> buyled.clonico.es:8181</div>
            <div><strong>Endpoint Auth:</strong> /gomanage/static/auth/j_spring_security_check</div>
            <div><strong>Endpoint GraphQL:</strong> /gomanage/web/data/graphql</div>
            <div><strong>Entorno:</strong> PASOE</div>
            <div><strong>Usuario:</strong> distri</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}