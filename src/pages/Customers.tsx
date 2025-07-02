import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SyncStatus from '@/components/SyncStatus';

// Sample customers data
const sampleCustomers = [
  {
    id: 1,
    gomanageId: 'CUST001',
    name: 'María García López',
    businessName: 'Distribuciones García S.L.',
    vatNumber: 'B12345678',
    email: 'maria@distribuciones-garcia.es',
    phone: '+34 666 123 456',
    city: 'Madrid',
    province: 'Madrid',
    syncStatus: 'synced' as const,
    lastSync: 'hace 10 min',
    totalOrders: 15,
    totalAmount: 45300
  },
  {
    id: 2,
    gomanageId: 'CUST002',
    name: 'Carlos Rodríguez Sánchez',
    businessName: 'Comercial Rodríguez',
    vatNumber: 'B87654321',
    email: 'carlos@comercial-rodriguez.com',
    phone: '+34 666 654 321',
    city: 'Barcelona',
    province: 'Barcelona',
    syncStatus: 'pending' as const,
    lastSync: 'hace 2 horas',
    totalOrders: 8,
    totalAmount: 23100
  },
  {
    id: 3,
    gomanageId: 'CUST003',
    name: 'Ana Martínez Fernández',
    businessName: 'Suministros Martínez',
    vatNumber: 'B11111111',
    email: 'ana@suministros-martinez.es',
    phone: '+34 666 789 123',
    city: 'Valencia',
    province: 'Valencia',
    syncStatus: 'synced' as const,
    lastSync: 'hace 5 min',
    totalOrders: 22,
    totalAmount: 67800
  },
  {
    id: 4,
    gomanageId: null,
    name: 'Juan López Pérez',
    businessName: 'Almacenes López',
    vatNumber: 'B22222222',
    email: 'juan@almacenes-lopez.com',
    phone: '+34 666 456 789',
    city: 'Sevilla',
    province: 'Sevilla',
    syncStatus: 'never' as const,
    lastSync: undefined,
    totalOrders: 0,
    totalAmount: 0
  },
  {
    id: 5,
    gomanageId: 'CUST005',
    name: 'Elena Gómez Torres',
    businessName: 'Distribuidora El Sol',
    vatNumber: 'B33333333',
    email: 'elena@distribuidora-elsol.es',
    phone: '+34 666 321 654',
    city: 'Bilbao',
    province: 'Vizcaya',
    syncStatus: 'error' as const,
    lastSync: 'hace 1 día',
    totalOrders: 12,
    totalAmount: 34500
  }
];

export default function Customers() {
  const [customers] = useState(sampleCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCity = filterCity === 'all' || customer.city === filterCity;
    const matchesStatus = filterStatus === 'all' || customer.syncStatus === filterStatus;
    
    return matchesSearch && matchesCity && matchesStatus;
  });

  const cities = Array.from(new Set(customers.map(c => c.city))).sort();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Administra tu cartera de clientes
          </p>
        </div>
        <Link to="/customers/new">
          <Button className="mt-4 lg:mt-0 bg-primary hover:bg-primary-hover">
            ➕ Nuevo Cliente
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre, empresa o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filterCity} onValueChange={setFilterCity}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filtrar por ciudad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ciudades</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Estado sync" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
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
            <div className="text-2xl font-bold text-foreground">{customers.length}</div>
            <p className="text-sm text-muted-foreground">Total Clientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">
              {customers.filter(c => c.syncStatus === 'synced').length}
            </div>
            <p className="text-sm text-muted-foreground">Sincronizados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">
              {customers.filter(c => c.syncStatus === 'pending').length}
            </div>
            <p className="text-sm text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive">
              {customers.filter(c => c.syncStatus === 'error').length}
            </div>
            <p className="text-sm text-muted-foreground">Con errores</p>
          </CardContent>
        </Card>
      </div>

      {/* Customers List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCustomers.map(customer => (
          <Card key={customer.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {customer.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground font-medium">
                    {customer.businessName}
                  </p>
                </div>
                <SyncStatus 
                  status={customer.syncStatus} 
                  lastSync={customer.lastSync}
                  size="sm"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">📧</span>
                  <span className="text-sm text-muted-foreground truncate">
                    {customer.email}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">📱</span>
                  <span className="text-sm text-muted-foreground">
                    {customer.phone}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">📍</span>
                  <span className="text-sm text-muted-foreground">
                    {customer.city}, {customer.province}
                  </span>
                </div>
                {customer.vatNumber && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">🏢</span>
                    <span className="text-sm text-muted-foreground">
                      {customer.vatNumber}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="text-center">
                  <div className="text-lg font-semibold text-foreground">
                    {customer.totalOrders}
                  </div>
                  <div className="text-xs text-muted-foreground">Pedidos</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-foreground">
                    {formatCurrency(customer.totalAmount)}
                  </div>
                  <div className="text-xs text-muted-foreground">Facturado</div>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <Link to={`/customers/${customer.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    Ver Detalle
                  </Button>
                </Link>
                <Link to={`/orders/new?customer=${customer.id}`} className="flex-1">
                  <Button size="sm" className="w-full bg-success hover:bg-success">
                    Crear Pedido
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No se encontraron clientes
              </h3>
              <p className="text-muted-foreground mb-4">
                No hay clientes que coincidan con los filtros aplicados
              </p>
              <Button onClick={() => {
                setSearchTerm('');
                setFilterCity('all');
                setFilterStatus('all');
              }}>
                Limpiar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}