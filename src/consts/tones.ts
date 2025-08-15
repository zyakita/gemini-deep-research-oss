const tones = [
  {
    slug: 'journalist-tone',
    name: 'Journalist Tone',
    describe:
      'This tone is objective, factual, and authoritative, demonstrating a commitment to thoroughness and accuracy. The language is clear and concise, focusing on presenting evidence without bias to allow readers to form their own conclusions.',
    usage: 'Investigative reports, in-depth articles, and fact-finding research.',
  },
  {
    slug: 'formal-tone',
    name: 'Formal Tone',
    describe:
      'This tone conveys seriousness and respect for the topic through sophisticated and precise language. It avoids slang, contractions, and personal pronouns, adhering to strict grammatical rules for a polished presentation.',
    usage: 'Academic papers, scientific research, official business reports, and legal documents.',
  },
  {
    slug: 'objective-tone',
    name: 'Objective Tone',
    describe:
      'This tone is neutral and impartial, presenting information without personal bias, opinions, or emotions. The focus is entirely on facts, data, and verifiable evidence, excluding any subjective language.',
    usage: 'Scientific reports, news articles, technical documentation, and academic research.',
  },
  {
    slug: 'analytical-tone',
    name: 'Analytical Tone',
    describe:
      'This tone involves a critical and logical examination of a topic to foster a deeper understanding. It systematically breaks down complex information, evaluates evidence, and explores relationships between different points to draw reasoned conclusions.',
    usage: 'Research papers, case studies, critical reviews, and financial analysis reports.',
  },
  {
    slug: 'persuasive-tone',
    name: 'Persuasive Tone',
    describe:
      'This tone aims to convince the reader to accept a particular viewpoint or take a specific action. It builds a compelling case by using logical arguments, strong evidence, and sound reasoning to support its claims.',
    usage: 'Grant proposals, policy briefs, research proposals, and recommendation reports.',
  },
  {
    slug: 'informative-tone',
    name: 'Informative Tone',
    describe:
      'This tone focuses on educating the reader by providing clear and factual information on a specific topic. It presents details in a direct and straightforward manner to ensure the material is easily understood.',
    usage: 'Textbooks, training manuals, informational reports, and encyclopedic entries.',
  },
  {
    slug: 'technical-tone',
    name: 'Technical Tone',
    describe:
      'This tone is highly specialized and precise, intended for an audience with pre-existing knowledge of the subject. It uses the specific jargon and terminology of a particular field to communicate complex information efficiently.',
    usage:
      'Engineering reports, medical research papers, software documentation, and scientific articles.',
  },
  {
    slug: 'confident-tone',
    name: 'Confident Tone',
    describe:
      'This tone conveys a strong sense of authority and certainty about the subject matter. It is characterized by assertive and direct language, which must be well-supported by evidence to build trust with the reader.',
    usage:
      'Executive summaries, project proposals, and research papers presenting groundbreaking findings.',
  },
  {
    slug: 'cautious-tone',
    name: 'Cautious Tone',
    describe:
      "This tone is careful and measured, used when findings are preliminary or when there are limitations to the research. It employs qualifying language, such as 'may suggest' or 'it appears that,' to avoid making definitive claims.",
    usage:
      'Reports on ongoing research, discussion sections of academic papers, and when interpreting ambiguous data.',
  },
  {
    slug: 'reflective-tone',
    name: 'Reflective Tone',
    describe:
      "This tone is more introspective, allowing the writer to consider the broader implications of the research or report. It explores the author's thoughts and considerations on the topic, while still being grounded in the presented evidence.",
    usage:
      'Qualitative research, case studies with personal observation, and concluding sections of reports where future directions are considered.',
  },
];

export default tones;
