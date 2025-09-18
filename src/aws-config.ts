// src/services/aws-config.ts (versión mejorada)
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";

// Detectar si estamos en desarrollo o producción
const isDevelopment = import.meta.env.DEV;

const awsConfig = {
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || 'AKIAQ5BAACIVQSVIMZEB',
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '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',
  },
  // Configuración adicional para desarrollo
  ...(isDevelopment && {
    maxAttempts: 3,
    retryMode: 'standard'
  })
};

// Crear clientes
const dynamoDBClient = new DynamoDBClient(awsConfig);

export const docClient = DynamoDBDocumentClient.from(dynamoDBClient, {
  marshallOptions: {
    convertEmptyValues: false,
    removeUndefinedValues: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

export const s3Client = new S3Client(awsConfig);

// Función de conexión mejorada
export const testAWSConnection = async (): Promise<boolean> => {
  try {
    const command = new ScanCommand({
      TableName: 'PatologiaApp',
      Limit: 1
    });
    
    const result = await docClient.send(command);
    console.log('✅ AWS Connection successful. Items found:', result.Items?.length);
    return true;
    
  } catch (error: any) {
    console.error('❌ AWS Connection failed:', error.name, error.message);
    
    // Log detallado para debugging
    if (error.name === 'ResourceNotFoundException') {
      console.error('📋 Table "PatologiaApp" not found. Check table name.');
    } else if (error.name === 'AccessDeniedException') {
      console.error('🔐 Access denied. Check AWS credentials and permissions.');
    }
    
    return false;
  }
};

export default awsConfig;