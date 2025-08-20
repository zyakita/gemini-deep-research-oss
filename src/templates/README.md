# Template System

This directory contains the template system for the research application. Templates are now stored as Markdown files with frontmatter metadata.

## Adding New Templates

To add a new template:

1. Create a new `.md` file in the `md/` directory
2. Use the following format:

```markdown
---
id: unique-template-id
title: Template Display Name
isBuiltIn: true
createdAt: 2025-01-01T00:00:00Z
updatedAt: 2025-01-01T00:00:00Z
---

Your template content goes here as plaintext...
```

## Template Structure

### Frontmatter Fields

- `id`: Unique identifier for the template (string)
- `title`: Display name shown in the UI (string)
- `isBuiltIn`: Whether this is a built-in template (boolean)
- `createdAt`: ISO timestamp of creation (string)
- `updatedAt`: ISO timestamp of last update (string)

### Content

The content after the frontmatter `---` delimiter is the actual template text that will be used as plaintext. You can use:

- Placeholder variables like `[Company Name]` or `[Startup Name]`
- Plain text instructions and prompts
- Any text that will help guide the research process

Note: The content should be plaintext, not Markdown formatting, as it will be used directly as research prompts.

## How It Works

The `templateLoader.ts` file automatically scans all `.md` files in this directory using Vite's `import.meta.glob()` function and converts them into `QueryTemplate` objects that the application can use.

No manual imports or updates to TypeScript files are needed when adding new templates!
