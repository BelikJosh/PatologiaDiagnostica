// src/services/solicitudService.ts
import { docClient, s3Client } from '../aws-config';
import { GetCommand, PutCommand, QueryCommand, ScanCommand, UpdateCommand  } from "@aws-sdk/lib-dynamodb";
import { PacienteService

 } from './PacienteService';
import { PutObjectCommand } from '@aws-sdk/client-s3';
export interface Solicitud {
  id?: string;
  requiereFirma: boolean;
  tipoEstudio: string;
  medicoSolicitante: string;
  pacienteNombre: string;
  fechaRecepcion: string;
  procedencia?: string;
  precioEstudio: number;
  precioEstudioEspecial?: number;
  anticipo: number;
  totalPagado?: number;
  tipoPago?: string;
  observacionesPago?: string;
  datosClinicos?: string;
  estatus: string; // Cambiado para aceptar diferentes estatus
  factura?: string;
  numeroRegistro?: string;
  idEstatusEstudio?: number; // Agregar este campo
}
export interface ActualizarEstatusRequest {
  id: string;
  nuevoEstatus: number;
  fechaMacro?: string; // Para cuando se complete macroscópico
  fechaMicro?: string; // Para cuando se complete microscópico
}

export interface EstudioMacroscopicoData {
  solicitudId: string;
  descripcionMacroscopica: string;
  requiereFirma: boolean;
  archivos: any[];
  usuarioId: string;
}

export interface ActualizarEstatusRequest {
  id: string;
  nuevoEstatus: number;
  fechaMacro?: string;
  fechaMicro?: string;
}


export class SolicitudService {
  static readonly TABLE_NAME = 'PatologiaApp';
  static readonly COLLECTION_NAME = 'dbo_Solicitudes';

 // En src/services/solicitudService.ts - modifica createSolicitud
// En SolicitudService.ts - modifica createSolicitud
static async createSolicitud(solicitud: Solicitud): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const id = this.generateId();
    const now = new Date().toISOString();

    // 1. Guardar el paciente
    const pacienteResult = await PacienteService.crearPacienteDesdeSolicitud({
      nombre: solicitud.pacienteNombre,
      telefono: solicitud.telefonoPaciente || '',
      direccion: solicitud.procedencia || '',
      sexo: solicitud.sexoPaciente || 'N/A',
      fechaCreacion: solicitud.fechaRecepcion || now
    });

    // 2. Guardar la solicitud con estatus "Iniciado" e idEstatusEstudio = 1
    const item = {
      ColeccionID: `${this.COLLECTION_NAME}#${id}`,
      NombreColeccion: this.COLLECTION_NAME,
      Id: id,
      PacienteId: pacienteResult.id,
      PacienteNombre: solicitud.pacienteNombre,
      MedicoSolicitante: solicitud.medicoSolicitante,
      TipoEstudio: solicitud.tipoEstudio,
      FechaRecepcion: solicitud.fechaRecepcion,
      Procedencia: solicitud.procedencia || '',
      PrecioEstudio: solicitud.precioEstudio,
      Anticipo: solicitud.anticipo,
      Estatus: 'Iniciado', // Cambiado de 'Pendiente' a 'Iniciado'
      IdEstatusEstudio: 1, // Agregado: 1 = Iniciado
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
    console.error('Error creando solicitud:', error);
    return { success: false, error: 'Error al guardar la solicitud' };
  }
}

  // Actualiza el método getSolicitudes en solicitudService.ts
