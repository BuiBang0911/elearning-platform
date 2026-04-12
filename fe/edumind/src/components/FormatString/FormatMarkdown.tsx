import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface FormatMarkdownProps {
  content: string;
}

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return (
      <code className="bg-gray-100 text-red-500 px-1 py-0.5 rounded text-sm font-mono" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-4">
      <div className="flex items-center justify-between bg-gray-800 text-gray-300 px-4 py-1.5 rounded-t-lg text-xs font-mono border-b border-gray-700">
        <span>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="m-0 p-4 bg-gray-900 text-gray-100 rounded-b-lg overflow-x-auto text-sm font-mono leading-relaxed">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
};

export default function FormatMarkdown({ content }: FormatMarkdownProps) {
  const formattedContent = content?.replace(/\\n/g, "\n") ?? "";

  return (
    <div className="prose prose-blue prose-sm md:prose-base max-w-none text-gray-800 leading-relaxed font-sans" style={{ overflowWrap: "break-word" }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: CodeBlock,
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
          th: ({ children }) => (
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-sm text-gray-700 border-t border-gray-100">
              {children}
            </td>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 bg-blue-50/50 pl-4 py-1 my-4 italic text-gray-700">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => <ul className="list-disc pl-5 my-4 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 my-4 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="pl-1 italic-none">{children}</li>,
          h1: ({ children }) => <h1 className="text-xl font-bold mt-6 mb-2 text-blue-800 border-b pb-1">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mt-4 mb-2 text-gray-800">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-bold mt-3 mb-1 text-gray-800">{children}</h3>,
          p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
        }}
      >
        {formattedContent}
      </ReactMarkdown>
    </div>
  );
}