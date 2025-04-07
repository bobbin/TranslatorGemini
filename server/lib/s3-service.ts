import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand,
  DeleteObjectCommand 
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

// Inicializar el cliente S3 con las credenciales
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const bucketName = process.env.S3_BUCKET_NAME!;

/**
 * Genera un nombre único para un archivo basado en el usuario y el nombre original
 */
function generateUniqueFileName(userId: number, originalName: string): string {
  const timestamp = Date.now();
  const hash = crypto.createHash('md5').update(`${userId}-${timestamp}-${originalName}`).digest('hex');
  const extension = originalName.split('.').pop();
  return `user-${userId}/${hash}.${extension}`;
}

/**
 * Sube un archivo a S3 y devuelve su clave
 */
export async function uploadFileToS3(
  fileBuffer: Buffer,
  userId: number,
  originalFileName: string,
  mimeType: string
): Promise<string> {
  const fileName = generateUniqueFileName(userId, originalFileName);
  
  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimeType,
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    return fileName;
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw new Error("Failed to upload file to S3");
  }
}

/**
 * Genera una URL prefirmada para descargar un archivo
 * La URL expira después del tiempo especificado (por defecto 15 minutos)
 */
export async function generatePresignedUrl(
  s3Key: string,
  expiresInSeconds: number = 15 * 60
): Promise<string> {
  const params = {
    Bucket: bucketName,
    Key: s3Key,
  };

  try {
    const command = new GetObjectCommand(params);
    const url = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
    return url;
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw new Error("Failed to generate download URL");
  }
}

/**
 * Elimina un archivo de S3
 */
export async function deleteFileFromS3(s3Key: string): Promise<void> {
  const params = {
    Bucket: bucketName,
    Key: s3Key,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(params));
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    throw new Error("Failed to delete file from S3");
  }
}

/**
 * Verifica si las credenciales de S3 están configuradas correctamente
 */
export async function verifyS3Credentials(): Promise<boolean> {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || 
      !process.env.AWS_REGION || !process.env.S3_BUCKET_NAME) {
    console.error("AWS S3 credentials are missing");
    return false;
  }
  
  try {
    // Intenta listar objetos para verificar credenciales
    const params = {
      Bucket: bucketName,
      MaxKeys: 1,
    };
    
    await s3Client.send(new GetObjectCommand({ ...params, Key: 'test-connection' }))
      .catch(err => {
        // Ignoramos el error NoSuchKey ya que solo estamos verificando las credenciales
        if (err.name !== 'NoSuchKey') throw err;
      });
    
    return true;
  } catch (error) {
    console.error("Error verifying S3 credentials:", error);
    return false;
  }
}