// En tu solicitudService.ts, agrega este método si no existe:
static async getSolicitudes(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    // Si usas una estructura de clave compuesta (ColeccionID)
    const command = new QueryCommand({
      TableName: this.TABLE_NAME,
      KeyConditionExpression: "NombreColeccion = :nombreColeccion",
      ExpressionAttributeValues: {
        ":nombreColeccion": this.COLLECTION_NAME
      }
    });

    const result = await docClient.send(command);
    return { success: true, data: result.Items || [] };

  } catch (error) {
    console.error('Error obteniendo solicitudes:', error);
    
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
      return { success: false, error: 'Error al obtener las solicitudes' };
    }
  }
}

  // Método alternativo usando Scan (si el query no funciona)
  static async getSolicitudesScan(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { ScanCommand } = await import("@aws-sdk/lib-dynamodb");
      
      const command = new ScanCommand({
        TableName: this.TABLE_NAME,
        FilterExpression: 'NombreColeccion = :nombreColeccion',
        ExpressionAttributeValues: {
          ':nombreColeccion': this.COLLECTION_NAME
        }
      });

      const result = await docClient.send(command);
      return { success: true, data: result.Items || [] };

    } catch (error) {
      console.error('❌ Error obteniendo solicitudes (scan):', error);
      return { success: false, error: 'Error al obtener las solicitudes' };
    }
  }
   static async registrarPago(
    id: string, 
    montoPago: number, 
    tipoPago: number, 
    descripcion?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Obtener la solicitud actual
      const solicitudResult = await this.getSolicitudById(id);
      
      if (!solicitudResult.success || !solicitudResult.data) {
        return { success: false, error: 'Solicitud no encontrada' };
      }
      
      const solicitud = solicitudResult.data;
      const nuevoTotalPagado = (solicitud.totalPagado || solicitud.anticipo || 0) + montoPago;
      const nuevoEstatus = nuevoTotalPagado >= solicitud.precioEstudio ? 'pagado' : 'en proceso de pago';
      
      // Actualizar la solicitud con el nuevo pago
      const command = new UpdateCommand({
        TableName: this.TABLE_NAME,
        Key: {
          ColeccionID: `${this.COLLECTION_NAME}#${id}`,
          NombreColeccion: this.COLLECTION_NAME
        },
        UpdateExpression: 'SET TotalPagado = :totalPagado, Estatus = :estatus, UpdatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':totalPagado': nuevoTotalPagado,
          ':estatus': nuevoEstatus,
          ':updatedAt': new Date().toISOString()
        },
        ReturnValues: 'ALL_NEW'
      });
      
      await docClient.send(command);
      return { success: true };
      
    } catch (error) {
      console.error('Error registrando pago:', error);
      return { success: false, error: 'Error al registrar el pago' };
    }
  }

  // Método para actualizar la factura
  static async actualizarFactura(
    id: string, 
    factura: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const command = new UpdateCommand({
        TableName: this.TABLE_NAME,
        Key: {
          ColeccionID: `${this.COLLECTION_NAME}#${id}`,
          NombreColeccion: this.COLLECTION_NAME
        },
        UpdateExpression: 'SET Factura = :factura, UpdatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':factura': factura,
          ':updatedAt': new Date().toISOString()
        },
        ReturnValues: 'ALL_NEW'
      });
      
      await docClient.send(command);
      return { success: true };
      
    } catch (error) {
      console.error('Error actualizando factura:', error);
      return { success: false, error: 'Error al actualizar la factura' };
    }
  }


  // En src/services/solicitudService.ts
static async actualizarEstudioEspecial(
  id: string, 
  estudioEspecial: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new UpdateCommand({
      TableName: this.TABLE_NAME,
      Key: {
        ColeccionID: `${this.COLLECTION_NAME}#${id}`,
        NombreColeccion: this.COLLECTION_NAME
      },
      UpdateExpression: 'SET EstudioEspecial = :estudioEspecial, UpdatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':estudioEspecial': estudioEspecial,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    });
    
    await docClient.send(command);
    return { success: true };
    
  } catch (error) {
    console.error('Error actualizando estudio especial:', error);
    return { success: false, error: 'Error al actualizar estudio especial' };
  }
}

static async actualizarEstatusPago(
  id: string, 
  estatusPago: string,
  totalPagado: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new UpdateCommand({
      TableName: this.TABLE_NAME,
      Key: {
        ColeccionID: `${this.COLLECTION_NAME}#${id}`,
        NombreColeccion: this.COLLECTION_NAME
      },
      UpdateExpression: 'SET EstatusPago = :estatusPago, TotalPagado = :totalPagado, UpdatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':estatusPago': estatusPago,
        ':totalPagado': totalPagado,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    });
    
    await docClient.send(command);
    return { success: true };
    
  } catch (error) {
    console.error('Error actualizando estatus de pago:', error);
    return { success: false, error: 'Error al actualizar estatus de pago' };
  }
}

  // En src/services/solicitudService.ts
static async obtenerSolicitudesPorPaciente(pacienteId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const command = new ScanCommand({
      TableName: this.TABLE_NAME,
      FilterExpression: 'NombreColeccion = :nombreColeccion AND PacienteId = :pacienteId',
      ExpressionAttributeValues: {
        ':nombreColeccion': this.COLLECTION_NAME,
        ':pacienteId': pacienteId
      }
    });

    const result = await docClient.send(command);
    return { success: true, data: result.Items || [] };

  } catch (error) {
    console.error('Error obteniendo solicitudes por paciente:', error);
    return { success: false, error: 'Error al obtener solicitudes' };
  }
}
  // Método para obtener una solicitud por ID
