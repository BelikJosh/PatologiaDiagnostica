// src/services/pacienteService.ts
import { docClient } from '../aws-config';
import { GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

// CORREGIR en src/services/PacienteService.ts
export interface Paciente {
  id?: string;
  nombre: string;
  apellidoPat: string;
  apellidoMat: string;
  telefono: string;           // ← Cambia a REQUERIDO
  email: string;              // ← Cambia a REQUERIDO
  direccion: string;
  sexo: string;
  fechaNacimiento: string;
  createdAt?: string;         // ← Hazlo OPCIONAL
  updatedAt?: string;         // ← CORREGIR: updatedAt (no updateAt)
}

export class PacienteService {
  static readonly TABLE_NAME = 'PatologiaApp';
  static readonly COLLECTION_NAME = 'dbo_Pacientes';

private static generateId(): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 9);
    return `PAC-${timestamp}-${randomStr}`;
  }

  // Crear nuevo paciente
  static async crearPaciente(pacienteData: Omit<Paciente, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = this.generateId();
      const now = new Date().toISOString();

      const item = {
        ColeccionID: `${this.COLLECTION_NAME}#${id}`,
        NombreColeccion: this.COLLECTION_NAME,
        Id: id,
        Nombre: pacienteData.nombre,
        ApellidoPat: pacienteData.apellidoPat,
        ApellidoMat: pacienteData.apellidoMat,
        Telefono: pacienteData.telefono,
        Email: pacienteData.email || '',
        Direccion: pacienteData.direccion,
        Sexo: pacienteData.sexo,
        FechaNacimiento: pacienteData.fechaNacimiento,
        CreatedAt: now,
        UpdatedAt: now
      };

      const command = new PutCommand({
        TableName: this.TABLE_NAME,
        Item: item
      });

      await docClient.send(command);
      return { success: true, id };

    } catch (error: any) {
      console.error('Error creando paciente:', error);
      return { success: false, error: 'Error al crear el paciente' };
    }
  }


// En src/services/PacienteService.ts
// En PacienteService.ts - modifica crearPacienteDesdeSolicitud
static async crearPacienteDesdeSolicitud(datosPaciente: {
  nombre: string;
  telefono?: string;
  direccion?: string;
  sexo?: string;
  fechaCreacion?: string; // ← RECIBIR LA FECHA REAL
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Verificar si el paciente ya existe por nombre
    const resultadoBusqueda = await this.buscarPacientesPorNombre(datosPaciente.nombre);
    
    if (resultadoBusqueda.success && resultadoBusqueda.data && resultadoBusqueda.data.length > 0) {
      // Si existe, retornar el ID existente
      return { 
        success: true, 
        id: resultadoBusqueda.data[0].id 
      };
    }
    
    // Si no existe, crear nuevo paciente con la FECHA REAL
    const id = this.generateId();
    const fechaCreacion = datosPaciente.fechaCreacion || new Date().toISOString(); // ← Usar fecha real

    const item = {
      ColeccionID: `${this.COLLECTION_NAME}#${id}`,
      NombreColeccion: this.COLLECTION_NAME,
      Id: id,
      Nombre: datosPaciente.nombre,
      ApellidoPat: '',
      ApellidoMat: '',
      Telefono: datosPaciente.telefono || '',
      Email: '',
      Direccion: datosPaciente.direccion || '',
      Sexo: datosPaciente.sexo || 'N/A',
      FechaNacimiento: '2000-01-01',
      CreatedAt: fechaCreacion, // ← FECHA CORRECTA
      UpdatedAt: fechaCreacion
    };

    const command = new PutCommand({
      TableName: this.TABLE_NAME,
      Item: item
    });

    await docClient.send(command);
    return { success: true, id };

  } catch (error) {
    console.error('Error creando paciente desde solicitud:', error);
    return { success: false, error: 'Error al crear paciente' };
  }
}

  static async obtenerPacientes(): Promise<{ success: boolean; data?: Paciente[]; error?: string }> {
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
        const pacientes = result.Items.map(item => ({
          id: item.Id,
          nombre: item.Nombre,
          apellidoPat: item.ApellidoPat,
          apellidoMat: item.ApellidoMat,
          telefono: item.Telefono,
          email: item.Email,
          direccion: item.Direccion,
          sexo: item.Sexo,
          fechaNacimiento: item.FechaNacimiento,
          createdAt: item.CreatedAt,
          updatedAt: item.UpdatedAt
        }));
        
        return { success: true, data: pacientes };
      }
      
      return { success: true, data: [] };

    } catch (error) {
      console.error('Error obteniendo pacientes:', error);
      return { success: false, error: 'Error al obtener pacientes' };
    }
  }

