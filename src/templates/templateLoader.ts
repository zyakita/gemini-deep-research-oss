import type { QueryTemplate } from '../stores/queryLibrary';

interface MarkdownTemplate {
  frontmatter: {
    id: string;
    title: string;
    isBuiltIn: boolean;
    createdAt: string;
    updatedAt: string;
  };
  content: string;
}

function parseMarkdownTemplate(markdown: string): MarkdownTemplate {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);

  if (!match) {
    throw new Error('Invalid markdown template format');
  }

  const [, frontmatterText, content] = match;

  // Parse frontmatter
  const frontmatter: Record<string, string | boolean> = {};
  const lines = frontmatterText.split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();

      // Parse boolean values
      if (value === 'true') {
        frontmatter[key] = true;
      } else if (value === 'false') {
        frontmatter[key] = false;
      } else {
        frontmatter[key] = value;
      }
    }
  }

  return {
    frontmatter: frontmatter as MarkdownTemplate['frontmatter'],
    content: content.trim(),
  };
}

function convertToQueryTemplate(markdownTemplate: MarkdownTemplate): QueryTemplate {
  return {
    id: markdownTemplate.frontmatter.id,
    title: markdownTemplate.frontmatter.title,
    content: markdownTemplate.content,
    isBuiltIn: markdownTemplate.frontmatter.isBuiltIn,
    createdAt: markdownTemplate.frontmatter.createdAt,
    updatedAt: markdownTemplate.frontmatter.updatedAt,
  };
}

// Use Vite's glob import to automatically load all markdown files from the md directory
const markdownModules: Record<string, string> = import.meta.glob('./md/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

// Convert the imported modules to QueryTemplates
export const builtInTemplates: QueryTemplate[] = Object.values(markdownModules).map((md: string) =>
  convertToQueryTemplate(parseMarkdownTemplate(md))
);
