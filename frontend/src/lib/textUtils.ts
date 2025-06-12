/**
 * Utilitários para processamento de texto e formatação
 * Mantém as melhorias de caracteres Unicode que você implementou anteriormente
 */

/**
 * Converte caracteres Unicode escapados (\u00e7) e entidades HTML (&aacute;) para seus caracteres normais
 * Esta função é essencial para exibir corretamente texto em português sem códigos de escape
 * @param text Texto com possíveis caracteres escapados
 * @returns Texto com caracteres normalizados
 */
export function unescapeUnicodeCharacters(text: string): string {
  if (!text) return '';
  
  return text
    // Converte sequências \u0000 para os caracteres correspondentes
    .replace(/\\u([a-fA-F0-9]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    // Converte entidades HTML como &aacute; e &#123;
    .replace(/&([a-z]+|#[0-9]+);/gi, (match, entity) => {
      const entities: Record<string, string> = {
        'amp': '&',
        'lt': '<',
        'gt': '>',
        'quot': '"',
        'apos': "'",
        'aacute': 'á',
        'eacute': 'é',
        'iacute': 'í',
        'oacute': 'ó',
        'uacute': 'ú',
        'atilde': 'ã',
        'otilde': 'õ',
        'ccedil': 'ç',
        'ntilde': 'ñ',
        'agrave': 'à',
        'egrave': 'è',
        'igrave': 'ì',
        'ograve': 'ò',
        'ugrave': 'ù'
      };
      
      if (entities[entity]) {
        return entities[entity];
      } else if (entity.startsWith('#')) {
        // Converte códigos numéricos para caracteres
        return String.fromCharCode(parseInt(entity.substring(1), 10));
      }
      
      return match;
    });
}

/**
 * Verifica se uma string contém caracteres Unicode escapados
 * Útil para determinar se uma string precisa ser processada
 */
export function containsEscapedCharacters(text: string): boolean {
  return /\\u[a-fA-F0-9]{4}|&[a-z]+;|&#[0-9]+;/gi.test(text);
}

/**
 * Formata um trecho de texto para exibição segura em HTML
 * Escapa caracteres especiais e preserva quebras de linha
 */
export function formatTextForDisplay(text: string): string {
  if (!text) return '';
  
  // Primeiro desescapa caracteres Unicode
  const unescaped = unescapeUnicodeCharacters(text);
  
  // Converte quebras de linha para <br>
  return unescaped
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');
}