static async buscarPacientes(termino: string): Promise<{ success: boolean; data?: Paciente[]; error?: string }> {
  try {
    // Si el término está vacío, devolver todos los pacientes
    if (!termino.trim()) {
      return await this.obtenerPacientes();
    }

    const command = new ScanCommand({
      TableName: this.TABLE_NAME,
      FilterExpression: 'NombreColeccion = :nombreColeccion AND (' +
        'contains(Nombre, :termino) OR ' +
        'contains(ApellidoPat, :termino) OR ' +
        'contains(ApellidoMat, :termino) OR ' +
        'contains(Telefono, :termino) OR ' +
        'contains(Email, :termino) OR ' +
        'contains(Direccion, :termino) OR ' +
        'contains(Id, :termino)' +
        ')',
      ExpressionAttributeValues: {
        ':nombreColeccion': this.COLLECTION_NAME,
        ':termino': termino
      }
    });

    const result = await docClient.send(command);
    
    if (result.Items && result.Items.length > 0) {
      const pacientes = result.Items.map(item => ({
        id: item.Id,
        nombre: item.Nombre,
        apellidoPat: item.ApellidoPat,
        apellidoMat: item.ApellidoMat,
        telefono: item.Telefono,
        email: item.Email,
        direccion: item.Direccion,
        sexo: item.Sexo,
        fechaNacimiento: item.FechaNacimiento,
        createdAt: item.CreatedAt,
        updatedAt: item.UpdatedAt
      }));
      
      return { success: true, data: pacientes };
    }
    
    return { success: true, data: [] };

  } catch (error) {
    console.error('Error buscando pacientes:', error);
    return { success: false, error: 'Error al buscar pacientes' };
  }
}

  static async buscarPacientesPorNombre(nombre: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const command = new ScanCommand({
        TableName: this.TABLE_NAME,
        FilterExpression: 'contains(NombreCompleto, :nombre) OR contains(Nombre, :nombre) OR contains(PrimerApellido, :nombre)',
        ExpressionAttributeValues: {
          ':nombre': nombre
        }
      });

      const result = await docClient.send(command);
      
      // Filtrar solo los registros de pacientes
      const pacientes = result.Items?.filter(item => 
        item.NombreColeccion === this.COLLECTION_NAME
      ) || [];

      return { success: true, data: pacientes };

    } catch (error) {
      console.error('Error buscando pacientes:', error);
      return { success: false, error: 'Error al buscar pacientes' };
    }
  }

  static async buscarPacientesPorTelefono(telefono: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const command = new ScanCommand({
        TableName: this.TABLE_NAME,
        FilterExpression: 'contains(Telefono, :telefono)',
        ExpressionAttributeValues: {
          ':telefono': telefono
        }
      });

      const result = await docClient.send(command);
      
      const pacientes = result.Items?.filter(item => 
        item.NombreColeccion === this.COLLECTION_NAME
      ) || [];

      return { success: true, data: pacientes };

    } catch (error) {
      console.error('Error buscando pacientes por teléfono:', error);
      return { success: false, error: 'Error al buscar pacientes' };
    }
  }

  // En PacienteService.ts
