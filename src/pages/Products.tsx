import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SyncStatus from '@/components/SyncStatus';

// Sample products data
const sampleProducts = [
  {
    id: 1,
    gomanageId: 'PROD001',
    productId: 'LAPTOP-HP-001',
    brandName: 'HP',
    reference: 'Pavilion 15-dw3001ns',
    descriptionShort: 'Portátil HP Pavilion 15.6" Intel Core i5',
    basePrice: 649.99,
    stockReal: 15,
    stockReserved: 3,
    category: 'Informática',
    syncStatus: 'synced' as const,
    lastSync: 'hace 5 min',
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400'
  },
  {
    id: 2,
    gomanageId: 'PROD002',
    productId: 'MOUSE-LOG-001',
    brandName: 'Logitech',
    reference: 'MX Master 3S',
    descriptionShort: 'Ratón inalámbrico para productividad',
    basePrice: 99.99,
    stockReal: 45,
    stockReserved: 8,
    category: 'Periféricos',
    syncStatus: 'synced' as const,
    lastSync: 'hace 2 min',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400'
  },
  {
    id: 3,
    gomanageId: 'PROD003',
    productId: 'MONITOR-DELL-001',
    brandName: 'Dell',
    reference: 'UltraSharp U2722DE',
    descriptionShort: 'Monitor 27" QHD USB-C',
    basePrice: 399.99,
    stockReal: 8,
    stockReserved: 2,
    category: 'Monitores',
    syncStatus: 'pending' as const,
    lastSync: 'hace 1 hora',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400'
  },
  {
    id: 4,
    gomanageId: null,
    productId: 'KEYBOARD-COR-001',
    brandName: 'Corsair',
    reference: 'K95 RGB Platinum XT',
    descriptionShort: 'Teclado mecánico gaming RGB',
    basePrice: 179.99,
    stockReal: 2,
    stockReserved: 0,
    category: 'Periféricos',
    syncStatus: 'never' as const,
    lastSync: undefined,
    image: 'https://images.unsplash.com/photo-1601445638532-3c6f6c3aa1d6?w=400'
  },
  {
    id: 5,
    gomanageId: 'PROD005',
    productId: 'TABLET-APPLE-001',
    brandName: 'Apple',
    reference: 'iPad Air 5 64GB',
    descriptionShort: 'Tablet iPad Air M1 10.9"',
    basePrice: 679.99,
    stockReal: 0,
    stockReserved: 0,
    category: 'Tablets',
    syncStatus: 'error' as const,
    lastSync: 'hace 2 días',
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400'
  },
  {
    id: 6,
    gomanageId: 'PROD006',
    productId: 'IMPRESORA-HP-001',
    brandName: 'HP',
    reference: 'LaserJet Pro M404dn',
    descriptionShort: 'Impresora láser monocromo',
    basePrice: 259.99,
    stockReal: 12,
    stockReserved: 1,
    category: 'Impresoras',
    syncStatus: 'synced' as const,
    lastSync: 'hace 15 min',
    image: 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=400'
  }
];

export default function Products() {
  const [products] = useState(sampleProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterStock, setFilterStock] = useState('all');

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.descriptionShort.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.productId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    const matchesBrand = filterBrand === 'all' || product.brandName === filterBrand;
    
    let matchesStock = true;
    if (filterStock === 'high') matchesStock = product.stockReal > 20;
    else if (filterStock === 'medium') matchesStock = product.stockReal > 5 && product.stockReal <= 20;
    else if (filterStock === 'low') matchesStock = product.stockReal > 0 && product.stockReal <= 5;
    else if (filterStock === 'out') matchesStock = product.stockReal === 0;
    
    return matchesSearch && matchesCategory && matchesBrand && matchesStock;
  });

  const categories = Array.from(new Set(products.map(p => p.category))).sort();
  const brands = Array.from(new Set(products.map(p => p.brandName))).sort();

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { color: 'bg-destructive text-destructive-foreground', text: 'Sin stock' };
    if (stock <= 5) return { color: 'bg-warning text-warning-foreground', text: 'Stock bajo' };
    if (stock <= 20) return { color: 'bg-warning text-warning-foreground', text: 'Stock medio' };
    return { color: 'bg-success text-success-foreground', text: 'Stock alto' };
  };

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
          <h1 className="text-3xl font-bold text-foreground">Catálogo de Productos</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tu inventario de productos
          </p>
        </div>
        <Button className="mt-4 lg:mt-0 bg-primary hover:bg-primary-hover">
          ➕ Nuevo Producto
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <Input
              placeholder="Buscar por código, referencia o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterBrand} onValueChange={setFilterBrand}>
              <SelectTrigger>
                <SelectValue placeholder="Marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las marcas</SelectItem>
                {brands.map(brand => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStock} onValueChange={setFilterStock}>
              <SelectTrigger>
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el stock</SelectItem>
                <SelectItem value="high">Stock alto (+20)</SelectItem>
                <SelectItem value="medium">Stock medio (6-20)</SelectItem>
                <SelectItem value="low">Stock bajo (1-5)</SelectItem>
                <SelectItem value="out">Sin stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">{products.length}</div>
            <p className="text-sm text-muted-foreground">Total Productos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">
              {products.filter(p => p.stockReal > 5).length}
            </div>
            <p className="text-sm text-muted-foreground">Con stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">
              {products.filter(p => p.stockReal > 0 && p.stockReal <= 5).length}
            </div>
            <p className="text-sm text-muted-foreground">Stock bajo</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive">
              {products.filter(p => p.stockReal === 0).length}
            </div>
            <p className="text-sm text-muted-foreground">Sin stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => {
          const stockStatus = getStockStatus(product.stockReal);
          return (
            <Card key={product.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden">
              <div className="aspect-square bg-background-alt p-4 flex items-center justify-center">
                <img 
                  src={product.image} 
                  alt={product.reference}
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-semibold text-foreground truncate">
                      {product.reference}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground font-medium">
                      {product.brandName}
                    </p>
                  </div>
                  <SyncStatus 
                    status={product.syncStatus} 
                    size="sm"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {product.descriptionShort}
                </p>
                
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {product.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {product.productId}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-foreground">
                    {formatCurrency(product.basePrice)}
                  </div>
                  <Badge className={stockStatus.color}>
                    {stockStatus.text}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-sm border-t border-border pt-3">
                  <div>
                    <div className="font-semibold text-foreground">{product.stockReal}</div>
                    <div className="text-xs text-muted-foreground">Disponible</div>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{product.stockReserved}</div>
                    <div className="text-xs text-muted-foreground">Reservado</div>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Ver Detalle
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 bg-success hover:bg-success"
                    disabled={product.stockReal === 0}
                  >
                    Añadir
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No se encontraron productos
              </h3>
              <p className="text-muted-foreground mb-4">
                No hay productos que coincidan con los filtros aplicados
              </p>
              <Button onClick={() => {
                setSearchTerm('');
                setFilterCategory('all');
                setFilterBrand('all');
                setFilterStock('all');
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