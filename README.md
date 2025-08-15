# Gemini Deep Research OSS

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This open-source tool is designed for in-depth research using Google's Gemini models. It is specifically designed to leverage the large context window and built-in search capabilities of models like Gemini Pro.

## The Core Idea

I use Gemini models every day. Their ability to handle large amounts of context and use Google Search makes them fantastic for research.

I've noticed that many open-source research tools support multiple AI providers. While that's a great goal, it often means the workflow is compromised. This project does the opposite. It focuses only on the Gemini API to see how far it can be pushed.

Here are the key design choices:

#### A Multiple-Step Research Pipeline

- **QNA:** A query refinement specialist analyzes user research queries to identify ambiguities and generate clarifying questions with predicted answers. These questions help users refine their research scope.
- **Report Plan:** A strategic outline generator that synthesizes initial research queries and Q&A sessions into structured, logical report blueprints with clear sections and descriptions.
- **Research Lead:** A strategic task decomposer that breaks down complex research objectives into high-level, foundational research tasks for subordinate research agents.
- **Research Deep:** A gap analysis specialist that compares research findings against report requirements to identify missing information and generate targeted, in-depth research tasks.
- **Researcher:** An expert research analyst who executes specific research directives through live internet searches and synthesizes findings into factual, information-dense learning documents.
- **Reporter:** A comprehensive report writer that transforms research findings into detailed final reports. It ensures zero omission of data and applies thorough analysis using an elaboration framework.

#### Serious Prompt Engineering

I've noticed that some research tools use relatively short prompts. Here, the prompts are long and detailed by design. The goal is to provide research agents with comprehensive instructions for better, more structured output.

## Features

- **Gemini-Native:** Built from the ground up for the Gemini API. No compromises for other models.
- **Research Pipeline:** First, go broad. Then, go deep.
- **Detailed Prompting:** Uses extensive prompt engineering for high-quality results.
- **Customizable Reports:** Control the tone (e.g., 'academic', 'casual') and length/depth of the final report through simple setting.

## Getting Started

### Prerequisites

You will need a Google GenAI API key to access the AI models.

1.  Get your key at [Google AI Studio](https://aistudio.google.com/).

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

## Contributing

Contributions are welcome! If you have ideas for improvements or find a bug, feel free to open an issue or submit a pull request.

## Connect with Me

Have questions or ideas? You can find me on:

- **X:** [@phongttnb](https://x.com/phongttnb)
- **LinkedIn:** [Phong Tran](https://www.linkedin.com/in/phong-tran-965b66145/)

## License

This project is licensed under the MIT License.
