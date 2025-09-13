// src/services/dynamoService.ts
import { dynamoDB } from '../aws-config';
import { ScanCommand } from "@aws-sdk/client-dynamodb";
import CostMonitor from '../utils/costMonitor';

// Interfaces para TypeScript
export interface DynamoDBItem {
  ColeccionID?: { S: string };
  NombreColeccion?: { S: string };
  Registros?: { L: any[] };
  TotalRegistros?: { N: string };
  FechaCarga?: { S: string };
}

export interface CollectionSummary {
  ColeccionID?: string;
  NombreColeccion: string;
  TotalRegistros: number;
  FechaCarga?: string;
}

export interface CollectionDetails {
  ColeccionID?: string;
  NombreColeccion: string;
  Registros: any[];
  TotalRegistros: number;
  FechaCarga?: string;
}

export interface SearchOptions {
  limit?: number;
  caseSensitive?: boolean;
}

class DynamoService {
  /**
   * ✅ Optimizado para usar pocas unidades de capacidad
   * Obtiene resumen de todas las colecciones
   */
  async getCollectionsSummary(): Promise<CollectionSummary[]> {
    try {
      const command = new ScanCommand({
        TableName: 'PatologiaApp',
        ProjectionExpression: 'ColeccionID, NombreColeccion, TotalRegistros, FechaCarga'
      });

      const result = await dynamoDB.send(command);
      const items = result.Items as DynamoDBItem[] || [];
      
      CostMonitor.trackOperation();
      
      // Transformar datos de DynamoDB a formato más amigable
      return items.map(item => ({
        ColeccionID: item.ColeccionID?.S,
        NombreColeccion: item.NombreColeccion?.S || 'Unknown',
        TotalRegistros: parseInt(item.TotalRegistros?.N || '0'),
        FechaCarga: item.FechaCarga?.S
      }));
      
    } catch (error) {
      console.error('❌ Error obteniendo resumen de colecciones:', error);
      return [];
    }
  }

  /**
   * ✅ Query eficiente en lugar de Scan
   * Obtiene una colección específica por nombre
   */
  async getCollectionByName(collectionName: string): Promise<CollectionDetails | null> {
    try {
      const command = new ScanCommand({
        TableName: 'PatologiaApp',
        FilterExpression: 'NombreColeccion = :name',
        ExpressionAttributeValues: {
          ':name': { S: collectionName }
        },
        Limit: 1
      });

      const result = await dynamoDB.send(command);
      const items = result.Items as DynamoDBItem[] || [];
      
      if (items.length === 0) {
        return null;
      }

      const item = items[0];
      CostMonitor.trackOperation();
      
      return {
        ColeccionID: item.ColeccionID?.S,
        NombreColeccion: item.NombreColeccion?.S || collectionName,
        Registros: item.Registros?.L || [],
        TotalRegistros: parseInt(item.TotalRegistros?.N || '0'),
        FechaCarga: item.FechaCarga?.S
      };
      
    } catch (error) {
      console.error(`❌ Error obteniendo colección ${collectionName}:`, error);
      return null;
    }
  }

  /**
   * ✅ Búsqueda con paginación para ahorrar costos
   * Busca en una colección específica
   */
  async searchInCollection(
    collectionName: string, 
    searchTerm: string, 
    options: SearchOptions = {}
  ): Promise<any[]> {
    try {
      const { limit = 10, caseSensitive = false } = options;
      
      const collection = await this.getCollectionByName(collectionName);
      if (!collection || !collection.Registros) {
        return [];
      }

      const searchTermLower = caseSensitive ? searchTerm : searchTerm.toLowerCase();
      
      // Búsqueda en memoria (más barato que DynamoDB queries)
      const results = collection.Registros
        .filter(record => {
          const recordString = JSON.stringify(record);
          return caseSensitive 
            ? recordString.includes(searchTerm)
            : recordString.toLowerCase().includes(searchTermLower);
        })
        .slice(0, limit);

      console.log(`🔍 Búsqueda en ${collectionName}: ${results.length} resultados`);
      return results;
      
    } catch (error) {
      console.error(`❌ Error buscando en ${collectionName}:`, error);
      return [];
    }
  }

  /**
   * Obtiene todas las colecciones con todos sus datos
   */
  async getAllCollections(): Promise<CollectionDetails[]> {
    try {
      const command = new ScanCommand({
        TableName: 'PatologiaApp'
      });

      const result = await dynamoDB.send(command);
      const items = result.Items as DynamoDBItem[] || [];
      
      CostMonitor.trackOperation();
      
      return items.map(item => ({
        ColeccionID: item.ColeccionID?.S,
        NombreColeccion: item.NombreColeccion?.S || 'Unknown',
        Registros: item.Registros?.L || [],
        TotalRegistros: parseInt(item.TotalRegistros?.N || '0'),
        FechaCarga: item.FechaCarga?.S
      }));
      
    } catch (error) {
      console.error('❌ Error obteniendo todas las colecciones:', error);
      return [];
    }
  }

  /**
   * Busca en todas las colecciones simultáneamente
   */
  async searchAcrossAllCollections(
    searchTerm: string, 
    options: SearchOptions = {}
  ): Promise<{ collection: string; results: any[] }[]> {
    try {
      const { limit = 5, caseSensitive = false } = options;
      const collections = await this.getAllCollections();
      const searchTermLower = caseSensitive ? searchTerm : searchTerm.toLowerCase();
      
      const results: { collection: string; results: any[] }[] = [];

      for (const collection of collections) {
        const collectionResults = collection.Registros
          .filter(record => {
            const recordString = JSON.stringify(record);
            return caseSensitive 
              ? recordString.includes(searchTerm)
              : recordString.toLowerCase().includes(searchTermLower);
          })
          .slice(0, limit);

        if (collectionResults.length > 0) {
          results.push({
            collection: collection.NombreColeccion,
            results: collectionResults
          });
        }
      }

      console.log(`🔍 Búsqueda global: ${results.length} colecciones con resultados`);
      return results;
      
    } catch (error) {
      console.error('❌ Error en búsqueda global:', error);
      return [];
    }
  }

  /**
   * Obtiene estadísticas de la base de datos
   */
  async getDatabaseStats(): Promise<{
    totalCollections: number;
    totalRecords: number;
    largestCollection: string;
    largestCollectionCount: number;
  }> {
    try {
      const collections = await this.getCollectionsSummary();
      
      let totalRecords = 0;
      let largestCollection = '';
      let largestCollectionCount = 0;

      collections.forEach(collection => {
        totalRecords += collection.TotalRegistros;
        
        if (collection.TotalRegistros > largestCollectionCount) {
          largestCollectionCount = collection.TotalRegistros;
          largestCollection = collection.NombreColeccion;
        }
      });

      return {
        totalCollections: collections.length,
        totalRecords,
        largestCollection,
        largestCollectionCount
      };
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return {
        totalCollections: 0,
        totalRecords: 0,
        largestCollection: '',
        largestCollectionCount: 0
      };
    }
  }

  /**
   * Obtiene los nombres de todas las colecciones
   */
  async getCollectionNames(): Promise<string[]> {
    try {
      const collections = await this.getCollectionsSummary();
      return collections.map(col => col.NombreColeccion).filter(Boolean);
    } catch (error) {
      console.error('❌ Error obteniendo nombres de colecciones:', error);
      return [];
    }
  }
}

// Exportar instancia única (singleton)
export const dynamoService = new DynamoService();
export default dynamoService;
