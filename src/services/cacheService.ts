// src/services/cacheService.ts
import { dynamoDB } from '../aws-config';
import CostMonitor from '../utils/costMonitor';

export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
}

export class CacheService {
  private static cache: Map<string, CacheItem> = new Map();
  private static readonly defaultCacheDuration: number = 5 * 60 * 1000; // 5 minutos

  /**
   * Obtiene datos del cache
   */
  static get<T = any>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (item && this.isValid(item.timestamp)) {
      console.log(`✅ Cache hit: ${key}`);
      return item.data as T;
    }
    
    if (item) {
      console.log(`❌ Cache expired: ${key}`);
      this.cache.delete(key); // Limpiar item expirado
    }
    
    return null;
  }

  /**
   * Guarda datos en el cache
   */
  static set<T = any>(key: string, data: T, duration?: number): void {
    const cacheDuration = duration || this.defaultCacheDuration;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    console.log(`💾 Cache set: ${key} (${cacheDuration}ms)`);
    
    // Auto-limpiar después de la duración
    setTimeout(() => {
      if (this.cache.get(key)?.timestamp === Date.now() - cacheDuration) {
        this.cache.delete(key);
        console.log(`🧹 Cache auto-cleaned: ${key}`);
      }
    }, cacheDuration);
  }

  /**
   * Elimina un item del cache
   */
  static delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`🗑️ Cache deleted: ${key}`);
    }
    return deleted;
  }

  /**
   * Limpia todo el cache
   */
  static clear(): void {
    this.cache.clear();
    console.log('🧹 Cache completamente limpiado');
  }

  /**
   * Verifica si un item del cache es válido
   */
  private static isValid(timestamp: number, duration?: number): boolean {
    const cacheDuration = duration || this.defaultCacheDuration;
    return Date.now() - timestamp < cacheDuration;
  }

  /**
   * Obtiene estadísticas del cache
   */
  static getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Verifica si una key existe en el cache (sin validar expiración)
   */
  static has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Obtiene el tiempo restante para un item del cache
   */
  static getTimeRemaining(key: string): number | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const elapsed = Date.now() - item.timestamp;
    const remaining = this.defaultCacheDuration - elapsed;
    
    return remaining > 0 ? remaining : 0;
  }
}

// Interfaces para el servicio de Dynamo
export interface CollectionSummary {
  ColeccionID?: string;
  NombreColeccion: string;
  TotalRegistros: number;
}

export class OptimizedDynamoService {
  private static readonly CACHE_KEY = 'collections_summary';
  private static readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutos

  /**
   * Obtiene resumen de colecciones con cache
   */
  async getCollectionsSummary(): Promise<CollectionSummary[]> {
    // Intentar obtener del cache primero
    const cached = CacheService.get<CollectionSummary[]>(OptimizedDynamoService.CACHE_KEY);
    
    if (cached) {
      return cached; // ✅ Cache hit - evita llamar a DynamoDB
    }

    try {
      console.log('🔄 Fetching from DynamoDB (cache miss)');
      
      const params = {
        TableName: 'PatologiaApp',
        ProjectionExpression: 'ColeccionID, NombreColeccion, TotalRegistros'
      };

      const result = await dynamoDB.send(params);
      const items = result.Items || [];
      
      // Transformar a la estructura esperada
      const collections: CollectionSummary[] = items.map(item => ({
        ColeccionID: item.ColeccionID?.S,
        NombreColeccion: item.NombreColeccion?.S || 'Unknown',
        TotalRegistros: parseInt(item.TotalRegistros?.N || '0')
      }));

      // Guardar en cache
      CacheService.set(
        OptimizedDynamoService.CACHE_KEY, 
        collections, 
        OptimizedDynamoService.CACHE_DURATION
      );
      
      CostMonitor.trackOperation();
      
      return collections;
      
    } catch (error) {
      console.error('❌ Error fetching collections:', error);
      return [];
    }
  }

  /**
   * Obtiene una colección específica con cache
   */
  async getCollectionByName(name: string): Promise<CollectionSummary | null> {
    const cacheKey = `collection_${name}`;
    const cached = CacheService.get<CollectionSummary>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const allCollections = await this.getCollectionsSummary();
      const collection = allCollections.find(col => 
        col.NombreColeccion.toLowerCase() === name.toLowerCase()
      );

      if (collection) {
        CacheService.set(cacheKey, collection, OptimizedDynamoService.CACHE_DURATION);
      }
      
      return collection || null;
      
    } catch (error) {
      console.error('❌ Error fetching collection:', error);
      return null;
    }
  }

  /**
   * Limpia el cache de colecciones
   */
  static clearCollectionsCache(): void {
    CacheService.delete(OptimizedDynamoService.CACHE_KEY);
    console.log('🧹 Cache de colecciones limpiado');
  }
}

// Exportar instancia por defecto
export const optimizedDynamoService = new OptimizedDynamoService();
export default CacheService;