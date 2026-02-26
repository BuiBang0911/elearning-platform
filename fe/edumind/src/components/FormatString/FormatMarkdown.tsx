import ReactMarkdown from 'react-markdown';

interface FormatMarkdownProps {
  content: string;
}

export default function FormatMarkdown({ content }: FormatMarkdownProps) {

  const formattedContent = content?.replace(/\\n/g, "\n") ?? "";

  return (
    <div className="prose max-w-none">
      <ReactMarkdown>
        {formattedContent}
      </ReactMarkdown>
    </div>
  );
}