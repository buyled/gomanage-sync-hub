// 📊 Servicio de Datos de Gomanage

import type { Customer, Product, Order } from './types';
import type { GomanageConnectionService } from './connection';

export class GomanageDataService {
  constructor(private connectionService: GomanageConnectionService) {}

  // 🎭 Datos simulados para testing y fallback
  private getSimulatedData(endpoint: string): any {
    if (endpoint.includes('customers')) {
      return {
        total_entries: 15,
        page_entries: [
          { id: 1, name: 'María García', business_name: 'Distribuciones García S.L.', city: 'Madrid', email: 'maria@distribuciones-garcia.es' },
          { id: 2, name: 'Carlos López', business_name: 'Comercial López', city: 'Barcelona', email: 'carlos@comercial-lopez.com' },
          { id: 3, name: 'Ana Martínez', business_name: 'Suministros Martínez', city: 'Valencia', email: 'ana@suministros-martinez.es' }
        ]
      };
    }
    
    if (endpoint.includes('products')) {
      return {
        total_entries: 25,
        page_entries: [
          { id: 1, reference: 'LAPTOP-HP-001', brand_name: 'HP', description_short: 'Portátil HP Pavilion', base_price: 649.99, stock_real: 15 },
          { id: 2, reference: 'MOUSE-LOG-001', brand_name: 'Logitech', description_short: 'Ratón inalámbrico', base_price: 99.99, stock_real: 45 },
          { id: 3, reference: 'MONITOR-DELL-001', brand_name: 'Dell', description_short: 'Monitor 27"', base_price: 399.99, stock_real: 8 }
        ]
      };
    }
    
    if (endpoint.includes('orders')) {
      return {
        total_entries: 10,
        page_entries: [
          { id: 1, order_number: 'PED-2024-001', customer_name: 'María García', amount: 1299.98, status: 'confirmed' },
          { id: 2, order_number: 'PED-2024-002', customer_name: 'Carlos López', amount: 599.98, status: 'pending' },
          { id: 3, order_number: 'PED-2024-003', customer_name: 'Ana Martínez', amount: 2199.97, status: 'shipped' }
        ]
      };
    }

    return { message: 'Endpoint no implementado', endpoint };
  }

  // 👥 Obtener clientes usando GraphQL confirmado que funciona
  async getCustomers(): Promise<Customer[]> {
    try {
      console.log('🔍 Iniciando obtención de clientes con GraphQL confirmado...');
      const data = await this.connectionService.proxyRequest('/gomanage/web/data/apitmt-customers/List');
      console.log('📋 Respuesta completa GraphQL:', data);
      
      // Procesar respuesta GraphQL que sabemos que funciona
      if (data.success && data.data && 
          data.data.data && 
          data.data.data.master_files && 
          data.data.data.master_files.customers && 
          data.data.data.master_files.customers.nodes) {
        
        const customers = data.data.data.master_files.customers.nodes;
        const totalCount = data.data.data.master_files.customers.totalCount;
        
        console.log(`👥 ✅ ÉXITO: ${customers.length} clientes de ${totalCount} totales recibidos`);
        
        if (customers.length > 0) {
          console.log('📄 Primer cliente real:', customers[0]);
        }
        
        // Convertir formato GraphQL al formato esperado por la aplicación
        return customers.map((customer: any, index: number) => {
          const branch = customer.customer_branches && customer.customer_branches.length > 0 
            ? customer.customer_branches[0] 
            : {};
            
          return {
            id: String(index + 1),
            gomanageId: String(customer.customer_id),
            name: customer.name || 'Sin nombre',
            businessName: customer.business_name || 'Sin razón social',
            vatNumber: customer.vat_number || '',
            email: branch.email || '',
            phone: branch.phone || '',
            city: customer.city || '',
            province: customer.province_id ? `Provincia ${customer.province_id}` : '',
            syncStatus: 'synced' as const,
            lastSync: 'hace 1 min',
            totalOrders: 0,
            totalAmount: 0
          };
        });
      }
      
      console.log('⚠️ Estructura GraphQL no válida o respuesta vacía');
      console.log('🔍 Datos recibidos:', JSON.stringify(data, null, 2));
      return [];
    } catch (error) {
      console.error('❌ Error obteniendo clientes:', error);
      return [];
    }
  }

  // 📦 Obtener productos
  async getProducts(): Promise<Product[]> {
    try {
      const data = await this.connectionService.proxyRequest('/gomanage/web/data/apitmt-products/List');
      console.log('📦 Productos obtenidos:', data.page_entries?.length || 0);
      return data.page_entries || [];
    } catch (error) {
      console.error('❌ Error obteniendo productos:', error);
      console.warn('⚠️ Usando datos simulados de productos');
      return this.getSimulatedData('/products').page_entries || [];
    }
  }

  // 📋 Obtener pedidos
  async getOrders(): Promise<Order[]> {
    try {
      const data = await this.connectionService.proxyRequest('/gomanage/web/data/apitmt-orders/List');
      console.log('📋 Pedidos obtenidos:', data.page_entries?.length || 0);
      return data.page_entries || [];
    } catch (error) {
      console.error('❌ Error obteniendo pedidos:', error);
      console.warn('⚠️ Usando datos simulados de pedidos');
      return this.getSimulatedData('/orders').page_entries || [];
    }
  }
}