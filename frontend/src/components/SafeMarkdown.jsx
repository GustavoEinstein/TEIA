import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { sanitizeMarkdownHtml, sanitizeAiOutput } from '../utils/sanitize';

/**
 * Componente ReactMarkdown seguro que sanitiza a saída HTML com DOMPurify.
 * Previne XSS em conteúdo markdown renderizado.
 *
 * @param {string} children - Conteúdo markdown para renderizar
 * @param {string} mode - 'user' para conteúdo de usuário (fórum), 'ai' para saída da IA
 * @param {object} className - Classes CSS adicionais
 */
const SafeMarkdown = ({ children, mode = 'user', className = '' }) => {
  // Sanitiza o conteúdo markdown ANTES de passar para ReactMarkdown
  // Isso garante que qualquer HTML injetado no markdown seja removido
  const sanitizedContent = mode === 'ai'
    ? sanitizeAiOutput(children)
    : sanitizeMarkdownHtml(children);

  // Renderiza o markdown sanitizado
  // Usamos rehypeRaw para permitir HTML já sanitizado (mas DOMPurify já removeu tags perigosas)
  return (
    <div className={className}>
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        // Configuração de segurança adicional: desabilita links e imagens para conteúdo de usuário
        components={{
          a: (props) => {
            if (mode === 'user') {
              // Para usuário: renderiza link como texto simples ou span seguro
              return <span className="text-slate-500 dark:text-slate-400 underline">{props.children}</span>;
            }
            // Para IA: permite links mas valida href
            const href = props.href;
            if (!href || !href.startsWith('http')) {
              return <span className="text-slate-500 dark:text-slate-400 underline">{props.children}</span>;
            }
            return (
              <a
                {...props}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1565C0] dark:text-blue-400 hover:underline"
              />
            );
          },
          img: () => {
            // Bloquear imagens completamente para prevenir tracking pixels
            return <span className="text-slate-400 dark:text-slate-500 text-xs">[imagem bloqueada]</span>;
          },
          code: (props) => <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">{props.children}</code>,
          pre: (props) => <pre className="bg-slate-100 dark:bg-slate-800 p-3 rounded overflow-x-auto"><code>{props.children}</code></pre>,
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
};

export default SafeMarkdown;