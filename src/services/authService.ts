// src/services/authService.ts
import { docClient } from '../aws-config';
import { ScanCommand } from "@aws-sdk/client-dynamodb";
import { User, LoginResponse } from '../aws-config';

export class AuthService {
  static async login(username: string, password: string): Promise<LoginResponse> {
    try {
      console.log('🔐 Buscando usuario:', username);
      
      // 1. Buscar en TODAS las colecciones que puedan contener usuarios/doctores
      const command = new ScanCommand({
        TableName: 'PatologiaApp',
        FilterExpression: 'contains(NombreColeccion, :userKeyword) OR contains(NombreColeccion, :doctorKeyword)',
        ExpressionAttributeValues: {
          ':userKeyword': { S: 'Usuario' },
          ':doctorKeyword': { S: 'Doctor' }
        }
      });

      // ALTERNATIVA: Buscar en TODOS los items sin filtro inicial
      // const command = new ScanCommand({
      //   TableName: 'PatologiaApp'
      // });

      const result = await docClient.send(command);
      const items = result.Items || [];
      
      if (items.length === 0) {
        return { success: false, error: 'No se encontraron usuarios' };
      }

      console.log('📊 Items encontrados en DB:', items.length);

      // 2. Buscar usuario en todas las colecciones posibles
      let userFound = null;

      for (const item of items) {
        const nombreColeccion = item.NombreColeccion?.S || '';
        
        // Buscar en diferentes estructuras de datos
        userFound = this.findUserInItem(item, username);
        
        if (userFound) {
          console.log('✅ Usuario encontrado en colección:', nombreColeccion);
          break;
        }
      }

      if (!userFound) {
        return { success: false, error: 'Usuario no encontrado' };
      }

      // 3. Extraer datos del usuario
      const user = this.extractUserData(userFound, username);
      return { success: true, user };

    } catch (error) {
      console.error('❌ Error en login:', error);
      return { success: false, error: 'Error de conexión con la base de datos' };
    }
  }

  /**
   * Busca usuario en diferentes estructuras de items de DynamoDB
   */
  private static findUserInItem(item: any, username: string): any {
    const nombreColeccion = item.NombreColeccion?.S || '';

    // ESCENARIO 1: Usuarios en array Registros (estructura de colección)
    if (item.Registros?.L && Array.isArray(item.Registros.L)) {
      console.log('🔍 Buscando en Registros de:', nombreColeccion);
      
      for (const record of item.Registros.L) {
        if (record.M?.NombreUsuario?.S === username || 
            record.M?.Email?.S === username || 
            record.M?.Username?.S === username) {
          return record.M; // Retorna el usuario encontrado
        }
      }
    }

    // ESCENARIO 2: Usuario directo en el item (estructura individual)
    if (item.NombreUsuario?.S === username || 
        item.Email?.S === username || 
        item.Username?.S === username) {
      console.log('🔍 Usuario encontrado directamente en item:', nombreColeccion);
      return item;
    }

    // ESCENARIO 3: Buscar en otros campos posibles
    if (item.M?.NombreUsuario?.S === username || 
        item.M?.Email?.S === username) {
      console.log('🔍 Usuario encontrado en campo M:', nombreColeccion);
      return item.M;
    }

    return null;
  }

  /**
   * Extrae datos del usuario desde diferentes estructuras de DynamoDB
   */
  private static extractUserData(userData: any, username: string): User {
    // Manejar diferentes estructuras de datos
    const userInfo = userData.M || userData; // Soporta tanto M (map) como datos directos

    return {
      username: userInfo.NombreUsuario?.S || 
               userInfo.Username?.S || 
               userInfo.Email?.S || 
               username,
      nombre: userInfo.Nombre?.S || 
             userInfo.NombreCompleto?.S || 
             userInfo.NombreUsuario?.S || 
             username,
      email: userInfo.Email?.S || '',
      role: this.getRoleFromData(userInfo),
      token: this.generateToken(username),
      // Campos adicionales que podrían ser útiles
      id: userInfo.Id?.S || userInfo.ID?.S || '',
      especialidad: userInfo.Especialidad?.S || userInfo.Puesto?.S || ''
    };
  }

  /**
   * Determina el role basado en diferentes campos posibles
   */
  private static getRoleFromData(userData: any): string {
    // Verificar diferentes campos que podrían indicar el role
    const puesto = userData.Puesto?.S || '';
    const role = userData.Role?.S || userData.Rol?.S || '';
    const tipoUsuario = userData.TipoUsuario?.S || userData.IdTipoUsuario?.S || '';
    const especialidad = userData.Especialidad?.S || '';

    const puestoLower = puesto.toLowerCase();
    const roleLower = role.toLowerCase();
    const especialidadLower = especialidad.toLowerCase();

    // Lógica para determinar el role
    if (roleLower.includes('admin') || puestoLower.includes('admin') || tipoUsuario === '1') {
      return 'admin';
    }
    if (roleLower.includes('doctor') || puestoLower.includes('doctor') || 
        especialidadLower.includes('patolog') || tipoUsuario === '2') {
      return 'doctor';
    }
    if (roleLower.includes('recepcion') || puestoLower.includes('recepcion') || tipoUsuario === '3') {
      return 'recepcion';
    }
    if (roleLower.includes('tecnic') || puestoLower.includes('tecnic') || tipoUsuario === '4') {
      return 'tecnico';
    }

    return 'user';
  }

  private static generateToken(username: string): string {
    const tokenData = {
      username,
      timestamp: Date.now(),
      exp: Date.now() + (8 * 60 * 60 * 1000) // 8 horas
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
    sessionStorage.removeItem('user_role');
  }

  static getCurrentUser(): User | null {
    try {
      const userData = sessionStorage.getItem('aws_user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  // Método auxiliar para debug
  static async debugCollections(): Promise<void> {
    try {
      const command = new ScanCommand({
        TableName: 'PatologiaApp'
      });

      const result = await docClient.send(command);
      console.log('🔍 Debug - Todas las colecciones:', result.Items?.map(item => ({
        coleccion: item.NombreColeccion?.S,
        tieneRegistros: !!item.Registros?.L,
        numRegistros: item.Registros?.L?.length || 0
      })));
    } catch (error) {
      console.error('Error en debug:', error);
    }
  }
}