import Markdown, { defaultUrlTransform } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

function ReportRender({ finalReport }: { finalReport: string }) {
  return (
    <div id="report-rendered" className="prose prose-sm max-w-none text-gray-700">
      <Markdown
        remarkPlugins={[
          remarkGfm,
          [
            remarkMath,
            {
              singleDollarTextMath: false,
            },
          ],
        ]}
        rehypePlugins={[
          rehypeRaw,
          [
            rehypeKatex,
            {
              throwOnError: false,
              errorColor: '#cc0000',
            },
          ],
        ]}
        components={{
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
