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