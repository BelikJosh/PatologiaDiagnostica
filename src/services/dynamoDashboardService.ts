// src/services/dynamoDashboardService.ts
import { docClient } from '../aws-config';
import { ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

export interface Solicitud {
  id: string;
  paciente: string;
  tipoEstudio: string;
  estatus: string;
  prioridad: string;
  fechaSolicitud: string;
  medico: string;
  monto?: number;
  precioEstudio?: number;
  anticipo?: number;
}

export interface MetricasDashboard {
  totalSolicitudes: number;
  concluidas: number;
  enProceso: number;
  pendientes: number;
  ingresosTotales: number;
  eficiencia: number;
  crecimiento: number;
}

export interface DatosGraficas {
  estudiosData: { name: string; value: number; color: string }[];
  ingresosData: { month: string; ingresos: number; meta: number; consultas: number }[];
}

class DashboardService {
  static readonly TABLE_NAME = 'PatologiaApp';
  static readonly SOLICITUDES_COLLECTION = 'dbo_Solicitudes';

  // Obtener métricas del dashboard
  static async getMetricas(): Promise<MetricasDashboard> {
    try {
      // Obtener todas las solicitudes
      const solicitudes = await this.obtenerTodasLasSolicitudes();
      
      // Calcular métricas
      const totalSolicitudes = solicitudes.length;
      const concluidas = solicitudes.filter(s => 
        s.estatus?.toLowerCase().includes('concluid') || 
        s.estatus?.toLowerCase().includes('complet')
      ).length;
      
      const enProceso = solicitudes.filter(s => 
        s.estatus?.toLowerCase().includes('proces') || 
        s.estatus?.toLowerCase().includes('progres')
      ).length;
      
      const pendientes = solicitudes.filter(s => 
        s.estatus?.toLowerCase().includes('pendient') || 
        s.estatus?.toLowerCase().includes('nuev')
      ).length;

      // Calcular ingresos totales (suma de precios de estudios completados)
      const ingresosTotales = solicitudes
        .filter(s => s.estatus?.toLowerCase().includes('concluid') || s.estatus?.toLowerCase().includes('complet'))
        .reduce((total, s) => total + (s.precioEstudio || s.monto || 0), 0);

      // Calcular eficiencia (porcentaje de estudios completados)
      const eficiencia = totalSolicitudes > 0 ? Math.round((concluidas / totalSolicitudes) * 100) : 0;

      // Crecimiento (simulado - en una app real se calcularía comparando con el mes anterior)
      const crecimiento = 12.5; // Esto sería dinámico en producción

      return {
        totalSolicitudes,
        concluidas,
        enProceso,
        pendientes,
        ingresosTotales,
        eficiencia,
        crecimiento
      };

    } catch (error) {
      console.error('Error obteniendo métricas:', error);
      throw new Error('No se pudieron cargar las métricas del dashboard');
    }
  }

  // Obtener últimas solicitudes
  static async getUltimasSolicitudes(limit: number = 5): Promise<Solicitud[]> {
    try {
      const solicitudes = await this.obtenerTodasLasSolicitudes();
      
      // Ordenar por fecha más reciente y limitar
      return solicitudes
        .sort((a, b) => new Date(b.fechaSolicitud || b.createdAt || 0).getTime() - 
                        new Date(a.fechaSolicitud || a.createdAt || 0).getTime())
        .slice(0, limit)
        .map(s => ({
          id: s.id || s.Id || '',
          paciente: s.pacienteNombre || s.PacienteNombre || s.paciente || 'Paciente',
          tipoEstudio: s.tipoEstudio || s.TipoEstudio || 'Estudio',
          estatus: s.estatus || s.Estatus || 'pendiente',
          prioridad: this.determinarPrioridad(s),
          fechaSolicitud: s.fechaRecepcion || s.FechaRecepcion || s.createdAt || new Date().toISOString(),
          medico: s.medicoSolicitante || s.MedicoSolicitante || 'Médico',
          monto: s.precioEstudio || s.PrecioEstudio || 0
        }));

    } catch (error) {
      console.error('Error obteniendo últimas solicitudes:', error);
      throw new Error('No se pudieron cargar las últimas solicitudes');
    }
  }

  // Obtener datos para gráficas
  static async getDatosGraficas(): Promise<DatosGraficas> {
    try {
      const solicitudes = await this.obtenerTodasLasSolicitudes();
      const currentYear = new Date().getFullYear();
      
      // Datos de estudios por tipo
      const estudiosCount: { [key: string]: number } = {};
      solicitudes.forEach(s => {
        const tipo = s.tipoEstudio || s.TipoEstudio || 'Otro';
        estudiosCount[tipo] = (estudiosCount[tipo] || 0) + 1;
      });

      const estudiosData = Object.entries(estudiosCount).map(([name, value], index) => ({
        name,
        value,
        color: this.getColorByIndex(index)
      }));

      // Datos de ingresos mensuales (simulados para el ejemplo)
      const ingresosData = this.generarDatosIngresosMensuales(solicitudes, currentYear);

      return { estudiosData, ingresosData };

    } catch (error) {
      console.error('Error obteniendo datos de gráficas:', error);
      throw new Error('No se pudieron cargar los datos para gráficas');
    }
  }

  // Método privado para obtener todas las solicitudes
  private static async obtenerTodasLasSolicitudes(): Promise<any[]> {
    try {
      // Intentar con query primero
      try {
        const queryCommand = new QueryCommand({
          TableName: this.TABLE_NAME,
          KeyConditionExpression: "NombreColeccion = :nombreColeccion",
          ExpressionAttributeValues: {
            ":nombreColeccion": this.SOLICITUDES_COLLECTION
          }
        });

        const result = await docClient.send(queryCommand);
        return result.Items || [];
      } catch (queryError) {
        console.log('Query falló, intentando con scan...');
        
        // Si falla el query, usar scan
        const scanCommand = new ScanCommand({
          TableName: this.TABLE_NAME,
          FilterExpression: 'NombreColeccion = :nombreColeccion',
          ExpressionAttributeValues: {
            ':nombreColeccion': this.SOLICITUDES_COLLECTION
          }
        });

        const result = await docClient.send(scanCommand);
        return result.Items || [];
      }
    } catch (error) {
      console.error('Error obteniendo solicitudes:', error);
      return [];
    }
  }

  // Determinar prioridad basada en tipo de estudio y estatus
  private static determinarPrioridad(solicitud: any): string {
    const tipo = (solicitud.tipoEstudio || solicitud.TipoEstudio || '').toLowerCase();
    const estatus = (solicitud.estatus || solicitud.Estatus || '').toLowerCase();

    if (tipo.includes('urgent') || estatus.includes('urgent')) return 'alta';
    if (tipo.includes('biopsia') || tipo.includes('cancer')) return 'alta';
    if (tipo.includes('citologia')) return 'media';
    return 'baja';
  }

  // Generar colores para gráficas
  private static getColorByIndex(index: number): string {
    const colors = [
      '#1890ff', '#52c41a', '#faad14', '#722ed1', '#13c2c2',
      '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb', '#f5222d'
    ];
    return colors[index % colors.length];
  }

  // Generar datos de ingresos mensuales (simulados)
  private static generarDatosIngresosMensuales(solicitudes: any[], year: number): any[] {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentMonth = new Date().getMonth();
    
    return meses.slice(0, currentMonth + 1).map((month, index) => {
      // Filtrar solicitudes del mes (simulado)
      const solicitudesMes = solicitudes.filter(s => {
        const fecha = new Date(s.fechaRecepcion || s.FechaRecepcion || s.createdAt);
        return fecha.getMonth() === index && fecha.getFullYear() === year;
      });

      const ingresos = solicitudesMes.reduce((total, s) => total + (s.precioEstudio || s.PrecioEstudio || 0), 0);
      const meta = 50000 + (index * 5000); // Meta incremental
      const consultas = solicitudesMes.length;

      return {
        month,
        ingresos,
        meta,
        consultas
      };
    });
  }

  // Método para generar reporte Excel
  static async generarReporteExcel(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const solicitudes = await this.obtenerTodasLasSolicitudes();
      
      // Formatear datos para Excel
      const datosExcel = solicitudes.map(s => ({
        'Número de Registro': s.numeroRegistro || s.NumeroRegistro || s.id,
        'Paciente': s.pacienteNombre || s.PacienteNombre,
        'Tipo de Estudio': s.tipoEstudio || s.TipoEstudio,
        'Estatus': s.estatus || s.Estatus,
        'Médico': s.medicoSolicitante || s.MedicoSolicitante,
        'Fecha Recepción': s.fechaRecepcion || s.FechaRecepcion,
        'Precio': s.precioEstudio || s.PrecioEstudio || 0,
        'Anticipo': s.anticipo || s.Anticipo || 0,
        'Procedencia': s.procedencia || s.Procedencia
      }));

      return { success: true, data: datosExcel };

    } catch (error) {
      console.error('Error generando reporte Excel:', error);
      return { success: false, error: 'Error al generar el reporte' };
    }
  }
}

export default DashboardService;