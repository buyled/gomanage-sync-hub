// 📊 Servicio de Datos de Gomanage con GraphQL

import type { Customer, Product, Order } from './types';
import type { GomanageConnectionService } from './connection';

export class GomanageDataService {
  constructor(private connectionService: GomanageConnectionService) {}

  // 👥 Obtener clientes usando GraphQL
  async getCustomers(): Promise<Customer[]> {
    try {
      console.log('🔍 Obteniendo clientes con GraphQL...');
      const data = await this.connectionService.proxyRequest('/gomanage/web/data/apitmt-customers/List');
      
      if (data && data.data && data.data.master_files && data.data.master_files.customers) {
        const customers = data.data.master_files.customers.nodes || [];
        const totalCount = data.data.master_files.customers.totalCount || 0;
        
        console.log(`👥 ✅ ${customers.length} clientes obtenidos de ${totalCount} totales`);
        
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
      
      console.log('⚠️ Estructura de datos no válida para clientes');
      return [];
    } catch (error) {
      console.error('❌ Error obteniendo clientes:', error);
      return [];
    }
  }

  // 📦 Obtener productos usando GraphQL
  async getProducts(): Promise<Product[]> {
    try {
      console.log('🔍 Obteniendo productos con GraphQL...');
      const data = await this.connectionService.proxyRequest('/gomanage/web/data/apitmt-products/List');
      
      if (data && data.data && data.data.master_files && data.data.master_files.products) {
        const products = data.data.master_files.products.nodes || [];
        const totalCount = data.data.master_files.products.totalCount || 0;
        
        console.log(`📦 ✅ ${products.length} productos obtenidos de ${totalCount} totales`);
        
        return products.map((product: any, index: number) => ({
          id: String(index + 1),
          gomanageId: String(product.product_id),
          productId: product.reference || `PROD-${product.product_id}`,
          brandName: product.brand_name || 'Sin marca',
          reference: product.reference || `REF-${product.product_id}`,
          descriptionShort: product.description_short || 'Sin descripción',
          basePrice: parseFloat(product.base_price) || 0,
          stockReal: parseInt(product.stock_real) || 0,
          stockReserved: parseInt(product.stock_reserved) || 0,
          category: product.category_id ? `Categoría ${product.category_id}` : 'Sin categoría',
          syncStatus: 'synced' as const,
          lastSync: 'hace 1 min'
        }));
      }
      
      console.log('⚠️ Estructura de datos no válida para productos');
      return [];
    } catch (error) {
      console.error('❌ Error obteniendo productos:', error);
      return [];
    }
  }

  // 📋 Obtener pedidos usando GraphQL
  async getOrders(): Promise<Order[]> {
    try {
      console.log('🔍 Obteniendo pedidos con GraphQL...');
      const data = await this.connectionService.proxyRequest('/gomanage/web/data/apitmt-orders/List');
      
      if (data && data.data && data.data.commercial_documents && data.data.commercial_documents.orders) {
        const orders = data.data.commercial_documents.orders.nodes || [];
        const totalCount = data.data.commercial_documents.orders.totalCount || 0;
        
        console.log(`📋 ✅ ${orders.length} pedidos obtenidos de ${totalCount} totales`);
        
        return orders.map((order: any, index: number) => ({
          id: String(index + 1),
          gomanageId: String(order.order_id),
          orderNumber: order.order_number || `ORD-${order.order_id}`,
          reference: order.reference || `REF-${order.order_id}`,
          date: order.order_date || new Date().toISOString().split('T')[0],
          status: this.mapOrderStatus(order.status),
          customerName: order.customer_name || 'Cliente desconocido',
          amount: parseFloat(order.total_amount) || 0,
          totalAmount: parseFloat(order.total_amount) || 0,
          syncStatus: 'synced' as const,
          lastSync: 'hace 1 min'
        }));
      }
      
      console.log('⚠️ Estructura de datos no válida para pedidos');
      return [];
    } catch (error) {
      console.error('❌ Error obteniendo pedidos:', error);
      return [];
    }
  }

  // Mapear estados de pedidos de Gomanage a nuestro formato
  private mapOrderStatus(gomanageStatus: any): 'draft' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' {
    if (!gomanageStatus) return 'draft';
    
    const status = String(gomanageStatus).toLowerCase();
    
    if (status.includes('draft') || status.includes('borrador')) return 'draft';
    if (status.includes('pending') || status.includes('pendiente')) return 'pending';
    if (status.includes('confirmed') || status.includes('confirmado')) return 'confirmed';
    if (status.includes('shipped') || status.includes('enviado')) return 'shipped';
    if (status.includes('delivered') || status.includes('entregado')) return 'delivered';
    if (status.includes('cancelled') || status.includes('cancelado')) return 'cancelled';
    
    return 'pending'; // Default
  }
}