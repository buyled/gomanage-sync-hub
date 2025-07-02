import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SyncStatus from '@/components/SyncStatus';

// Sample orders data
const sampleOrders = [
  {
    id: 1,
    gomanageId: 'ORD001',
    orderNumber: 'PED-2024-001',
    reference: 'REF-001',
    date: '2024-01-15',
    status: 'confirmed',
    customerName: 'María García López',
    customerBusiness: 'Distribuciones García S.L.',
    amount: 1299.98,
    taxAmount: 272.99,
    shippingCost: 15.00,
    totalAmount: 1587.97,
    itemsCount: 2,
    syncStatus: 'synced' as const,
    lastSync: 'hace 5 min',
    paymentMethod: 'Transferencia bancaria'
  },
  {
    id: 2,
    gomanageId: 'ORD002',
    orderNumber: 'PED-2024-002',
    reference: 'REF-002',
    date: '2024-01-16',
    status: 'pending',
    customerName: 'Carlos Rodríguez Sánchez',
    customerBusiness: 'Comercial Rodríguez',
    amount: 599.98,
    taxAmount: 125.99,
    shippingCost: 10.00,
    totalAmount: 735.97,
    itemsCount: 3,
    syncStatus: 'pending' as const,
    lastSync: 'hace 30 min',
    paymentMethod: 'Tarjeta de crédito'
  },
  {
    id: 3,
    gomanageId: 'ORD003',
    orderNumber: 'PED-2024-003',
    reference: 'REF-003',
    date: '2024-01-17',
    status: 'shipped',
    customerName: 'Ana Martínez Fernández',
    customerBusiness: 'Suministros Martínez',
    amount: 2199.97,
    taxAmount: 461.99,
    shippingCost: 25.00,
    totalAmount: 2686.96,
    itemsCount: 5,
    syncStatus: 'synced' as const,
    lastSync: 'hace 10 min',
    paymentMethod: 'Transferencia bancaria'
  },
  {
    id: 4,
    gomanageId: null,
    orderNumber: 'PED-2024-004',
    reference: 'REF-004',
    date: '2024-01-18',
    status: 'draft',
    customerName: 'Juan López Pérez',
    customerBusiness: 'Almacenes López',
    amount: 899.99,
    taxAmount: 188.99,
    shippingCost: 12.00,
    totalAmount: 1100.98,
    itemsCount: 1,
    syncStatus: 'never' as const,
    lastSync: undefined,
    paymentMethod: 'Contado'
  },
  {
    id: 5,
    gomanageId: 'ORD005',
    orderNumber: 'PED-2024-005',
    reference: 'REF-005',
    date: '2024-01-19',
    status: 'delivered',
    customerName: 'Elena Gómez Torres',
    customerBusiness: 'Distribuidora El Sol',
    amount: 1599.95,
    taxAmount: 335.99,
    shippingCost: 20.00,
    totalAmount: 1955.94,
    itemsCount: 4,
    syncStatus: 'synced' as const,
    lastSync: 'hace 2 min',
    paymentMethod: 'Transferencia bancaria'
  },
  {
    id: 6,
    gomanageId: 'ORD006',
    orderNumber: 'PED-2024-006',
    reference: 'REF-006',
    date: '2024-01-20',
    status: 'cancelled',
    customerName: 'Pedro Sánchez Ruiz',
    customerBusiness: 'Tecnología Sánchez',
    amount: 449.99,
    taxAmount: 94.49,
    shippingCost: 8.00,
    totalAmount: 552.48,
    itemsCount: 2,
    syncStatus: 'error' as const,
    lastSync: 'hace 1 día',
    paymentMethod: 'PayPal'
  }
];

