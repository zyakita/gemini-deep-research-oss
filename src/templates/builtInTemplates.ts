import type { QueryTemplate } from '../stores/queryLibrary';

export const builtInTemplates: QueryTemplate[] = [
  {
    id: 'builtin-stock-investment-memo',
    title: 'Stock Investment Memo',
    content: `Create an investment memo on [Company Name] ([Stock Code]).

Adopt the mindset of a business owner who is long-term and value-oriented.
Your goal is to uncover the business's core story and its lasting economic characteristics.
Think like an investigative journalist, repeatedly asking "Why?" to dig deeper than surface-level facts.

Your investigation should focus on three core pillars.

1. The Business and its Moat:
  - What is the company's fundamental economic driver? Define its competitive advantage, or "moat."
  - Is the moat widening or shrinking? What evidence supports your conclusion?

2. Management's Skill & Alignment:
  - Examine their capital allocation decisions to determine whether they are rational and demonstrate a long-term vision. Are they acting like true owners?

3. The Variant Perception:
  - Identify the single most critical factor—an opportunity or a threat—that the market appears to be mispricing or overlooking. This is the crux of the thesis.

Organize your final memo into two distinct parts.

The Business Profile
- Don't just list facts; create a compelling narrative.
- Combine your analysis of the company's moat, management, and industry dynamics to tell a coherent story that showcases the company's identity and importance.

The Investment Thesis
- Core Insight: Clearly state the variant perception.
- Valuation: Use three different methodologies for comparison and provide an estimate of the average intrinsic value. Does the current price offer a significant margin of safety? Explain your answer.
- Verdict & Risks: Provide a clear recommendation (buy, hold, or avoid) with an investment horizon of three to five years. Briefly state the two to three top risks that could invalidate your thesis.`,
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'builtin-startup-analysis',
    title: 'Startup Investment Analysis',
    content: `Evaluate [Startup Name] as a potential investment opportunity:

1. Business Model Analysis
   - Value proposition and target market
   - Revenue model and unit economics
   - Go-to-market strategy effectiveness

2. Market Opportunity
   - Total addressable market (TAM) size
   - Market timing and adoption curves
   - Competitive positioning and differentiation

3. Team & Execution
   - Founder and management team background
   - Previous experience and track record
   - Execution capability and milestones achieved

4. Technology & Product
   - Technology moat and IP position
   - Product-market fit evidence
   - Scalability and technical risks

5. Financial Metrics
   - Revenue growth and burn rate
   - Customer acquisition costs and lifetime value
   - Runway and funding requirements

6. Investment Terms & Valuation
   - Valuation methodology and benchmarks
   - Investment terms and structure
   - Exit potential and timeline

7. Risk Assessment
   - Key execution risks
   - Market and competitive risks
   - Regulatory and technology risks

Include specific metrics, comparable companies, and due diligence insights.`,
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];
