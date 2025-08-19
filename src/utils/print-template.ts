export const getPrintTemplate = (content: string): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Research Report</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.7;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 30px;
            color: #2c3e50;
            background-color: #ffffff;
            font-size: 16px;
          }

          /* Typography */
          h1 {
            color: #1a202c;
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 3px solid #3498db;
            position: relative;
          }

          h1::after {
            content: '';
            position: absolute;
            bottom: -3px;
            left: 0;
            width: 60px;
            height: 3px;
            background: linear-gradient(90deg, #3498db, #2980b9);
          }

          h2 {
            color: #2d3748;
            font-size: 1.8rem;
            font-weight: 600;
            margin-top: 3rem;
            margin-bottom: 1.5rem;
            padding-left: 1rem;
            border-left: 4px solid #3498db;
            background: linear-gradient(90deg, #f8f9fa, transparent);
            padding: 0.8rem 0 0.8rem 1.5rem;
          }

          h3 {
            color: #4a5568;
            font-size: 1.4rem;
            font-weight: 600;
            margin-top: 2.5rem;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid #e2e8f0;
          }

          h4 {
            color: #718096;
            font-size: 1.2rem;
            font-weight: 600;
            margin-top: 2rem;
            margin-bottom: 0.8rem;
          }

          h5, h6 {
            color: #a0aec0;
            font-size: 1.1rem;
            font-weight: 600;
            margin-top: 1.5rem;
            margin-bottom: 0.6rem;
          }

          /* Paragraphs and text */
          p {
            margin-bottom: 1.5rem;
            text-align: justify;
            hyphens: auto;
          }

          strong {
            color: #2d3748;
            font-weight: 600;
          }

          em {
            font-style: italic;
            color: #4a5568;
          }

          /* Lists */
          ul, ol {
            margin-bottom: 1.5rem;
            padding-left: 2rem;
          }

          ul {
            list-style-type: none;
          }

          ul li::before {
            content: '•';
            color: #3498db;
            font-weight: bold;
            position: absolute;
            margin-left: -1.5rem;
            font-size: 1.2rem;
          }

          ol {
            list-style-type: decimal;
            list-style-position: outside;
          }

          ol li {
            margin-left: 0.5rem;
          }

          li {
            margin-bottom: 0.8rem;
            position: relative;
            line-height: 1.6;
          }

          /* Blockquotes */
          blockquote {
            border-left: 5px solid #3498db;
            background: linear-gradient(90deg, #f8f9fa, #ffffff);
            padding: 1.5rem 2rem;
            margin: 2rem 0;
            font-style: italic;
            position: relative;
            border-radius: 0 8px 8px 0;
            box-shadow: 0 2px 8px rgba(52, 152, 219, 0.1);
          }

          blockquote::before {
            content: '"';
            font-size: 4rem;
            color: #3498db;
            position: absolute;
            top: -0.5rem;
            left: 1rem;
            opacity: 0.3;
            font-family: serif;
          }

          blockquote p:last-child {
            margin-bottom: 0;
          }

          /* Code */
          code {
            background-color: #f1f5f9;
            color: #e53e3e;
            padding: 0.3rem 0.6rem;
            border-radius: 6px;
            font-size: 0.9em;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
            border: 1px solid #e2e8f0;
          }

          pre {
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            border: 1px solid #dee2e6;
            padding: 1.5rem;
            border-radius: 12px;
            overflow-x: auto;
            margin: 2rem 0;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
            position: relative;
          }

          pre code {
            background: none;
            color: #495057;
            padding: 0;
            border: none;
            font-size: 0.9rem;
            line-height: 1.5;
          }

          pre::before {
            content: '';
            position: absolute;
            top: 1rem;
            right: 1rem;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #28a745;
            box-shadow: -20px 0 #ffc107, -40px 0 #dc3545;
          }

          /* Tables */
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 2rem 0;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
          }

          th, td {
            padding: 1rem 1.5rem;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
          }

          th {
            background: linear-gradient(90deg, #3498db, #2980b9);
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.9rem;
            letter-spacing: 0.5px;
          }

          tbody tr:hover {
            background-color: #f8f9fa;
          }

          tbody tr:last-child td {
            border-bottom: none;
          }

          /* Links */
          a {
            color: #3498db;
            text-decoration: none;
            font-weight: 500;
            border-bottom: 1px solid transparent;
            transition: all 0.2s ease;
          }

          a:hover {
            color: #2980b9;
            border-bottom-color: #2980b9;
          }

          /* Horizontal rules */
          hr {
            border: none;
            height: 2px;
            background: linear-gradient(90deg, transparent, #3498db, transparent);
            margin: 3rem 0;
          }

          /* Images */
          img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 1rem 0;
          }

          /* Responsive design */
          @media (max-width: 768px) {
            body {
              padding: 20px 15px;
              font-size: 14px;
            }

            h1 {
              font-size: 2rem;
            }

            h2 {
              font-size: 1.5rem;
            }

            h3 {
              font-size: 1.3rem;
            }
          }
        </style>
      </head>
      <body>
        <div id="report-content">${content}</div>
      </body>
    </html>
  `;
};
