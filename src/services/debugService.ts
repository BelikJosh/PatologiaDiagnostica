// src/services/debugService.ts
import { docClient } from '../aws-config';
import { ScanCommand } from "@aws-sdk/client-dynamodb";

export interface DynamoDBItem {
  ColeccionID: { S: string };
  NombreColeccion: { S: string };
  Registros: { L: any[] };
  TotalRegistros?: { N: string };
  FechaCarga?: { S: string };
}

export interface DebugInfo {
  totalItems: number;
  collections: CollectionInfo[];
  connectionStatus: string;
  error?: string;
}

export interface CollectionInfo {
  name: string;
  recordCount: number;
  totalRecords: number;
  sampleRecord?: any;
}

export class DebugService {
  /**
   * Obtiene todo el contenido de la tabla DynamoDB con SDK v3
   */
  static async checkDynamoDBContents(): Promise<DynamoDBItem[]> {
    try {
      console.log('🔍 Escaneando tabla PatologiaApp...');
      
      const command = new ScanCommand({
        TableName: 'PatologiaApp',
        Limit: 100
      });

      const result = await docClient.send(command);
      const items = result.Items as DynamoDBItem[] || [];
      
      console.log('📊 Items encontrados:', items.length);
      return items;
      
    } catch (error) {
      console.error('❌ Error escaneando DynamoDB:', error);
      throw new Error(`Error al conectar con DynamoDB: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Busca específicamente la colección de usuarios con SDK v3
   */
  static async checkUsuariosCollection(): Promise<DynamoDBItem[]> {
    try {
      console.log('👥 Buscando colección de usuarios...');
      
      const command = new ScanCommand({
        TableName: 'PatologiaApp',
        FilterExpression: 'NombreColeccion = :name',
        ExpressionAttributeValues: {
          ':name': { S: 'dbo_Usuarios' }
        }
      });
      
      const result = await docClient.send(command);
      const items = result.Items as DynamoDBItem[] || [];
      
      console.log('✅ Colección usuarios encontrada:', items.length > 0);
      return items;
      
    } catch (error) { 
      console.error('❌ Error buscando usuarios:', error);
      throw new Error(`Error buscando usuarios: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Obtiene información detallada de debug
   */
  static async getDebugInfo(): Promise<DebugInfo> {
    try {
      const items = await this.checkDynamoDBContents();
      
      const collections: CollectionInfo[] = items.map(item => ({
        name: item.NombreColeccion,
        recordCount: item.Registros?.length || 0,
        totalRecords: item.TotalRegistros || 0,
        sampleRecord: item.Registros?.[0] // Primer registro como muestra
      }));

      return {
        totalItems: items.length,
        collections,
        connectionStatus: '✅ Conectado a DynamoDB'
      };
      
    } catch (error) {
      return {
        totalItems: 0,
        collections: [],
        connectionStatus: '❌ Error de conexión',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Verifica si un usuario específico existe
   */
  static async checkUserExists(username: string, password: string): Promise<{ exists: boolean; user?: any }> {
    try {
      const usersCollection = await this.checkUsuariosCollection();
      
      if (usersCollection.length === 0) {
        return { exists: false };
      }

      const allUsers = usersCollection[0].Registros || [];
      const userFound = allUsers.find((user: any) => 
        user.User === username && user.Password === password
      );

      return {
        exists: !!userFound,
        user: userFound
      };
      
    } catch (error) {
      console.error('❌ Error verificando usuario:', error);
      return { exists: false };
    }
  }

  /**
   * Obtiene estadísticas de la base de datos
   */
  static async getDatabaseStats(): Promise<{
    totalCollections: number;
    totalRecords: number;
    largestCollection: string;
    userCount: number;
  }> {
    try {
      const items = await this.checkDynamoDBContents();
      
      let totalRecords = 0;
      let largestCollection = '';
      let maxRecords = 0;
      let userCount = 0;

      items.forEach(item => {
        const records = item.Registros?.length || 0;
        totalRecords += records;
        
        if (records > maxRecords) {
          maxRecords = records;
          largestCollection = item.NombreColeccion;
        }

        if (item.NombreColeccion === 'dbo_Usuarios') {
          userCount = records;
        }
      });

      return {
        totalCollections: items.length,
        totalRecords,
        largestCollection,
        userCount
      };
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return {
        totalCollections: 0,
        totalRecords: 0,
        largestCollection: 'N/A',
        userCount: 0
      };
    }
  }

  /**
   * Prueba de conexión simple
   */
  static async testConnection(): Promise<boolean> {
    try {
      const params = {
        TableName: 'PatologiaApp',
        Limit: 1
      };
      
      await docClient.scan(params).promise();
      return true;
      
    } catch (error) {
      console.error('❌ Test de conexión falló:', error);
      return false;
    }
  }

  /**
   * Obtiene los nombres de todas las colecciones
   */
  static async getCollectionNames(): Promise<string[]> {
    try {
      const items = await this.checkDynamoDBContents();
      return items.map(item => item.NombreColeccion).filter(Boolean);
    } catch (error) {
      console.error('❌ Error obteniendo nombres de colecciones:', error);
      return [];
    }
  }

  /**
   * Busca en múltiples colecciones
   */
  static async searchInCollections(searchTerm: string): Promise<{ collection: string; results: any[] }[]> {
    try {
      const items = await this.checkDynamoDBContents();
      const results: { collection: string; results: any[] }[] = [];

      for (const item of items) {
        const collectionResults = item.Registros?.filter((record: any) =>
          JSON.stringify(record).toLowerCase().includes(searchTerm.toLowerCase())
        ) || [];

        if (collectionResults.length > 0) {
          results.push({
            collection: item.NombreColeccion,
            results: collectionResults
          });
        }
      }

      return results;
    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      return [];
    }
  }
}

// Exportar una instancia singleton por si acaso
export const debugService = new DebugService();