import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Configuración para AWS SDK v3
const awsConfig = {
  region: 'us-east-1',
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || 'AKIAQ5BAACIVQSVIMZEB',
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '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',
  },
};

// Crear cliente de DynamoDB v3
const dynamoDBClient = new DynamoDBClient(awsConfig);

// Crear cliente de documento para easier usage
export const dynamoDB = DynamoDBDocumentClient.from(dynamoDBClient, {
  marshallOptions: {
    convertEmptyValues: false,
    removeUndefinedValues: true,
    convertClassInstanceToMap: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

// Interfaces
export interface AWSConfig {
  region: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export interface User {
  username: string;
  nombre: string;
  role: string;
  token: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  error?: string;
}

// Verificar conexión
export const testAWSConnection = async (): Promise<boolean> => {
  try {
    const command = { TableName: 'PatologiaApp', Limit: 1 };
    await dynamoDB.send(command as any);
    return true;
  } catch (error) {
    console.error('Error de conexión AWS:', error);
    return false;
  }
};

export default awsConfig;