// En PacienteService.ts
static async contarSolicitudesPorPaciente(pacienteId: string): Promise<number> {
  try {
    const command = new ScanCommand({
      TableName: this.TABLE_NAME,
      FilterExpression: 'NombreColeccion = :coleccion AND contains(PacienteId, :pacienteId)',
      ExpressionAttributeValues: {
        ':coleccion': 'dbo_Solicitudes',
        ':pacienteId': pacienteId
      }
    });

    const result = await docClient.send(command);
    return result.Items?.length || 0;
  } catch (error) {
    console.error('Error contando solicitudes:', error);
    return 0;
  }
}
// CORRECCIÓN en buscarPacientePorID
// src/services/pacienteService.ts
// src/services/pacienteService.ts
static async buscarPacientePorID(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('🔍 Buscando paciente con ID:', id);
    
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
      
      // En PacienteService.buscarPacientePorID, después de obtener los datos:
if (result.Item) {
  const paciente = {
    id: result.Item.Id,
    nombre: result.Item.Nombre,
    apellidoPat: result.Item.ApellidoPat,
    apellidoMat: result.Item.ApellidoMat,
    telefono: result.Item.Telefono || '',
    email: result.Item.Email || '',
    direccion: result.Item.Direccion || '',
    sexo: result.Item.Sexo || '',
    fechaNacimiento: result.Item.FechaNacimiento || '',
    createdAt: result.Item.CreatedAt,
    updatedAt: result.Item.UpdatedAt
  };
  return { success: true, data: paciente };
}
    } catch (error) {
      console.log('⚠️ Primera estructura falló para paciente, intentando alternativa...');
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
        console.log('✅ Paciente encontrado con estructura simple:', result.Item);
        // Transformar a formato Paciente
        const paciente = {
          id: result.Item.Id,
          nombre: result.Item.Nombre,
          apellidoPat: result.Item.ApellidoPat,
          apellidoMat: result.Item.ApellidoMat,
          telefono: result.Item.Telefono,
          email: result.Item.Email,
          direccion: result.Item.Direccion,
          sexo: result.Item.Sexo,
          fechaNacimiento: result.Item.FechaNacimiento,
          createdAt: result.Item.CreatedAt,
          updatedAt: result.Item.UpdatedAt
        };
        return { success: true, data: paciente };
      }
    } catch (error) {
      console.log('⚠️ Segunda estructura también falló para paciente');
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
        console.log('✅ Paciente encontrado con SCAN:', result.Items[0]);
        const item = result.Items[0];
        // Transformar a formato Paciente
        const paciente = {
          id: item.Id,
          nombre: item.Nombre,
          apellidoPat: item.ApellidoPat,
          apellidoMat: item.ApellidoMat,
          telefono: item.Telefono,
          email: item.Email,
          direccion: item.Direccion,
          sexo: item.Sexo,
          fechaNacimiento: item.FechaNacimiento,
          createdAt: item.CreatedAt,
          updatedAt: item.UpdatedAt
        };
        return { success: true, data: paciente };
      }
    } catch (error) {
      console.error('Error con SCAN para paciente:', error);
    }

    return { success: false, error: 'Paciente no encontrado' };

  } catch (error) {
    console.error('❌ Error buscando paciente por ID:', error);
    return { success: false, error: 'Error al buscar paciente' };
  }
}

// En PacienteService.ts - agrega este método
static async diagnosticarPacienteEspecifico(pacienteId: string) {
  try {
    const command = new ScanCommand({
      TableName: this.TABLE_NAME,
      FilterExpression: 'contains(Id, :id) AND NombreColeccion = :coleccion',
      ExpressionAttributeValues: {
        ':id': pacienteId,
        ':coleccion': this.COLLECTION_NAME
      }
    });

    const result = await docClient.send(command);
    console.log('🔍 Paciente específico encontrado:', result.Items);
    return { success: true, data: result.Items };
  } catch (error) {
    console.error('Error en diagnóstico específico de paciente:', error);
    return { success: false, error: 'Error en diagnóstico' };
  }
}
}