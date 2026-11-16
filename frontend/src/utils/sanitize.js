/**
 * Utilitários de sanitização para prevenção de XSS.
 * Usa DOMPurify para sanitizar HTML não confiável antes de renderizar.
 */
import DOMPurify from 'dompurify';

/**
 * Configuração padrão do DOMPurify para o TEIA.
 * Permite apenas tags e atributos seguros para conteúdo educacional.
 */
const PURIFY_CONFIG = {
  // Tags permitidas para conteúdo markdown renderizado
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'blockquote', 'hr',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'span',
  ],
  // Atributos permitidos
  ALLOWED_ATTR: [
    'href', 'title', 'target', 'rel',
    'src', 'alt', 'width', 'height',
    'class', 'id', 'style',
  ],
  // Permitir apenas URLs seguras em href e src
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  // Remover atributos de evento (onclick, onload, etc.)
  FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  // Manter dados seguros
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: false,
};

/**
 * Sanitiza uma string HTML, removendo tags/atributos perigosos.
 * @param {string} dirty - HTML potencialmente inseguro
 * @param {object} config - Configuração customizada (opcional)
 * @returns {string} HTML sanitizado seguro para renderização
 */
export function sanitizeHtml(dirty, config = {}) {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  return DOMPurify.sanitize(dirty, { ...PURIFY_CONFIG, ...config });
}

/**
 * Sanitiza HTML para renderização em ReactMarkdown.
 * Configuração mais restritiva para conteúdo de usuário (fórum, comentários).
 * @param {string} dirty - HTML do ReactMarkdown
 * @returns {string} HTML sanitizado
 */
export function sanitizeMarkdownHtml(dirty) {
  return sanitizeHtml(dirty, {
    // Para markdown de usuário: sem links externos, sem imagens
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'hr',
    ],
    ALLOWED_ATTR: ['class', 'id'],
    ALLOWED_URI_REGEXP: /^$/,
  });
}

/**
 * Sanitiza HTML para saída da IA (catalogação assistida, planejador).
 * A IA pode gerar conteúdo estruturado mais rico.
 * @param {string} dirty - HTML gerado pela IA
 * @returns {string} HTML sanitizado
 */
export function sanitizeAiOutput(dirty) {
  return sanitizeHtml(dirty, {
    // Para saída da IA: permite estrutura completa mas sem scripts
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'hr',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span',
    ],
    ALLOWED_ATTR: ['class', 'id', 'style', 'colspan', 'rowspan'],
    ALLOWED_URI_REGEXP: /^$/,
  });
}

/**
 * Escapa HTML para exibição segura como texto (não renderiza tags).
 * Útil para exibir código ou conteúdo não confiável como texto puro.
 * @param {string} text - Texto a escapar
 * @returns {string} Texto com entidades HTML escapadas
 */
export function escapeHtml(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  return text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

/**
 * Valida se uma URL é segura para uso em href/src.
 * Bloqueia javascript:, data:, vbscript:, etc.
 * @param {string} url - URL a validar
 * @returns {boolean} true se segura
 */
export function isSafeUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  const trimmed = url.trim().toLowerCase();
  // Bloquear protocolos perigosos
  const dangerousProtocols = [
    'javascript:', 'data:', 'vbscript:', 'file:', 'blob:',
    'ftp:', 'telnet:', 'ssh:', 'sftp:',
  ];
  for (const proto of dangerousProtocols) {
    if (trimmed.startsWith(proto)) {
      return false;
    }
  }
  // Permitir apenas http:, https:, mailto:, tel:, ou URLs relativas
  return /^(https?:\/\/|mailto:|tel:|\/|#)/.test(trimmed);
}

/**
 * Sanitiza objeto de dados da IA antes de usar no frontend.
 * Remove campos perigosos e sanitiza strings.
 * @param {object} data - Dados da IA
 * @returns {object} Dados sanitizados
 */
export function sanitizeAiData(data) {
  if (!data || typeof data !== 'object') {
    return {};
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Sanitizar strings longas (provável conteúdo HTML/Markdown)
      if (value.length > 100 || value.includes('<') || value.includes('>')) {
        sanitized[key] = sanitizeAiOutput(value);
      } else {
        sanitized[key] = escapeHtml(value);
      }
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(v =>
        typeof v === 'string'
          ? (v.length > 100 ? sanitizeAiOutput(v) : escapeHtml(v))
          : sanitizeAiData(v)
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeAiData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export default {
  sanitizeHtml,
  sanitizeMarkdownHtml,
  sanitizeAiOutput,
  escapeHtml,
  isSafeUrl,
  sanitizeAiData,
};