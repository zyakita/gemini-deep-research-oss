# Deep Research OSS

[![License: MIT](https://img.shields.io/badge/License-MIT-default.svg)](https://opensource.org/licenses/MIT)
[![Gemini](https://img.shields.io/badge/Gemini-8E75B2?style=flat&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=Vite&logoColor=white)](https://vite.dev/)

> This project is an independent, open-source initiative and is not affiliated with, endorsed by, or sponsored by Google or the Google Gemini team. It is built by the community for the community.

This open-source tool is an attempt to build a better research automation tool with Google's Gemini models. Instead of the usual single-pass search, it uses a team of AI agents to perform a multi-step, iterative research process. The idea is to start broad, then systematically drill down into the details to produce a comprehensive report.

<img width="1542" height="991" alt="frame_safari_light" src="https://github.com/user-attachments/assets/dc056665-4559-40f5-b4d6-fbf68d9be4da" />

### Demo

https://deep-research.oss.jqkat.com/

## The Core Idea

Most research tools just do a single-pass search, which often misses the good stuff. I wanted to build something that mirrors how a human research team works: exploring a topic from multiple angles, identifying gaps, and then digging deeper.

I've also noticed that many open-source research tools support multiple AI providers. While that's a great goal, it often compromises the workflow. This project does the opposite. It focuses solely on the Gemini API to see how far it can be pushed.

### The Multi-Agent Research Pipeline

The whole process is broken down into specialized tasks, with a dedicated agent for each step:

- **1. QNA Agent:** First, it questions the user's query to find ambiguities and refine the research scope.
- **2. Research Lead Agent:** Breaks down the main goal into broad, foundational research tasks.
- **3. Report Plan Agent:** Structures the output by creating a logical blueprint for the final report.
- **4. Research Deep Agent:** Performs a gap analysis by comparing findings against the report plan, then creates new tasks to fill in the blanks. This is the core of the "deep dive."
- **5. Researcher Agent:** Executes the research tasks by hitting the web to find and document facts.
- **6. Reporter Agent:** Transforms all the raw data into a final, coherent report. It also fact-checks numbers to make sure the output is accurate.

### Serious Prompt Engineering

I've noticed that some research tools use relatively short prompts. Here, the prompts are long and detailed by design. The goal is to provide research agents with comprehensive instructions to produce better, more structured output.

### How It Works

<img alt="flow" src="https://github.com/user-attachments/assets/beb16e8b-928c-49ff-b8e9-ce2bf94132b0" />

## Features

- **Iterative Research Pipeline:** Starts with broad research, then iteratively deepens the focus by performing gap analysis to ensure nothing important is missed.
- **Data-Verified Reports:** A final reporting agent synthesizes all findings and fact-checks numerical data for better accuracy.
- **Structured Output:** Generates well-organized reports guided by a dynamic plan.
- **Gemini-Native:** Built from the ground up for the Gemini API. No compromises for other providers.
- **Customizable Tone & Depth:** Control the tone (e.g., 'academic', 'casual') and length of the final report.

### Limitations

The model is forced to use the `code execution` tool for every number in the report, sometimes it cannot maintain the tone of the report or suddenly stops.

This issue is also noted in the [Gemini documentation](https://ai.google.dev/gemini-api/docs/code-execution#limitations), currently I have not thought of a way to ensure the quality of the calculations so I accept it as a problem for the future.

## Getting Started

### Prerequisites

You will need a Google GenAI API key to access the AI models. Get your key at [Google AI Studio](https://aistudio.google.com/).

### Local Installation

Require Node 20+, pnpm 10+

1.  Clone the repository:
    ```bash
    git clone https://github.com/zyakita/gemini-deep-research-oss.git
    cd gemini-deep-research-oss
    ```
2.  Install packages:
    ```bash
    pnpm install
    ```
3.  Start
    ```bash
    pnpm dev
    ```

### [Optional] Config the Grounding URL Fixer

When using the Gemini API with Google Search grounding, the API returns censored `uri` values that look like this:

```json
"groundingChunks": [
  {
    "web": {
      "uri": "https://vertexaisearch.cloud.google.com/...",
      "title": "example.com"
    }
  }
]
```

Trying to fetch this `uri` from a browser fails due to CORS issues, which is a dead end for finding the real destination.

#### The Fix

I developed [a tiny app](https://github.com/zyakita/vertexaisearch-uri-resolver) to fix this problem.

You can deploy it anywhere, then set `VITE_VERTEXAISEARCH_RESOLVER` to this project's `env`

## Deployment

This is a simple SPA built with Vite, you can deploy it anywhere using Vite's official guide: https://vite.dev/guide/static-deploy.html

## Contributing

Contributions are welcome! If you have ideas for improvements or find a bug, feel free to open an issue or submit a pull request.

## Connect with Me

Have questions or ideas? You can find me on:

- **X:** [@phongttnb](https://x.com/phongttnb)
- **LinkedIn:** [Phong Tran](https://www.linkedin.com/in/phong-tran-965b66145/)

## License

This project is licensed under the MIT License.
