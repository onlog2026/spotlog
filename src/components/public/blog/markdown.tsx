import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-cms">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl md:text-4xl font-bold text-navy-900 mt-8 mb-4">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl md:text-3xl font-bold text-navy-900 mt-8 mb-3">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl md:text-2xl font-semibold text-navy-900 mt-6 mb-2">{children}</h3>
          ),
          p: ({ children }) => <p className="text-ink-700 leading-relaxed my-4">{children}</p>,
          a: ({ children, href }) => (
            <a href={href} className="text-spotorange-600 underline hover:text-spotorange-700">
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="list-disc pl-6 my-4 space-y-1 text-ink-700">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6 my-4 space-y-1 text-ink-700">{children}</ol>,
          strong: ({ children }) => <strong className="font-semibold text-navy-900">{children}</strong>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-spotorange-500 pl-4 italic text-ink-600 my-4">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="bg-navy-50 text-navy-900 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="bg-navy-900 text-white p-4 rounded-lg overflow-x-auto my-4 text-sm">{children}</pre>
          ),
          hr: () => <hr className="my-8 border-ink-200" />,
          img: ({ src, alt }) =>
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src as string} alt={alt ?? ""} className="rounded-lg my-6 w-full" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
