// src/services/cuentasService.ts
import { docClient } from '../aws-config';
import { QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

export interface Pago {
  id: string;
  solicitudId: string;
  monto: number;
  tipoPago: string;
  fechaPago: string;
  descripcion?: string;
}

export class CuentasService {
  static readonly TABLE_NAME = 'PatologiaApp';
  static readonly SOLICITUDES_COLLECTION = 'dbo_Solicitudes';
  static readonly PAGOS_COLLECTION = 'dbo_Pagos';

  // Obtener todas las solicitudes con sus pagos
  static async getCuentas(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      // Obtener todas las solicitudes
      const solicitudesCommand = new ScanCommand({
        TableName: this.TABLE_NAME,
        FilterExpression: 'NombreColeccion = :nombreColeccion',
        ExpressionAttributeValues: {
          ':nombreColeccion': this.SOLICITUDES_COLLECTION
        }
      });

      const solicitudesResult = await docClient.send(solicitudesCommand);
      
      if (!solicitudesResult.Items || solicitudesResult.Items.length === 0) {
        return { success: true, data: [] };
      }

      // Obtener todos los pagos
      const pagosCommand = new ScanCommand({
        TableName: this.TABLE_NAME,
        FilterExpression: 'NombreColeccion = :nombreColeccion',
        ExpressionAttributeValues: {
          ':nombreColeccion': this.PAGOS_COLLECTION
        }
      });

      const pagosResult = await docClient.send(pagosCommand);
      
      // Procesar las solicitudes y calcular los totales pagados
      const cuentasData = solicitudesResult.Items.map((solicitud: any) => {
        // Encontrar los pagos para esta solicitud
        const pagosSolicitud = this.obtenerPagosParaSolicitud(pagosResult.Items, solicitud.Id);
        const totalPagado = this.calcularTotalPagado(pagosSolicitud);
        
        return {
          ...solicitud,
          TotalPagado: totalPagado,
          Pagos: pagosSolicitud,
          EstatusPago: this.determinarEstatusPago(solicitud.PrecioEstudio, totalPagado)
        };
      });

      return { success: true, data: cuentasData };

    } catch (error) {
      console.error('Error obteniendo cuentas:', error);
      return { success: false, error: 'Error al obtener las cuentas' };
    }
  }

  // Registrar un nuevo pago
  static async registrarPago(
    solicitudId: string, 
    montoPago: number, 
    tipoPago: number, 
    descripcion?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Primero obtener el registro de pagos actual
      const pagosCommand = new QueryCommand({
        TableName: this.TABLE_NAME,
        KeyConditionExpression: "ColeccionID = :coleccionId AND NombreColeccion = :nombreColeccion",
        ExpressionAttributeValues: {
          ":coleccionId": `${this.PAGOS_COLLECTION}#0`,
          ":nombreColeccion": this.PAGOS_COLLECTION
        }
      });

      const pagosResult = await docClient.send(pagosCommand);
      
      let pagosItem;
      if (pagosResult.Items && pagosResult.Items.length > 0) {
        pagosItem = pagosResult.Items[0];
      } else {
        // Crear nuevo registro de pagos si no existe
        pagosItem = {
          ColeccionID: `${this.PAGOS_COLLECTION}#0`,
          NombreColeccion: this.PAGOS_COLLECTION,
          Registros: [],
          TotalRegistros: 0,
          FechaCarga: new Date().toISOString()
        };
      }

      // Crear nuevo pago
      const nuevoPago = {
        id: `PAG-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        solicitudId: solicitudId,
        monto: montoPago,
        tipoPago: this.obtenerTipoPagoTexto(tipoPago),
        fechaPago: new Date().toISOString(),
        descripcion: descripcion || ''
      };

      // Agregar el nuevo pago a la lista
      const nuevosRegistros = [...(pagosItem.Registros || []), nuevoPago];

      // Actualizar el registro de pagos
      const updateCommand = new PutCommand({
        TableName: this.TABLE_NAME,
        Item: {
          ...pagosItem,
          Registros: nuevosRegistros,
          TotalRegistros: nuevosRegistros.length,
          UpdatedAt: new Date().toISOString()
        }
      });

      await docClient.send(updateCommand);
      return { success: true };

    } catch (error) {
      console.error('Error registrando pago:', error);
      return { success: false, error: 'Error al registrar el pago' };
    }
  }

  // Actualizar factura de una solicitud
  static async actualizarFactura(
    solicitudId: string, 
    factura: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Obtener la solicitud
      const solicitudCommand = new QueryCommand({
        TableName: this.TABLE_NAME,
        KeyConditionExpression: "ColeccionID = :coleccionId AND NombreColeccion = :nombreColeccion",
        ExpressionAttributeValues: {
          ":coleccionId": `${this.SOLICITUDES_COLLECTION}#${solicitudId}`,
          ":nombreColeccion": this.SOLICITUDES_COLLECTION
        }
      });

      const solicitudResult = await docClient.send(solicitudCommand);
      
      if (!solicitudResult.Items || solicitudResult.Items.length === 0) {
        return { success: false, error: 'Solicitud no encontrada' };
      }

      const solicitud = solicitudResult.Items[0];

      // Actualizar la factura
      const updateCommand = new PutCommand({
        TableName: this.TABLE_NAME,
        Item: {
          ...solicitud,
          Factura: factura,
          UpdatedAt: new Date().toISOString()
        }
      });

      await docClient.send(updateCommand);
      return { success: true };

    } catch (error) {
      console.error('Error actualizando factura:', error);
      return { success: false, error: 'Error al actualizar la factura' };
    }
  }

  // Métodos auxiliares
  private static obtenerPagosParaSolicitud(pagosItems: any[], solicitudId: string): any[] {
    if (!pagosItems || pagosItems.length === 0) return [];
    
    const todosLosPagos = pagosItems.flatMap((item: any) => item.Registros || []);
    return todosLosPagos.filter((pago: any) => pago.solicitudId === solicitudId);
  }

  private static calcularTotalPagado(pagos: any[]): number {
    return pagos.reduce((total, pago) => total + (pago.monto || 0), 0);
  }

  private static determinarEstatusPago(precioTotal: number, totalPagado: number): string {
    if (totalPagado >= precioTotal) return 'pagado';
    if (totalPagado > 0) return 'en proceso de pago';
    return 'pendiente';
  }

  private static obtenerTipoPagoTexto(tipoPago: number): string {
    switch (tipoPago) {
      case 1: return 'Efectivo';
      case 2: return 'Tarjeta de crédito';
      case 3: return 'Transferencia bancaria';
      case 4: return 'Recibo';
      default: return 'Efectivo';
    }
  }
}