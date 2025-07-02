// Gomanage API Service
const GOMANAGE_PROXY_URL = 'https://gomanage-proxy.vercel.app/api/gomanage';

export interface GomanageSession {
  sessionId: string;
  username: string;
  expiresAt: Date;
}

export interface Customer {
  id: string;
  gomanageId?: string;
  name: string;
  businessName: string;
  vatNumber?: string;
  email: string;
  phone?: string;
  streetName?: string;
  city?: string;
  postalCode?: string;
  province?: string;
  country?: string;
  syncStatus: 'synced' | 'pending' | 'error' | 'never';
  lastSync?: string;
}

export interface Product {
  id: string;
  gomanageId?: string;
  productId: string;
  brandName: string;
  reference: string;
  descriptionShort: string;
  basePrice: number;
  stockReal: number;
  stockReserved: number;
  category: string;
  syncStatus: 'synced' | 'pending' | 'error' | 'never';
  lastSync?: string;
}

export interface Order {
  id: string;
  gomanageId?: string;
  orderNumber: string;
  reference: string;
  date: string;
  status: 'draft' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  customerId: string;
  amount: number;
  taxAmount: number;
  shippingCost: number;
  totalAmount: number;
  syncStatus: 'synced' | 'pending' | 'error' | 'never';
  lastSync?: string;
}

class GomanageApiService {
  private session: GomanageSession | null = null;

  // Authentication
  async login(username: string = 'distri', password: string = 'GOtmt%'): Promise<GomanageSession> {
    try {
      const response = await fetch(`${GOMANAGE_PROXY_URL}?action=login&username=${username}&password=${encodeURIComponent(password)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Login failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.sessionId) {
        this.session = {
          sessionId: data.sessionId,
          username,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
        };
        
        // Store session in localStorage
        localStorage.setItem('gomanage_session', JSON.stringify(this.session));
        
        return this.session;
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Gomanage login error:', error);
      throw error;
    }
  }

  // Check if session is valid
  isSessionValid(): boolean {
    if (!this.session) {
      const storedSession = localStorage.getItem('gomanage_session');
      if (storedSession) {
        this.session = JSON.parse(storedSession);
      }
    }

    if (!this.session) return false;
    
    return new Date() < new Date(this.session.expiresAt);
  }

  // Generic API call
  async apiCall(endpoint: string): Promise<any> {
    if (!this.isSessionValid()) {
      await this.login();
    }

    if (!this.session) {
      throw new Error('No valid session');
    }

    try {
      const response = await fetch(
        `${GOMANAGE_PROXY_URL}?action=proxy&sessionId=${this.session.sessionId}&endpoint=${encodeURIComponent(endpoint)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          // Session expired, try to login again
          await this.login();
          return this.apiCall(endpoint);
        }
        throw new Error(`API call failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Gomanage API call error:', error);
      throw error;
    }
  }

  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    try {
      const data = await this.apiCall('/gomanage/web/data/apitmt-customers/List');
      return data.customers || [];
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  }

  async createCustomer(customer: Partial<Customer>): Promise<Customer> {
    try {
      const data = await this.apiCall('/gomanage/web/data/apitmt-customers/Create');
      // This would normally send customer data in the request body
      return data.customer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    try {
      const data = await this.apiCall('/gomanage/web/data/apitmt-products/List');
      return data.products || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  // Order operations
  async getOrders(): Promise<Order[]> {
    try {
      const data = await this.apiCall('/gomanage/web/data/apitmt-orders/List');
      return data.orders || [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }

  async createOrder(order: Partial<Order>): Promise<Order> {
    try {
      const data = await this.apiCall('/gomanage/web/data/apitmt-orders/Create');
      // This would normally send order data in the request body
      return data.order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  // Sync operations
  async syncEntity(entityType: 'customers' | 'products' | 'orders', operation: 'pull' | 'push' = 'pull'): Promise<{
    success: boolean;
    recordsProcessed: number;
    recordsSuccess: number;
    recordsError: number;
    errorMessage?: string;
  }> {
    try {
      const endpoint = `/gomanage/web/data/apitmt-${entityType}/Sync?operation=${operation}`;
      const data = await this.apiCall(endpoint);
      
      return {
        success: data.success || false,
        recordsProcessed: data.recordsProcessed || 0,
        recordsSuccess: data.recordsSuccess || 0,
        recordsError: data.recordsError || 0,
        errorMessage: data.errorMessage
      };
    } catch (error) {
      console.error(`Error syncing ${entityType}:`, error);
      return {
        success: false,
        recordsProcessed: 0,
        recordsSuccess: 0,
        recordsError: 1,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Connection test
  async testConnection(): Promise<{ connected: boolean; message: string }> {
    try {
      await this.apiCall('/gomanage/web/data/test');
      return { connected: true, message: 'Conexión exitosa' };
    } catch (error) {
      return { 
        connected: false, 
        message: error instanceof Error ? error.message : 'Error de conexión' 
      };
    }
  }

  // Logout
  logout(): void {
    this.session = null;
    localStorage.removeItem('gomanage_session');
  }
}

// Export singleton instance
export const gomanageApi = new GomanageApiService();
export default gomanageApi;