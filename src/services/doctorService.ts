// src/services/doctorService.ts
import { docClient } from '../aws-config';
import { PutCommand, QueryCommand, ScanCommand, GetCommand  } from "@aws-sdk/lib-dynamodb";

export interface Doctor {
  id?: string;
  nombre: string;
  primerApellido: string;
  segundoApellido?: string;
  telefono: string;
  email?: string;
  especialidad?: string;
  direccion?: string;
}

export class DoctorService {
  static readonly TABLE_NAME = 'PatologiaApp';
  static readonly COLLECTION_NAME = 'dbo_Doctores';

  static async createDoctor(doctor: Doctor): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = this.generateId();
      const now = new Date().toISOString();

      const item = {
        ColeccionID: `${this.COLLECTION_NAME}#${id}`,
        NombreColeccion: this.COLLECTION_NAME,
        Id: id,
        Nombre: doctor.nombre,
        PrimerApellido: doctor.primerApellido,
        SegundoApellido: doctor.segundoApellido || '',
        Telefono: doctor.telefono,
        Email: doctor.email || '',
        Especialidad: doctor.especialidad || '',
        Direccion: doctor.direccion || '',
        CreatedAt: now,
        UpdatedAt: now
      };

      console.log('📦 Item a guardar:', item);

      const command = new PutCommand({
        TableName: this.TABLE_NAME,
        Item: item
      });

      await docClient.send(command);
      return { success: true, id };

    } catch (error: any) {
      console.error('❌ Error creando doctor:', error);
      
      if (error.name === 'ValidationException') {
        return { 
          success: false, 
          error: `Error de validación: ${error.message}` 
        };
      }
      
      return { success: false, error: 'Error al guardar el doctor' };
    }
  }

  static async getDoctores(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const command = new QueryCommand({
        TableName: this.TABLE_NAME,
        KeyConditionExpression: 'NombreColeccion = :nombreColeccion',
        ExpressionAttributeValues: {
          ':nombreColeccion': this.COLLECTION_NAME
        }
      });

      const result = await docClient.send(command);
      return { success: true, data: result.Items || [] };

    } catch (error) {
      console.error('❌ Error obteniendo doctores:', error);
      
      // Si falla el query, intenta con scan
      try {
        const scanCommand = new ScanCommand({
          TableName: this.TABLE_NAME,
          FilterExpression: 'NombreColeccion = :nombreColeccion',
          ExpressionAttributeValues: {
            ':nombreColeccion': this.COLLECTION_NAME
          }
        });

        const scanResult = await docClient.send(scanCommand);
        return { success: true, data: scanResult.Items || [] };
      } catch (scanError) {
        return { success: false, error: 'Error al obtener los doctores' };
      }
    }
  }

 

 // src/services/doctorService.ts
static async getDoctorByID(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('🔍 Buscando doctor con ID:', id);
    
    // PRIMERO intenta con la estructura que debería ser
    try {
      const command = new GetCommand({
        TableName: this.TABLE_NAME,
        Key: {
          ColeccionID: `${this.COLLECTION_NAME}#${id}`,
          NombreColeccion: this.COLLECTION_NAME
        }
      });

      const result = await docClient.send(command);
      
      if (result.Item) {
        console.log('✅ Doctor encontrado con estructura #:', result.Item);
        return { success: true, data: result.Item };
      }
    } catch (error) {
      console.log('⚠️ Primera estructura falló para doctor, intentando alternativa...');
    }

    // SEGUNDO intento - sin el # en ColeccionID
    try {
      const command = new GetCommand({
        TableName: this.TABLE_NAME,
        Key: {
          ColeccionID: id, // Solo el ID, sin prefijo
          NombreColeccion: this.COLLECTION_NAME
        }
      });

      const result = await docClient.send(command);
      
      if (result.Item) {
        console.log('✅ Doctor encontrado con estructura simple:', result.Item);
        return { success: true, data: result.Item };
      }
    } catch (error) {
      console.log('⚠️ Segunda estructura también falló para doctor');
    }

    // TERCER intento - usando SCAN como fallback
    try {
      const scanCommand = new ScanCommand({
        TableName: this.TABLE_NAME,
        FilterExpression: 'Id = :id AND NombreColeccion = :coleccion',
        ExpressionAttributeValues: {
          ':id': id,
          ':coleccion': this.COLLECTION_NAME
        }
      });

      const result = await docClient.send(scanCommand);
      
      if (result.Items && result.Items.length > 0) {
        console.log('✅ Doctor encontrado con SCAN:', result.Items[0]);
        return { success: true, data: result.Items[0] };
      }
    } catch (error) {
      console.error('Error con SCAN para doctor:', error);
    }

    return { success: false, error: 'Doctor no encontrado' };

  } catch (error) {
    console.error('❌ Error buscando doctor por ID:', error);
    return { success: false, error: 'Error al buscar doctor' };
  }
}
  private static generateId(): string {
    return `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}