export default function Orders() {
  const [orders] = useState(sampleOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSyncStatus, setFilterSyncStatus] = useState('all');

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerBusiness.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.reference.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSyncStatus = filterSyncStatus === 'all' || order.syncStatus === filterSyncStatus;
    
    return matchesSearch && matchesStatus && matchesSyncStatus;
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'draft':
        return { color: 'bg-muted text-muted-foreground', text: 'Borrador', icon: '📝' };
      case 'pending':
        return { color: 'bg-warning text-warning-foreground', text: 'Pendiente', icon: '⏳' };
      case 'confirmed':
        return { color: 'bg-primary text-primary-foreground', text: 'Confirmado', icon: '✅' };
      case 'shipped':
        return { color: 'bg-sync-pending text-warning-foreground', text: 'Enviado', icon: '🚚' };
      case 'delivered':
        return { color: 'bg-success text-success-foreground', text: 'Entregado', icon: '📦' };
      case 'cancelled':
        return { color: 'bg-destructive text-destructive-foreground', text: 'Cancelado', icon: '❌' };
      default:
        return { color: 'bg-muted text-muted-foreground', text: 'Desconocido', icon: '❓' };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Pedidos</h1>
          <p className="text-muted-foreground mt-1">
            Administra todos los pedidos de tus clientes
          </p>
        </div>
        <Link to="/orders/new">
          <Button className="mt-4 lg:mt-0 bg-primary hover:bg-primary-hover">
            ➕ Nuevo Pedido
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Input
              placeholder="Buscar por número, cliente o referencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Estado del pedido" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="shipped">Enviado</SelectItem>
                <SelectItem value="delivered">Entregado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSyncStatus} onValueChange={setFilterSyncStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Estado sincronización" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="synced">Sincronizado</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="never">No sincronizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">{orders.length}</div>
            <p className="text-sm text-muted-foreground">Total Pedidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">
              {orders.filter(o => ['pending', 'confirmed'].includes(o.status)).length}
            </div>
            <p className="text-sm text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">
              {orders.filter(o => o.status === 'delivered').length}
            </div>
            <p className="text-sm text-muted-foreground">Entregados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(orders.reduce((sum, order) => sum + order.totalAmount, 0))}
            </div>
            <p className="text-sm text-muted-foreground">Facturación Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map(order => {
          const statusConfig = getStatusConfig(order.status);
          return (
            <Card key={order.id} className="hover:shadow-lg transition-all duration-200">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  {/* Order Info */}
                  <div className="lg:col-span-3">
                    <div className="font-semibold text-foreground text-lg">
                      {order.orderNumber}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Ref: {order.reference}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(order.date)}
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="lg:col-span-3">
                    <div className="font-medium text-foreground">
                      {order.customerName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.customerBusiness}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.paymentMethod}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="lg:col-span-2 text-center">
                    <div className="text-lg font-bold text-foreground">
                      {formatCurrency(order.totalAmount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.itemsCount} artículo{order.itemsCount !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="lg:col-span-2 space-y-2">
                    <Badge className={`${statusConfig.color} w-full justify-center`}>
                      <span className="mr-1">{statusConfig.icon}</span>
                      {statusConfig.text}
                    </Badge>
                    <SyncStatus 
                      status={order.syncStatus} 
                      lastSync={order.lastSync}
                      size="sm"
                    />
                  </div>

                  {/* Actions */}
                  <div className="lg:col-span-2 flex flex-col space-y-2">
                    <Link to={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        Ver Detalle
                      </Button>
                    </Link>
                    {order.status === 'pending' && (
                      <Button size="sm" className="w-full bg-success hover:bg-success">
                        Confirmar
                      </Button>
                    )}
                    {order.status === 'confirmed' && (
                      <Button size="sm" className="w-full bg-warning hover:bg-warning">
                        Marcar Enviado
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No se encontraron pedidos
              </h3>
              <p className="text-muted-foreground mb-4">
                No hay pedidos que coincidan con los filtros aplicados
              </p>
              <div className="flex justify-center space-x-4">
                <Button onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterSyncStatus('all');
                }}>
                  Limpiar Filtros
                </Button>
                <Link to="/orders/new">
                  <Button className="bg-primary hover:bg-primary-hover">
                    Crear Primer Pedido
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}