import Markdown, { defaultUrlTransform } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

function ReportRender({ finalReport }: { finalReport: string }) {
  return (
    <div id="report-rendered" className="prose prose-sm max-w-none text-gray-700">
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 border-b border-gray-200 pb-2 text-2xl font-bold text-gray-800">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-6 mb-3 text-xl font-semibold text-gray-800">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-4 mb-2 text-lg font-medium text-gray-800">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="mb-4 space-y-2 pl-6">{children}</ul>,
          ol: ({ children }) => <ol className="mb-4 space-y-2 pl-6">{children}</ol>,
          li: ({ children }) => <li className="text-gray-700">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-4 border-blue-200 bg-blue-50 py-2 pl-4 text-gray-600 italic">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-gray-100 px-2 py-1 text-sm">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="mb-4 overflow-x-auto rounded-lg bg-gray-100 p-4">{children}</pre>
          ),
          img: data => <img src={data.src} alt={data.alt} className="my-4 max-w-full rounded-lg" />,
        }}
        urlTransform={(url: string) => (url.startsWith('data:') ? url : defaultUrlTransform(url))}
      >
        {finalReport}
      </Markdown>
    </div>
  );
}

export default ReportRender;
