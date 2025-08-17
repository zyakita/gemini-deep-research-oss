# Gemini Deep Research OSS

[![License: MIT](https://img.shields.io/badge/License-MIT-default.svg)](https://opensource.org/licenses/MIT)
[![Gemini](https://img.shields.io/badge/Gemini-8E75B2?style=flat&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=Vite&logoColor=white)](https://vite.dev/)

This open-source tool is designed for in-depth research using Google's Gemini models. It is specifically designed to leverage the large context window and built-in search capabilities of models like Gemini Pro.

<img width="1440" height="813" alt="screenshot" src="https://github.com/user-attachments/assets/7189fd99-d20c-400f-a2e7-895a230ca64b" />

### Demo

https://gemini-deep-research.oss.jqkat.com/

## The Core Idea

I use Gemini models every day. Their ability to handle large amounts of context and utilize Google Search makes them ideal for research purposes.

I've noticed that many open-source research tools support multiple AI providers. While that's a great goal, it often compromises the workflow. This project does the opposite. It focuses solely on the Gemini API to see how far it can be pushed.

Here are the key design choices:

#### A Multiple-Step Research Pipeline

*   **QNA:** Clarifies research scope by questioning query ambiguities.
*   **Report Plan:** Outlines a logical report structure based on initial inputs.
*   **Research Lead:** Deconstructs the primary objective into core research tasks.
*   **Research Deep:** Identifies and targets missing information with new research tasks.
*   **Researcher:** Executes tasks by searching the web and summarizing the results.
*   **Reporter:** Synthesizes all data into a complete, detailed final report.

#### Serious Prompt Engineering

I've noticed that some research tools use relatively short prompts. Here, the prompts are long and detailed by design. The goal is to provide research agents with comprehensive instructions to produce better, more structured output.

#### How It Works

<img alt="flow" src="https://github.com/user-attachments/assets/beb16e8b-928c-49ff-b8e9-ce2bf94132b0" />

## Features

- **Gemini-Native:** Built from the ground up for the Gemini API. No compromises for other providers.
- **Research Pipeline:** First, go broad. Then, go deep.
- **Detailed Prompting:** Uses extensive prompt engineering for high-quality results.
- **Customizable Reports:** Control the tone (e.g., 'academic', 'casual') and length/depth of the final report through simple setting.

## Getting Started

### Prerequisites

You will need a Google GenAI API key to access the AI models. Get your key at [Google AI Studio](https://aistudio.google.com/).

### Local Installation

Require Node 20+

1.  Clone the repository:
    ```bash
    git clone git@github.com:zyakita/gemini-deep-research-oss.git
    cd gemini-deep-research-oss
    ```
2.  Install packages:
    ```bash
    yarn install
    ```
3.  Start
    ```bash
    yarn dev
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
