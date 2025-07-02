import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

const navigation = [
  { name: 'Dashboard', href: '/', icon: '📊' },
  { name: 'Clientes', href: '/customers', icon: '👥' },
  { name: 'Productos', href: '/products', icon: '📦' },
  { name: 'Pedidos', href: '/orders', icon: '📋' },
  { name: 'Sincronización', href: '/sync', icon: '🔄' },
  { name: 'Test API', href: '/test-api', icon: '🧪' },
  { name: 'Configuración', href: '/settings', icon: '⚙️' },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActivePath = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">G</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Gomanage</h1>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span className="text-xs text-muted-foreground">Conectado</span>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = isActivePath(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:bg-card-hover hover:text-foreground'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
              {item.name === 'Sincronización' && (
                <Badge variant="secondary" className="ml-auto">
                  3
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3 p-3 bg-background-alt rounded-lg">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-semibold">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              Juan Pérez
            </p>
            <p className="text-xs text-muted-foreground truncate">
              Administrador
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 bg-card shadow-lg border-r border-border">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="lg:hidden fixed top-4 left-4 z-50"
          >
            ☰
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto bg-background-alt p-6">
          {children}
        </main>
      </div>
    </div>
  );
}