// En SolicitudService.ts - getSolicitudById
// src/services/solicitudService.ts
// src/services/solicitudService.ts
static async getSolicitudById(solicitudId: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('🔍 Buscando solicitud con ID:', solicitudId);
    
    // PRIMERO intenta con la estructura que debería ser
    try {
      const command = new GetCommand({
        TableName: this.TABLE_NAME,
        Key: {
          ColeccionID: `${this.COLLECTION_NAME}#${solicitudId}`,
          NombreColeccion: this.COLLECTION_NAME
        }
      });

      const result = await docClient.send(command);
      
      if (result.Item) {
        console.log('✅ Solicitud encontrada con estructura #:', result.Item);
        return { success: true, data: result.Item };
      }
    } catch (error) {
      console.log('⚠️ Primera estructura falló, intentando alternativa...');
    }

    // SEGUNDO intento - sin el # en ColeccionID
    try {
      const command = new GetCommand({
        TableName: this.TABLE_NAME,
        Key: {
          ColeccionID: solicitudId, // Solo el ID, sin prefijo
          NombreColeccion: this.COLLECTION_NAME
        }
      });

      const result = await docClient.send(command);
      
      if (result.Item) {
        console.log('✅ Solicitud encontrada con estructura simple:', result.Item);
        return { success: true, data: result.Item };
      }
    } catch (error) {
      console.log('⚠️ Segunda estructura también falló');
    }

    // TERCER intento - usando SCAN como fallback
    try {
      const scanCommand = new ScanCommand({
        TableName: this.TABLE_NAME,
        FilterExpression: 'Id = :id AND NombreColeccion = :coleccion',
        ExpressionAttributeValues: {
          ':id': solicitudId,
          ':coleccion': this.COLLECTION_NAME
        }
      });

      const result = await docClient.send(scanCommand);
      
      if (result.Items && result.Items.length > 0) {
        console.log('✅ Solicitud encontrada con SCAN:', result.Items[0]);
        return { success: true, data: result.Items[0] };
      }
    } catch (error) {
      console.error('Error con SCAN:', error);
    }

    return { success: false, error: 'Solicitud no encontrada' };

  } catch (error) {
    console.error('❌ Error obteniendo solicitud:', error);
    return { success: false, error: 'Error al obtener la solicitud' };
  }
}
  private static generateId(): string {
    return `SOL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
static async obtenerPacientesDeSolicitudesCompleto(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const solicitudesResult = await this.getSolicitudes();
    
    if (!solicitudesResult.success || !solicitudesResult.data) {
      return { success: false, error: 'Error al obtener solicitudes' };
    }

    const pacientesMap = new Map();

    solicitudesResult.data.forEach(solicitud => {
      const pacienteId = solicitud.PacienteId || solicitud.pacienteId;
      const pacienteNombre = solicitud.PacienteNombre || solicitud.pacienteNombre;
      
      if (pacienteId && pacienteNombre) {
        if (!pacientesMap.has(pacienteId)) {
          pacientesMap.set(pacienteId, {
            id: pacienteId,
            nombre: pacienteNombre,
            tipoEstudios: new Set([solicitud.TipoEstudio || solicitud.tipoEstudio]),
            medicos: new Set([solicitud.MedicoSolicitante || solicitud.medicoSolicitante]),
            totalSolicitudes: 1,
            primeraSolicitud: solicitud.FechaRecepcion || solicitud.fechaRecepcion,
            ultimaSolicitud: solicitud.FechaRecepcion || solicitud.fechaRecepcion,
            procedencia: solicitud.Procedencia || solicitud.procedencia,
            totalMonto: solicitud.PrecioEstudio || solicitud.precioEstudio || 0
          });
        } else {
          const paciente = pacientesMap.get(pacienteId);
          paciente.totalSolicitudes += 1;
          paciente.tipoEstudios.add(solicitud.TipoEstudio || solicitud.tipoEstudio);
          paciente.medicos.add(solicitud.MedicoSolicitante || solicitud.medicoSolicitante);
          paciente.totalMonto += solicitud.PrecioEstudio || solicitud.precioEstudio || 0;
          
          if (solicitud.FechaRecepcion > paciente.ultimaSolicitud) {
            paciente.ultimaSolicitud = solicitud.FechaRecepcion;
          }
        }
      }
    });

    // Convertir Sets a Arrays para la respuesta
    const pacientesArray = Array.from(pacientesMap.values()).map(paciente => ({
      ...paciente,
      tipoEstudios: Array.from(paciente.tipoEstudios),
      medicos: Array.from(paciente.medicos),
      // Calcular monto promedio
      montoPromedio: paciente.totalMonto / paciente.totalSolicitudes
    }));

    return { 
      success: true, 
      data: pacientesArray.sort((a, b) => b.totalSolicitudes - a.totalSolicitudes) 
    };

  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: 'Error al obtener datos' };
  }
}
// En solicitudService.ts - método temporal de diagnóstico
static async diagnosticarSolicitudEspecifica(solicitudId: string) {
  try {
    const command = new ScanCommand({
      TableName: this.TABLE_NAME,
      FilterExpression: 'contains(Id, :id) AND NombreColeccion = :coleccion',
      ExpressionAttributeValues: {
        ':id': solicitudId,
        ':coleccion': this.COLLECTION_NAME
      }
    });

    const result = await docClient.send(command);
    console.log('🔍 Solicitud específica encontrada:', result.Items);
    return { success: true, data: result.Items };
  } catch (error) {
    console.error('Error en diagnóstico específico:', error);
    return { success: false, error: 'Error en diagnóstico' };
  }
}
// Agrega este método temporal en solicitudService.ts
static async diagnosticarEstructura() {
  try {
    // 1. Haz un scan para ver cómo están estructurados los datos
    const scanCommand = new ScanCommand({
      TableName: this.TABLE_NAME,
      Limit: 5 // Solo trae 5 registros para diagnosticar
    });

    const scanResult = await docClient.send(scanCommand);
    console.log('🔍 Estructura de datos en DynamoDB:', scanResult.Items);
    
    // 2. Revisa las claves de los primeros items
    if (scanResult.Items && scanResult.Items.length > 0) {
      scanResult.Items.forEach((item, index) => {
        console.log(`📋 Item ${index + 1} keys:`, Object.keys(item));
        console.log(`📋 Item ${index + 1} completo:`, item);
      });
    }
    
    return { success: true, data: scanResult.Items };
  } catch (error) {
    console.error('Error en diagnóstico:', error);
    return { success: false, error: 'Error en diagnóstico' };
  }
}
// En src/services/solicitudService.ts - agrega estos métodos
// En solicitudService.ts - CORREGIR actualizarEstatusSolicitud
static async actualizarEstatusSolicitud(
  solicitudId: string, 
  nuevoEstatus: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const fechaActual = new Date().toISOString();
    
    // ✅ VERIFICA LA ESTRUCTURA EXACTA DE TU TABLA
    // La clave probablemente es diferente
    const params = {
      TableName: this.TABLE_NAME,
      Key: {
        // ❗ Esto depende de tu estructura real de tabla
        // Posibles opciones:
        id: solicitudId, // Si tu partition key es "id"
        ColeccionID: `${this.COLLECTION_NAME}#${solicitudId}`, // Si usas ColeccionID
        // o tal vez:
        // Id: solicitudId,
        // SolicitudId: solicitudId,
      },
      UpdateExpression: 'SET IdEstatusEstudio = :estatus, UpdatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':estatus': nuevoEstatus,
        ':updatedAt': fechaActual
      },
      ReturnValues: 'ALL_NEW'
    };

    // ✅ Agregar campos adicionales según el estatus
    if (nuevoEstatus === 2) {
      params.UpdateExpression += ', FechaMacro = :fechaMacro';
      params.ExpressionAttributeValues[':fechaMacro'] = fechaActual;
    } else if (nuevoEstatus === 3) {
      params.UpdateExpression += ', FechaMicro = :fechaMicro';
      params.ExpressionAttributeValues[':fechaMicro'] = fechaActual;
    }

    await docClient.send(new UpdateCommand(params));
    return { success: true };
  } catch (error) {
    console.error('Error actualizando estatus:', error);
    return { success: false, error: 'Error al actualizar el estatus' };
  }
}
// Método para guardar estudio macroscópico
// En src/services/solicitudService.ts - modifica el método guardarEstudioMacroscopico
static async guardarEstudioMacroscopico(data: any): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Subir archivos a S3 y obtener URLs
    const archivosMetadata = await this.subirArchivosAS3(data.archivos, data.solicitudId);

    // 2. Guardar en DynamoDB el estudio macroscópico
    const estudioParams = {
      TableName: this.TABLE_NAME,
      Item: {
        ColeccionID: `EstudioMacroscopico#${data.solicitudId}`,
        NombreColeccion: 'EstudiosMacroscopicos',
        SolicitudId: data.solicitudId,
        DescripcionMacroscopica: data.descripcionMacroscopica,
        RequiereFirma: data.requiereFirma,
        Archivos: archivosMetadata, // ahora incluye URLs de S3
        UsuarioId: data.usuarioId,
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString()
      }
    };

    await docClient.send(new PutCommand(estudioParams));

    // 3. Actualizar estatus a "Macroscópico completo" (2)
    await this.actualizarEstatusSolicitud(data.solicitudId, 2);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error guardando estudio macroscópico:', error);
    return { success: false, error: 'Error al guardar el estudio' };
  }
}


