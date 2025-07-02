import { Badge } from '@/components/ui/badge';

interface SyncStatusProps {
  status: 'synced' | 'pending' | 'error' | 'never';
  lastSync?: string;
  size?: 'sm' | 'md';
}

export default function SyncStatus({ status, lastSync, size = 'md' }: SyncStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'synced':
        return {
          color: 'bg-success text-success-foreground',
          icon: '✓',
          text: 'Sincronizado'
        };
      case 'pending':
        return {
          color: 'bg-warning text-warning-foreground',
          icon: '⏳',
          text: 'Pendiente'
        };
      case 'error':
        return {
          color: 'bg-destructive text-destructive-foreground',
          icon: '✕',
          text: 'Error'
        };
      case 'never':
        return {
          color: 'bg-muted text-muted-foreground',
          icon: '○',
          text: 'No sincronizado'
        };
      default:
        return {
          color: 'bg-muted text-muted-foreground',
          icon: '○',
          text: 'Desconocido'
        };
    }
  };

  const config = getStatusConfig();
  const isSmall = size === 'sm';

  return (
    <div className="flex flex-col space-y-1">
      <Badge className={`${config.color} ${isSmall ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1'} font-medium`}>
        <span className="mr-1">{config.icon}</span>
        {config.text}
      </Badge>
      {lastSync && (
        <span className={`${isSmall ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
          {lastSync}
        </span>
      )}
    </div>
  );
}