/**
 * Utilitários para garantir codificação UTF-8 adequada no frontend
 * Previne problemas de encoding com caracteres portugueses
 */

/**
 * Sanitiza texto para garantir que está em UTF-8 correto
 */
export function sanitizeText(text: string): string {
  if (typeof text !== 'string') return text;
  
  try {
    // Remove caracteres de controle
    let cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Normaliza caracteres Unicode (NFD -> NFC)
    cleaned = cleaned.normalize('NFC');
    
    return cleaned;
  } catch (error) {
    console.warn('Erro ao sanitizar texto:', error);
    return text;
  }
}

/**
 * Valida se um texto contém caracteres portugueses válidos
 */
export function validatePortugueseText(text: string): boolean {
  if (typeof text !== 'string') return true;
  
  // Padrão para detectar caracteres problemáticos
  const problematicPattern = /[��]/g;
  return !problematicPattern.test(text);
}

/**
 * Corrige texto com problemas de encoding
 */
export function fixEncoding(text: string): string {
  if (typeof text !== 'string') return text;
  
  // Mapeamento de caracteres com problemas comuns
  const encodingFixes: Record<string, string> = {
    'Ã¡': 'á',
    'Ã©': 'é',
    'Ã­': 'í',
    'Ã³': 'ó',
    'Ãº': 'ú',
    'Ã ': 'à',
    'Ã¢': 'â',
    'Ãª': 'ê',
    'Ã´': 'ô',
    'Ã£': 'ã',
    'Ãµ': 'õ',
    'Ã§': 'ç',
    'Ã¼': 'ü',
    'Ã¤': 'ä',
    'Ã¶': 'ö',
    'Ã±': 'ñ',
    // Maiúsculas
    'Ã': 'Á',
    'Ã‰': 'É',
    'ÃŒ': 'Í',
    'Ã"': 'Ó',
    'Ãš': 'Ú',
    'Ã€': 'À',
    'Ã‚': 'Â',
    'ÃŠ': 'Ê',
    'Ã"': 'Ô',
    'Ãƒ': 'Ã',
    'Ã•': 'Õ',
    'Ã‡': 'Ç'
  };
  
  let fixed = text;
  for (const [wrong, correct] of Object.entries(encodingFixes)) {
    fixed = fixed.replace(new RegExp(wrong, 'g'), correct);
  }
  
  return fixed;
}

/**
 * Sanitiza objeto recursivamente para UTF-8
 */
export function sanitizeObject<T>(obj: T): T {
  if (typeof obj === 'string') {
    return sanitizeText(obj) as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as T;
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = sanitizeText(key);
      sanitized[sanitizedKey] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Configura fetch para usar UTF-8 adequadamente
 */
export function createUTF8Fetch() {
  const originalFetch = window.fetch;
  
  return async function utf8Fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);
    
    // Garantir headers UTF-8
    if (!headers.has('Content-Type') && init?.body) {
      headers.set('Content-Type', 'application/json; charset=utf-8');
    }
    
    if (!headers.has('Accept-Charset')) {
      headers.set('Accept-Charset', 'utf-8');
    }
    
    const modifiedInit: RequestInit = {
      ...init,
      headers
    };
    
    // Se o body é um objeto, garantir que está em UTF-8
    if (modifiedInit.body && typeof modifiedInit.body === 'string') {
      try {
        const parsed = JSON.parse(modifiedInit.body);
        const sanitized = sanitizeObject(parsed);
        modifiedInit.body = JSON.stringify(sanitized);
      } catch (e) {
        // Se não for JSON, sanitizar como string
        modifiedInit.body = sanitizeText(modifiedInit.body);
      }
    }
    
    const response = await originalFetch(input, modifiedInit);
    
    // Interceptar resposta para sanitizar
    const originalJson = response.json;
    response.json = async function() {
      const data = await originalJson.call(this);
      return sanitizeObject(data);
    };
    
    const originalText = response.text;
    response.text = async function() {
      const text = await originalText.call(this);
      return sanitizeText(text);
    };
    
    return response;
  };
}

/**
 * Hook para automaticamente sanitizar dados de formulário
 */
export function useUTF8Form() {
  const sanitizeFormData = (data: Record<string, any>) => {
    return sanitizeObject(data);
  };
  
  const validateFormData = (data: Record<string, any>) => {
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && !validatePortugueseText(value)) {
        console.warn(`Campo '${key}' contém caracteres com problemas de encoding`);
        return false;
      }
    }
    return true;
  };
  
  return {
    sanitizeFormData,
    validateFormData
  };
}

/**
 * Utilitário para ler arquivos com encoding correto
 */
export function readFileAsUTF8(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const sanitized = sanitizeText(text);
        resolve(sanitized);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(reader.error);
    
    // Ler como UTF-8
    reader.readAsText(file, 'UTF-8');
  });
}

export default {
  sanitizeText,
  validatePortugueseText,
  fixEncoding,
  sanitizeObject,
  createUTF8Fetch,
  useUTF8Form,
  readFileAsUTF8
};