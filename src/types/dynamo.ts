// src/types/dynamo.ts
export interface DynamoDBUser {
  ColeccionID: string;
  NombreColeccion: string;
  Registros: UserRecord[];
  TotalRegistros: number;
  FechaCarga: string;
}

export interface UserRecord {
  User: string;
  Password: string;
  Nombre?: string;
  Role?: string;
  Email?: string;
  Activo?: boolean;
  FechaCreacion?: string;
}

export interface DynamoDBResponse {
  Items: DynamoDBUser[];
  Count: number;
  ScannedCount: number;
}

// src/types/dynamo.ts (agregar estas interfaces)

export interface Applicationss {
  Id: number;
  NumeroRegistro: string;
  Nombre: string;
  FechaRecepcion: string;
  Precio: number;
  PrecioEstudioEspecial: number;
  TotalPagado: number;
  Factura: string;
  IdEstatusPago: number;
}

export interface CatTipo {
  Id: number;
  Descripcion: string;
}

export interface DynamoDBSolicitud {
  ColeccionID: string;
  NombreColeccion: string;
  Registros: Applicationss[];
  TotalRegistros: number;
  FechaCarga: string;
}

export interface DynamoDBTipoPago {
  ColeccionID: string;
  NombreColeccion: string;
  Registros: CatTipo[];
  TotalRegistros: number;
  FechaCarga: string;
}

export interface DynamoDBPago {
  ColeccionID: string;
  NombreColeccion: string;
  Registros: PagoRecord[];
  TotalRegistros: number;
  FechaCarga: string;
}

export interface PagoRecord {
  IdEstudio: number;
  IdTipoPago: number;
  Pago: number;
  Descripcion: string;
  FechaPago: string;
}