// En solicitudService.ts - agregar método de diagnóstico
static async diagnosticarEstructuraTabla(solicitudId: string) {
  try {
    console.log('🔍 Diagnosticando estructura de tabla...');
    
    // Intentar diferentes estructuras de clave
    const posiblesClaves = [
      { id: solicitudId },
      { ColeccionID: `${this.COLLECTION_NAME}#${solicitudId}` },
      { ColeccionID: solicitudId },
      { Id: solicitudId },
      { SolicitudId: solicitudId }
    ];

    for (const key of posiblesClaves) {
      try {
        const command = new GetCommand({
          TableName: this.TABLE_NAME,
          Key: key
        });

        const result = await docClient.send(command);
        if (result.Item) {
          console.log('✅ Estructura correcta encontrada:', key);
          console.log('📋 Item completo:', result.Item);
          return key;
        }
      } catch (error) {
        console.log('❌ Intento fallado con:', key);
      }
    }

    console.error('❌ No se encontró la estructura correcta');
    return null;

  } catch (error) {
    console.error('Error en diagnóstico:', error);
    return null;
  }
}
// En solicitudService.ts - REEMPLAZAR el método subirArchivosAS3
// En solicitudService.ts
static async subirArchivosAS3(archivos: File[], solicitudId: string): Promise<any[]> {
  try {
    const resultados: any[] = [];

    for (const file of archivos) {
      // Crear el nombre único del archivo en S3
      const key = `macroscopico/${solicitudId}/${Date.now()}_${file.name}`;

      // Subir a S3
      const uploadCommand = new PutObjectCommand({
        Bucket: 'tu-bucket-s3', // 🔹 reemplázalo con el nombre real de tu bucket
        Key: key,
        Body: file,
        ContentType: file.type
      });

      await s3Client.send(uploadCommand);

      // Generar URL de acceso (si tu bucket es público)
      const url = `https://${'tu-bucket-s3'}.s3.amazonaws.com/${key}`;

      // Guardar metadata
      resultados.push({
        nombre: file.name,
        tamaño: file.size,
        tipo: file.type,
        fechaSubida: new Date().toISOString(),
        url
      });
    }

    return resultados;
  } catch (error) {
    console.error('❌ Error subiendo archivos a S3:', error);
    return [];
  }
}

