// src/utils/passwordDebug.ts
import bcrypt from 'bcryptjs';

export const debugPassword = async (password: string, dbHash: string) => {
  console.log('🔍 Debuggeando contraseña:');
  console.log('Password ingresado:', password);
  console.log('Hash en DB:', dbHash);
  
  try {
    // Extraer el hash
    const hashMatch = dbHash.match(/^b'([^']+)'$/);
    if (hashMatch) {
      const hashString = hashMatch[1];
      console.log('Hash extraído:', hashString);
      
      // Convertir escapes
      const hashBytes = hashString.replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
      }).replace(/\\'/g, "'");
      
      console.log('Hash convertido:', hashBytes);
      console.log('Longitud hash:', hashBytes.length);
      
      // Intentar verificar
      const isValid = await bcrypt.compare(password, hashBytes);
      console.log('¿Contraseña válida?', isValid);
      
      return isValid;
    }
    
    return false;
  } catch (error) {
    console.error('Error en debug:', error);
    return false;
  }
};

// Usar en la consola: debugPassword('AlexNava2k23', 'el_hash_de_la_db')