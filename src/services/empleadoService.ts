// src/services/empleadoService.ts
import { docClient } from '../aws-config';
import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

export interface Empleado {
  id?: string;
  NombreUsuario: string;
  Password: string;
  Nombre: string;
  ApellidoPat: string;
  ApellidoMat?: string;
  Telefono: string;
  Email?: string;
  FechaNacimiento?: string;
  Direccion?: string;
  IdTipoUsuario: number;
  Imagen?: string; // Cambiado a string para base64
  Activo?: boolean;
}

export class EmpleadoService {
  static readonly TABLE_NAME = 'PatologiaApp';
  static readonly COLLECTION_NAME = 'dbo_Usuarios';

static async createEmpleado(empleado: Empleado): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const id = this.generateId();
    const now = new Date().toISOString();

    // Limitar el tamaño de la imagen si es muy grande
    let imagenProcesada = empleado.Imagen || '';
    if (imagenProcesada && imagenProcesada.length > 100000) { // ~100KB
      console.warn('La imagen es muy grande, se recortará');
      imagenProcesada = imagenProcesada.substring(0, 100000);
    }

    const item = {
      ColeccionID: `${this.COLLECTION_NAME}#${id}`,
      NombreColeccion: this.COLLECTION_NAME,
      Id: id,
      NombreUsuario: empleado.NombreUsuario,
      Password: empleado.Password,
      Nombre: empleado.Nombre,
      ApellidoPat: empleado.ApellidoPat,
      ApellidoMat: empleado.ApellidoMat || '',
      Telefono: empleado.Telefono,
      Email: empleado.Email || '',
      FechaNacimiento: empleado.FechaNacimiento || '',
      Direccion: empleado.Direccion || '',
      IdTipoUsuario: empleado.IdTipoUsuario,
      Imagen: imagenProcesada, // Usamos el string base64
      Activo: true,
      CreatedAt: now,
      UpdatedAt: now
    };

    console.log('📦 Item completo a guardar:', {
      ...item,
      Imagen: item.Imagen ? `[BASE64_IMAGE_${item.Imagen.length}_bytes]` : 'empty'
    });

    const command = new PutCommand({
      TableName: this.TABLE_NAME,
      Item: item
    });

    await docClient.send(command);
    
    console.log('✅ Empleado guardado, ID:', id);
    return { success: true, id };

  } catch (error: any) {
    console.error('❌ Error creando empleado:', error);
    
    if (error.name === 'ValidationException') {
      return { 
        success: false, 
        error: `Error de validación: ${error.message}` 
      };
    }
    
    return { success: false, error: 'Error al guardar el empleado' };
  }
}

static async getEmpleados(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    console.log('🔍 Obteniendo empleados de DynamoDB...');
    
    const scanCommand = new ScanCommand({
      TableName: this.TABLE_NAME,
      FilterExpression: 'NombreColeccion = :coleccionName',
      ExpressionAttributeValues: {
        ':coleccionName': this.COLLECTION_NAME
      }
    });

    const result = await docClient.send(scanCommand);
    console.log('✅ Resultado completo de DynamoDB:', result);
    console.log('📦 Items encontrados:', result.Items?.length || 0);
    
    // Debug: mostrar la estructura real de los items
    if (result.Items && result.Items.length > 0) {
      console.log('🔍 Estructura del primer item:', JSON.stringify(result.Items[0], null, 2));
    }

    if (result.Items && result.Items.length > 0) {
      const allEmpleados: any[] = [];
      
      result.Items.forEach((item) => {
        console.log('📦 Procesando item:', item);
        
        // PRIMERA POSIBILIDAD: Los empleados están directamente en los items
        if (item.NombreColeccion === this.COLLECTION_NAME) {
          console.log('✅ Item directo de empleado encontrado');
          const empleado = {
            Id: item.Id || '',
            Nombre: item.Nombre || '',
            ApellidoPat: item.ApellidoPat || '',
            ApellidoMat: item.ApellidoMat || '',
            FechaNacimiento: item.FechaNacimiento || '',
            Telefono: item.Telefono || '',
            Email: item.Email || '',
            IdTipoUsuario: item.IdTipoUsuario || 0,
            Activo: item.Activo !== undefined ? item.Activo : true,
            NombreUsuario: item.NombreUsuario || '',
            Imagen: item.Imagen || '',
            Direccion: item.Direccion || ''
          };
          console.log('👤 Empleado procesado (directo):', empleado);
          allEmpleados.push(empleado);
        }
        // SEGUNDA POSIBILIDAD: Los empleados están en un array Registros
        else if (item.Registros && Array.isArray(item.Registros)) {
          console.log('📋 Registros encontrados:', item.Registros.length);
          
          item.Registros.forEach((registro: any) => {
            console.log('👤 Registro:', registro);
            
            const empleado = {
              Id: registro.Id || registro.id || '',
              Nombre: registro.Nombre || '',
              ApellidoPat: registro.ApellidoPat || '',
              ApellidoMat: registro.ApellidoMat || '',
              FechaNacimiento: registro.FechaNacimiento || '',
              Telefono: registro.Telefono || '',
              Email: registro.Email || '',
              IdTipoUsuario: parseInt(registro.IdTipoUsuario || registro.idTipoUsuario || '0'),
              Activo: registro.Activo !== undefined ? registro.Activo : true,
              NombreUsuario: registro.NombreUsuario || '',
              Imagen: registro.Imagen || '',
              Direccion: registro.Direccion || ''
            };
            
            console.log('✅ Empleado procesado (desde Registros):', empleado);
            allEmpleados.push(empleado);
          });
        }
        else {
          console.log('❌ Estructura no reconocida en item:', item);
        }
      });
      
      console.log('📊 Total de empleados procesados:', allEmpleados.length);
      return { success: true, data: allEmpleados };
    }
    
    console.log('ℹ️ No se encontraron items');
    return { success: true, data: [] };

  } catch (error) {
    console.error('❌ Error obteniendo empleados:', error);
    return { 
      success: false, 
      error: 'Error al obtener los empleados de la base de datos' 
    };
  }
}

  static calcularEdad(fechaNacimiento: string): number {
    if (!fechaNacimiento) return 0;
    
    try {
      // Intentar parsear diferentes formatos de fecha
      let fecha: Date;
      
      if (fechaNacimiento.includes('T')) {
        // Formato ISO
        fecha = new Date(fechaNacimiento);
      } else {
        // Formato simple YYYY-MM-DD
        const [year, month, day] = fechaNacimiento.split('-');
        fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
      
      const hoy = new Date();
      let edad = hoy.getFullYear() - fecha.getFullYear();
      
      const mes = hoy.getMonth() - fecha.getMonth();
      if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) {
        edad--;
      }
      
      return edad;
    } catch {
      return 0;
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      const command = new ScanCommand({
        TableName: this.TABLE_NAME,
        Limit: 1
      });
      
      await docClient.send(command);
      return true;
    } catch (error) {
      console.error('❌ Error de conexión con DynamoDB:', error);
      return false;
    }
  }

  static getTipoUsuarioLabel(idTipoUsuario: number): string {
    const tipos: { [key: number]: string } = {
      1: 'Super Admin',
      2: 'Administrador', 
      3: 'Operador'
    };
    return tipos[idTipoUsuario] || 'Desconocido';
  }

  private static generateId(): string {
    return `EMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}