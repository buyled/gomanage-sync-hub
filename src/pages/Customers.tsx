import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SyncStatus from '@/components/SyncStatus';
import type { Customer } from '@/services/gomanage';

// 🎭 Datos de ejemplo para testing
const sampleCustomers: Customer[] = [
  {
    id: '1',
    gomanageId: '1001',
    name: 'María García López',
    businessName: 'Distribuciones García S.L.',
    vatNumber: 'B12345678',
    email: 'maria@distribuciones-garcia.es',
    phone: '+34 915 123 456',
    city: 'Madrid',
    province: 'Madrid',
    syncStatus: 'synced',
    lastSync: 'hace 5 min',
    totalOrders: 23,
    totalAmount: 15420.50
  },
  {
    id: '2',
    gomanageId: '1002',
    name: 'Carlos López Martín',
    businessName: 'Comercial López',
    vatNumber: 'B23456789',
    email: 'carlos@comercial-lopez.com',
    phone: '+34 933 234 567',
    city: 'Barcelona',
    province: 'Barcelona',
    syncStatus: 'pending',
    lastSync: 'hace 1 hora',
    totalOrders: 18,
    totalAmount: 12350.75
  },
  {
    id: '3',
    gomanageId: '1003',
    name: 'Ana Martínez Silva',
    businessName: 'Suministros Martínez',
    vatNumber: 'B34567890',
    email: 'ana@suministros-martinez.es',
    phone: '+34 963 345 678',
    city: 'Valencia',
    province: 'Valencia',
    syncStatus: 'synced',
    lastSync: 'hace 2 min',
    totalOrders: 31,
    totalAmount: 18790.25
  },
  {
    id: '4',
    gomanageId: '1004',
    name: 'José Rodríguez Pérez',
    businessName: 'Electrónica Rodríguez',
    vatNumber: 'B45678901',
    email: 'jose@electronica-rodriguez.com',
    phone: '+34 954 456 789',
    city: 'Sevilla',
    province: 'Sevilla',
    syncStatus: 'error',
    lastSync: 'hace 3 horas',
    totalOrders: 12,
    totalAmount: 8460.00
  },
  {
    id: '5',
    gomanageId: '1005',
    name: 'Laura Fernández Ruiz',
    businessName: 'Tecnología Fernández',
    vatNumber: 'B56789012',
    email: 'laura@tecnologia-fernandez.es',
    phone: '+34 985 567 890',
    city: 'Oviedo',
    province: 'Asturias',
    syncStatus: 'synced',
    lastSync: 'hace 15 min',
    totalOrders: 27,
    totalAmount: 16230.80
  }
];

export default function Customers() {
  const [customers] = useState<Customer[]>(sampleCustomers);
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