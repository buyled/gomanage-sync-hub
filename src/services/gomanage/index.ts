// 🚀 Exportaciones principales del API de Gomanage

export * from './types';
export { GomanageConnectionService } from './connection';
export { GomanageDataService } from './dataService';
export { GomanageSyncService } from './syncService';
import { GomanageApiClient } from './apiClient';
export { GomanageApiClient } from './apiClient';

// 🚀 Instancia singleton exportada para compatibilidad
export const gomanageApi = new GomanageApiClient();
export default gomanageApi;