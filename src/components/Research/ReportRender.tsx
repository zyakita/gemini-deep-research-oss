import Markdown, { defaultUrlTransform } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

function ReportRender({ finalReport }: { finalReport: string }) {
  // Preprocess the content to handle inline math with single dollars
  const preprocessMath = (content: string): string => {
    // This regex matches $...$ patterns that are likely math (not currency)
    // It looks for patterns that:
    // 1. Start with $ followed by non-whitespace
    // 2. Contain math-like characters (letters, numbers, operators, parentheses, etc.)
    // 3. End with non-whitespace followed by $
    // 4. Are not preceded or followed by word characters (to avoid currency conflicts)
    const mathPattern = /(?<!\w)\$([^\s$][^$]*[^\s$])\$(?!\w)/g;

    return content.replace(mathPattern, (match, mathContent) => {
      // Additional check to ensure this looks like math, not currency
      // Math expressions typically contain: variables, operators, parentheses, etc.
      const mathIndicators = /[a-zA-Z+\-*/=()^_{}\\\s]/;
      if (mathIndicators.test(mathContent)) {
        return `$$${mathContent}$$`;
      }
      return match; // Keep original if it doesn't look like math
    });
  };

  const processedReport = preprocessMath(finalReport);

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
        {processedReport}
      </Markdown>
    </div>
  );
}

export default ReportRender;