// Método para guardar estudio microscópico
static async guardarEstudioMicroscopico(data: any): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Guardar el estudio microscópico
    const estudioParams = {
      TableName: this.TABLE_NAME,
      Item: {
        ColeccionID: `EstudioMicroscopico#${data.solicitudId}`,
        NombreColeccion: 'EstudiosMicroscopicos',
        SolicitudId: data.solicitudId,
        Descripciones: data.descripciones,
        Diagnostico: data.diagnostico,
        EsMaligno: data.esMaligno,
        Imagenes: data.imagenes,
        UsuarioId: data.usuarioId,
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString()
      }
    };

    await docClient.send(new PutCommand(estudioParams));

    // 2. Actualizar estatus a EN DIAGNÓSTICO (3)
    await this.actualizarEstatusSolicitud(data.solicitudId, 3);
    
    return { success: true };
  } catch (error) {
    console.error('Error guardando estudio microscópico:', error);
    return { success: false, error: 'Error al guardar el estudio' };
  }
}

static async actualizarEstatus(request: ActualizarEstatusRequest): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    let updateExpression = 'SET IdEstatusEstudio = :estatus, UpdatedAt = :updatedAt';
    const expressionAttributeValues: any = {
      ':estatus': request.nuevoEstatus,
      ':updatedAt': new Date().toISOString()
    };

    // Agregar campos condicionalmente
    if (request.fechaMacro) {
      updateExpression += ', FechaMacro = :fechaMacro';
      expressionAttributeValues[':fechaMacro'] = request.fechaMacro;
    }

    if (request.fechaMicro) {
      updateExpression += ', FechaMicro = :fechaMicro';
      expressionAttributeValues[':fechaMicro'] = request.fechaMicro;
    }

    const params = {
      TableName: this.TABLE_NAME,
      Key: {
        ColeccionID: `${this.COLLECTION_NAME}#${request.id}`,
        NombreColeccion: this.COLLECTION_NAME
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(params));
    return { success: true, data: result.Attributes };
  } catch (error) {
    console.error('Error actualizando estatus:', error);
    return { success: false, error: 'Error al actualizar el estatus' };
  }
}
// Llama a este método desde tu componente para ver la estructura real
  
}