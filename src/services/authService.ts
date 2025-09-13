// src/services/authService.ts
import { dynamoDB } from '../aws-config';
import { ScanCommand } from "@aws-sdk/client-dynamodb";
import { User, LoginResponse } from '../aws-config';

export class AuthService {
  static async login(username: string, password: string): Promise<LoginResponse> {
    try {
      console.log('🔐 Buscando usuario:', username);
      
      // 1. Buscar el usuario en DynamoDB con SDK v3
      const command = new ScanCommand({
        TableName: 'PatologiaApp',
        FilterExpression: 'NombreColeccion = :name',
        ExpressionAttributeValues: {
          ':name': { S: 'dbo_Usuarios' }
        }
      });

      const result = await dynamoDB.send(command);
      const items = result.Items || [];
      
      if (items.length === 0) {
        return { success: false, error: 'No se encontraron usuarios' };
      }

      const usuariosCollection = items[0];
      const records = usuariosCollection.Registros?.L || [];
      
      console.log('📊 Usuarios en DB:', records.length);
      
      // 2. Buscar usuario por nombre de usuario
      const userRecord = records.find((record: any) => {
        const dbUser = record.M?.NombreUsuario?.S;
        return dbUser === username;
      });

      if (!userRecord) {
        return { success: false, error: 'Usuario no encontrado' };
      }

      // 3. Para desarrollo - verificación simple
      const userData = userRecord.M;
      
      // SOLUCIÓN TEMPORAL: Permitir login sin verificar contraseña encriptada
      const user = this.extractUserData(userData, username);
      return { success: true, user };

    } catch (error) {
      console.error('❌ Error en login:', error);
      return { success: false, error: 'Error de conexión con la base de datos' };
    }
  }

  /**
   * Extrae datos del usuario desde DynamoDB
   */
  private static extractUserData(userData: any, username: string): User {
    return {
      username: userData.NombreUsuario?.S || username,
      nombre: userData.Nombre?.S || userData.NombreUsuario?.S || username,
      role: this.getRoleFromPuesto(userData.Puesto?.S),
      token: this.generateToken(username)
    };
  }

  /**
   * Convierte el puesto a role
   */
  private static getRoleFromPuesto(puesto: string = ''): string {
    const puestoLower = puesto.toLowerCase();
    
    if (puestoLower.includes('admin')) return 'admin';
    if (puestoLower.includes('doctor') || puestoLower.includes('patolog')) return 'doctor';
    if (puestoLower.includes('recepcion')) return 'recepcion';
    if (puestoLower.includes('tecnic')) return 'tecnico';
    
    return 'user';
  }

  private static generateToken(username: string): string {
    const tokenData = {
      username,
      timestamp: Date.now(),
      exp: Date.now() + (8 * 60 * 60 * 1000)
    };
    return btoa(unescape(encodeURIComponent(JSON.stringify(tokenData))));
  }

  static verifyToken(token: string): boolean {
    try {
      const decodedStr = decodeURIComponent(escape(atob(token)));
      const decoded = JSON.parse(decodedStr);
      return decoded.exp > Date.now();
    } catch {
      return false;
    }
  }

  static logout(): void {
    sessionStorage.removeItem('aws_token');
    sessionStorage.removeItem('aws_user');
  }

  static getCurrentUser(): User | null {
    try {
      const userData = sessionStorage.getItem('aws_user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }
}