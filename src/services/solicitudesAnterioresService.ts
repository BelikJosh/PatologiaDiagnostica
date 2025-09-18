// src/services/solicitudesAnterioresService.ts
import { docClient } from '../aws-config';
import { QueryCommand, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

export interface SolicitudAnterior {
  id: string;
  numeroRegistro: string;
  paciente: string;
  fechaAlta: string;
  tipoEstudio: 'Biopsia' | 'Citologia';
  procedencia: string;
  archivoUrl?: string;
  año: number;
  mes: number;
  estatus: string;
}

export class SolicitudesAnterioresService {
  static readonly TABLE_NAME = 'PatologiaApp';
  static readonly COLLECTION_NAME = 'dbo_Solicitudes';

  // Verificar conexión con DynamoDB
  static async verifyConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const command = new ScanCommand({
        TableName: this.TABLE_NAME,
        Limit: 1
      });
      
      await docClient.send(command);
      return { success: true };
    } catch (error: any) {
      console.error('Error verificando conexión:', error);
      return { 
        success: false, 
        error: error.message || 'Error de conexión con DynamoDB' 
      };
    }
  }

  // Obtener todas las solicitudes - CORREGIDO
  static async getSolicitudes(): Promise<{ success: boolean; data?: SolicitudAnterior[]; error?: string }> {
    try {
      const command = new ScanCommand({
        TableName: this.TABLE_NAME,
        FilterExpression: 'NombreColeccion = :nombreColeccion',
        ExpressionAttributeValues: {
          ':nombreColeccion': this.COLLECTION_NAME
        }
      });

      const result = await docClient.send(command);
      
      if (result.Items && result.Items.length > 0) {
        const solicitudes = result.Items
          .filter(item => item.NombreColeccion === this.COLLECTION_NAME)
          .map(item => this.mapDynamoItemToSolicitud(item))
          .filter(s => s !== null) as SolicitudAnterior[];
        
        return { success: true, data: solicitudes };
      } else {
        return { success: true, data: [] };
      }
    } catch (error) {
      console.error('Error obteniendo solicitudes anteriores:', error);
      return { 
        success: false, 
        error: 'Error al obtener las solicitudes' 
      };
    }
  }

  // Obtener solicitudes por año - CORREGIDO
  static async getSolicitudesPorAño(año: number): Promise<{ success: boolean; data?: SolicitudAnterior[]; error?: string }> {
    try {
      // Primero obtener todas las solicitudes
      const result = await this.getSolicitudes();
      
      if (result.success && result.data) {
        // Filtrar por año usando la fecha real
        const solicitudesFiltradas = result.data.filter(solicitud => {
          try {
            const fecha = new Date(solicitud.fechaAlta);
            return fecha.getFullYear() === año;
          } catch {
            return false;
          }
        });
        
        return { success: true, data: solicitudesFiltradas };
      }
      
      return result;
    } catch (error) {
      console.error(`Error obteniendo solicitudes del año ${año}:`, error);
      return { 
        success: false, 
        error: `Error al obtener las solicitudes del año ${año}` 
      };
    }
  }

  // Eliminar una solicitud - CORREGIDO
  static async eliminarSolicitud(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Buscar el item por ID
      const scanCommand = new ScanCommand({
        TableName: this.TABLE_NAME,
        FilterExpression: 'NombreColeccion = :nombreColeccion AND Id = :id',
        ExpressionAttributeValues: {
          ':nombreColeccion': this.COLLECTION_NAME,
          ':id': id
        },
        Limit: 1
      });

      const scanResult = await docClient.send(scanCommand);
      
      if (!scanResult.Items || scanResult.Items.length === 0) {
        return { success: false, error: 'Solicitud no encontrada' };
      }

      const item = scanResult.Items[0];
      
      // Usar la clave primaria correcta (ColeccionID y NombreColeccion)
      const deleteCommand = new DeleteCommand({
        TableName: this.TABLE_NAME,
        Key: {
          ColeccionID: item.ColeccionID,
          NombreColeccion: item.NombreColeccion
        }
      });

      await docClient.send(deleteCommand);
      return { success: true };
    } catch (error) {
      console.error('Error eliminando solicitud:', error);
      return { 
        success: false, 
        error: 'Error al eliminar la solicitud' 
      };
    }
  }

  // Simular descarga de archivo
  static async descargarArchivo(numeroRegistro: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Simulando descarga para: ${numeroRegistro}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    } catch (error) {
      console.error('Error descargando archivo:', error);
      return { 
        success: false, 
        error: 'Error al descargar el archivo' 
      };
    }
  }

  // Datos de ejemplo para desarrollo/fallback
  static getDatosEjemplo(): SolicitudAnterior[] {
    const currentYear = new Date().getFullYear();
    return [
      {
        id: 'SOL-1',
        numeroRegistro: `BIO-${currentYear}-001`,
        paciente: 'María González',
        fechaAlta: '2024-01-15',
        tipoEstudio: 'Biopsia',
        procedencia: 'Hospital General',
        archivoUrl: '/ejemplo-biopsia.pdf',
        año: currentYear,
        mes: 1,
        estatus: 'Finalizado'
      },
      {
        id: 'SOL-2',
        numeroRegistro: `CIT-${currentYear}-001`,
        paciente: 'Juan Pérez',
        fechaAlta: '2024-01-16',
        tipoEstudio: 'Citologia',
        procedencia: 'Clínica Privada',
        archivoUrl: '/ejemplo-citologia.pdf',
        año: currentYear,
        mes: 1,
        estatus: 'Finalizado'
      }
    ];
  }

  // Mapear item de DynamoDB a SolicitudAnterior - CORREGIDO
  private static mapDynamoItemToSolicitud(item: any): SolicitudAnterior | null {
    try {
      if (!item.Id && !item.id) return null;

      const fechaAlta = item.FechaRecepcion || item.fechaRecepcion || item.CreatedAt || item.createdAt;
      const fechaObj = new Date(fechaAlta);
      
      return {
        id: item.Id || item.id,
        numeroRegistro: item.Id || item.id, // Usar ID como número de registro
        paciente: item.PacienteNombre || item.pacienteNombre || 'Paciente',
        fechaAlta: fechaAlta,
        tipoEstudio: (item.TipoEstudio || item.tipoEstudio || '').includes('Cito') ? 'Citologia' : 'Biopsia',
        procedencia: item.Procedencia || item.procedencia || '',
        archivoUrl: item.ArchivoUrl || item.archivoUrl,
        año: fechaObj.getFullYear(),
        mes: fechaObj.getMonth() + 1,
        estatus: item.Estatus || item.estatus || 'Pendiente'
      };
    } catch (error) {
      console.error('Error mapeando item:', item, error);
      return null;
    }
  }
}