// src/utils/test-connection.ts
import { docClient, s3Client } from "../aws-config";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ListBucketsCommand } from "@aws-sdk/client-s3";

export const testAWSConnection = async (): Promise<boolean> => {
  try {
    console.log('🔗 Testing AWS DynamoDB connection...');
    
    // Test DynamoDB
    const dynamoCommand = new ScanCommand({
      TableName: 'PatologiaApp',
      Limit: 1
    });
    
    await docClient.send(dynamoCommand);
    console.log('✅ DynamoDB connection successful!');
    
    // Test S3
    console.log('📦 Testing S3 connection...');
    const s3Command = new ListBucketsCommand({});
    const s3Result = await s3Client.send(s3Command);
    console.log('✅ S3 connection successful!');
    console.log('📊 Available buckets:', s3Result.Buckets?.map(b => b.Name));
    
    return true;
    
  } catch (error) {
    console.error('❌ AWS Connection error:', error);
    return false;
  }
};

export const checkEnvVariables = (): boolean => {
  const requiredVars = [
    'VITE_AWS_ACCESS_KEY_ID',
    'VITE_AWS_SECRET_ACCESS_KEY',
    'VITE_AWS_REGION'
  ];
  
  const missingVars = requiredVars.filter(varName => {
    const value = import.meta.env[varName];
    return !value || value === '';
  });
  
  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars);
    return false;
  }
  
  console.log('✅ All environment variables are set');
  return true;
};