import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SyncStatus from '@/components/SyncStatus';
import { useGomanage } from '@/hooks/useGomanage';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const salesData = [
  { month: 'Ene', ventas: 45000 },
  { month: 'Feb', ventas: 52000 },
  { month: 'Mar', ventas: 48000 },
  { month: 'Abr', ventas: 61000 },
  { month: 'May', ventas: 58000 },
  { month: 'Jun', ventas: 67000 },
];

const recentActivities = [
  { id: 1, type: 'order', message: 'Nuevo pedido #PED-001 de Empresa ABC', time: 'hace 5 min' },
  { id: 2, type: 'customer', message: 'Cliente "Distribuciones López" actualizado', time: 'hace 15 min' },
  { id: 3, type: 'product', message: 'Stock actualizado para 12 productos', time: 'hace 1 hora' },
  { id: 4, type: 'sync', message: 'Sincronización completada con Gomanage', time: 'hace 2 horas' },
];

const quickActions = [
  { name: 'Nuevo Cliente', href: '/customers/new', icon: '👥', color: 'bg-primary hover:bg-primary-hover' },
  { name: 'Crear Pedido', href: '/orders/new', icon: '📋', color: 'bg-success hover:bg-success' },
  { name: 'Ver Productos', href: '/products', icon: '📦', color: 'bg-warning hover:bg-warning' },
  { name: 'Sincronizar', href: '/sync', icon: '🔄', color: 'bg-sync-pending hover:bg-sync-pending' },
];

export default function Dashboard() {
  const gomanage = useGomanage();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalProducts: 0,
    monthlyOrders: 0,
    monthlySales: 0,
    isLoading: true,
    dataSource: 'Cargando...'
  });

  // Cargar datos una sola vez cuando se conecte
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!gomanage.isConnected || gomanage.isLoading) {
        return;
      }

      console.log('📊 Cargando datos del dashboard...');
      
      try {
        setStats(prev => ({ ...prev, isLoading: true, dataSource: 'Cargando datos reales...' }));

        // Cargar datos en paralelo con timeout
        const timeout = (ms: number) => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), ms)
        );

        const [customers, products, orders] = await Promise.allSettled([
          Promise.race([gomanage.fetchCustomers(), timeout(10000)]),
          Promise.race([gomanage.fetchProducts(), timeout(10000)]),
          Promise.race([gomanage.fetchOrders(), timeout(10000)])
        ]);

        if (!isMounted) return;

        const customersData = customers.status === 'fulfilled' ? (customers.value as any[]) : [];
        const productsData = products.status === 'fulfilled' ? (products.value as any[]) : [];
        const ordersData = orders.status === 'fulfilled' ? (orders.value as any[]) : [];

        // Calcular estadísticas
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyOrders = ordersData.filter(order => {
          try {
            const orderDate = new Date(order.date);
            return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
          } catch {
            return false;
          }
        });

        const monthlySales = monthlyOrders.reduce((sum, order) => {
          return sum + (order.totalAmount || 0);
        }, 0);

        setStats({
          totalCustomers: customersData.length,
          totalProducts: productsData.length,
          monthlyOrders: monthlyOrders.length,
          monthlySales: monthlySales,
          isLoading: false,
          dataSource: 'Datos reales de Gomanage'
        });

        console.log('✅ Dashboard actualizado:', {
          customers: customersData.length,
          products: productsData.length,
          orders: monthlyOrders.length
        });

      } catch (error) {
        if (!isMounted) return;
        
        console.error('❌ Error cargando datos:', error);
        setStats(prev => ({
          ...prev,
          isLoading: false,
          dataSource: 'Error cargando datos'
        }));
      }
    };

    // Solo cargar si está conectado y no está cargando
    if (gomanage.isConnected && !gomanage.isLoading) {
      loadData();
    } else if (!gomanage.isConnected && !gomanage.isLoading) {
      setStats(prev => ({
        ...prev,
        isLoading: false,
        dataSource: 'Desconectado'
      }));
    }

    return () => {
      isMounted = false;
    };
  }, [gomanage.isConnected]); // Solo cuando cambie el estado de conexión

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getConnectionStatusType = (): 'synced' | 'pending' | 'error' | 'never' => {
    if (gomanage.isLoading) return 'pending';
    if (gomanage.error) return 'error';
    if (gomanage.isConnected) return 'synced';
    return 'never';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Resumen de tu negocio en tiempo real
          </p>
        </div>
        <div className="mt-4 lg:mt-0 flex items-center space-x-4">
          <SyncStatus 
            status={getConnectionStatusType()} 
            lastSync={gomanage.connectionInfo.lastPing ? 'Hace 1 min' : undefined}
          />
          {(gomanage.error || !gomanage.isConnected) && (
            <Button 
              onClick={gomanage.connect}
              variant="outline"
              size="sm"
              disabled={gomanage.isLoading}
            >
              {gomanage.isLoading ? '🔄 Conectando...' : '🔄 Conectar'}
            </Button>
          )}
        </div>
      </div>

      {/* Connection Alert */}
      {gomanage.error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <span className="text-destructive">⚠️</span>
              <div>
                <div className="font-medium text-destructive">Error de conexión</div>
                <div className="text-sm text-muted-foreground">{gomanage.error}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Clientes
            </CardTitle>
            <span className="text-2xl">👥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.isLoading ? (
                <div className="animate-pulse bg-muted h-8 w-16 rounded"></div>
              ) : (
                stats.totalCustomers.toLocaleString()
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.dataSource}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Productos
            </CardTitle>
            <span className="text-2xl">📦</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.isLoading ? (
                <div className="animate-pulse bg-muted h-8 w-16 rounded"></div>
              ) : (
                stats.totalProducts.toLocaleString()
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.dataSource}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pedidos del Mes
            </CardTitle>
            <span className="text-2xl">📋</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.isLoading ? (
                <div className="animate-pulse bg-muted h-8 w-16 rounded"></div>
              ) : (
                stats.monthlyOrders
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.dataSource}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ventas del Mes
            </CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.isLoading ? (
                <div className="animate-pulse bg-muted h-8 w-20 rounded"></div>
              ) : (
                formatCurrency(stats.monthlySales)
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.dataSource}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Evolución de Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as number), 'Ventas']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ventas" 
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {activity.message}
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.name} to={action.href}>
                <Button
                  className={`w-full h-20 flex flex-col items-center justify-center space-y-2 ${action.color} text-white transition-all`}
                >
                  <span className="text-2xl">{action.icon}</span>
                  <span className="text-sm font-medium">{action.name}</span>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}