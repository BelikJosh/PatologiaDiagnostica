// src/services/searchService.ts
import { docClient } from '../aws-config';
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

export class SearchService {
  static readonly TABLE_NAME = 'PatologiaApp';

  static async searchPacientes(searchText: string): Promise<{ value: string; label: string }[]> {
    try {
      const command = new ScanCommand({
        TableName: this.TABLE_NAME,
        FilterExpression: 'contains(NombreCompleto, :search) OR contains(Nombre, :search) OR contains(PrimerApellido, :search)',
        ExpressionAttributeValues: {
          ':search': searchText
        },
        Limit: 10
      });

      const result = await docClient.send(command);
      
      return result.Items?.filter(item => item.NombreColeccion === 'dbo_Pacientes')
        .map(item => ({
          value: item.NombreCompleto || `${item.Nombre} ${item.PrimerApellido}`,
          label: item.NombreCompleto || `${item.Nombre} ${item.PrimerApellido}`
        })) || [];

    } catch (error) {
      console.error('Error searching pacientes:', error);
      return [];
    }
  }

  static async searchDoctores(searchText: string): Promise<{ value: string; label: string }[]> {
    try {
      const command = new ScanCommand({
        TableName: this.TABLE_NAME,
        FilterExpression: 'contains(NombreCompleto, :search) OR contains(Nombre, :search) OR contains(PrimerApellido, :search)',
        ExpressionAttributeValues: {
          ':search': searchText
        },
        Limit: 10
      });

      const result = await docClient.send(command);
      
      return result.Items?.filter(item => item.NombreColeccion === 'dbo_Doctores')
        .map(item => ({
          value: `${item.Nombre} ${item.PrimerApellido} ${item.SegundoApellido || ''}`.trim(),
          label: `${item.Nombre} ${item.PrimerApellido} ${item.SegundoApellido || ''}`.trim()
        })) || [];

    } catch (error) {
      console.error('Error searching doctores:', error);
      return [];
    }
  }
}