export type PlacementSkillKey = 'listening' | 'reading' | 'writing' | 'speaking';

export type PlacementQuestionOption = {
  id: string;
  text: string;
};

export type PlacementQuestion = {
  id: string;
  skill: PlacementSkillKey;
  prompt: string;
  options: PlacementQuestionOption[];
  correctOptionId: string;
  explanation: string;
};

export type PlacementSkillResult = {
  skill: PlacementSkillKey;
  correct: number;
  total: number;
  band: number;
};

export type PlacementResult = {
  totalCorrect: number;
  totalQuestions: number;
  overallBand: number;
  skillResults: Record<PlacementSkillKey, PlacementSkillResult>;
  weakSkills: PlacementSkillKey[];
  strongSkills: PlacementSkillKey[];
};

export const placementSkillLabels: Record<PlacementSkillKey, string> = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
};

export const placementQuestions: PlacementQuestion[] = [
  {
    id: 'r1',
    skill: 'reading',
    prompt:
      'Passage: Many city planners now argue that adding bike lanes improves traffic flow because short car trips are replaced by cycling. What is the main idea?',
    options: [
      { id: 'a', text: 'Bike lanes always increase traffic jams.' },
      { id: 'b', text: 'Bike lanes can reduce congestion by replacing short car trips.' },
      { id: 'c', text: 'City planners should ban private cars immediately.' },
      { id: 'd', text: 'Cycling is only useful in small towns.' },
    ],
    correctOptionId: 'b',
    explanation: 'The sentence states that replacing short car trips with cycling improves flow.',
  },
  {
    id: 'r2',
    skill: 'reading',
    prompt:
      'In IELTS reading, what is the fastest strategy to answer a heading-matching task?',
    options: [
      { id: 'a', text: 'Read every line slowly before looking at headings.' },
      { id: 'b', text: 'Scan key nouns and topic sentences in each paragraph first.' },
      { id: 'c', text: 'Choose headings by sentence length.' },
      { id: 'd', text: 'Ignore repeated key words.' },
    ],
    correctOptionId: 'b',
    explanation: 'Heading matching is usually solved by skimming topic sentences and key terms quickly.',
  },
  {
    id: 'r3',
    skill: 'reading',
    prompt:
      'The report describes a "substantial" increase in online sales. Which word is closest in meaning to "substantial"?',
    options: [
      { id: 'a', text: 'Minor' },
      { id: 'b', text: 'Temporary' },
      { id: 'c', text: 'Significant' },
      { id: 'd', text: 'Unexpected' },
    ],
    correctOptionId: 'c',
    explanation: 'Substantial means large or significant in amount.',
  },
  {
    id: 'r4',
    skill: 'reading',
    prompt:
      'A paragraph says: "Most participants preferred online workshops, although a small group still favored face-to-face sessions." Which statement is TRUE?',
    options: [
      { id: 'a', text: 'Everyone preferred online workshops.' },
      { id: 'b', text: 'A minority still preferred in-person sessions.' },
      { id: 'c', text: 'Most participants disliked both formats.' },
      { id: 'd', text: 'Face-to-face sessions were canceled.' },
    ],
    correctOptionId: 'b',
    explanation: 'The text directly says a small group preferred face-to-face sessions.',
  },
  {
    id: 'r5',
    skill: 'reading',
    prompt:
      'Sentence: "The museum introduced audio guides, and this helped visitors understand complex exhibits." What does "this" refer to?',
    options: [
      { id: 'a', text: 'The museum building' },
      { id: 'b', text: "The visitors' prior knowledge" },
      { id: 'c', text: 'Introducing audio guides' },
      { id: 'd', text: 'Complex exhibits' },
    ],
    correctOptionId: 'c',
    explanation: 'The pronoun refers to the action immediately before it: introducing audio guides.',
  },
  {
    id: 'l1',
    skill: 'listening',
    prompt:
      'You hear: "The workshop starts at 9:30, but registration opens at 9:00." What time should attendees arrive to register?',
    options: [
      { id: 'a', text: '8:30' },
      { id: 'b', text: '9:00' },
      { id: 'c', text: '9:30' },
      { id: 'd', text: '10:00' },
    ],
    correctOptionId: 'b',
    explanation: 'Registration opens at 9:00, so that is the key detail.',
  },
  {
    id: 'l2',
    skill: 'listening',
    prompt:
      'You hear: "We wanted to launch in May, however supply issues delayed us until June." When was the launch?',
    options: [
      { id: 'a', text: 'April' },
      { id: 'b', text: 'May' },
      { id: 'c', text: 'June' },
      { id: 'd', text: 'July' },
    ],
    correctOptionId: 'c',
    explanation: 'The second clause corrects the initial plan: delayed until June.',
  },
  {
    id: 'l3',
    skill: 'listening',
    prompt:
      'You hear: "Could you send me the revised draft by Thursday evening?" What is requested?',
    options: [
      { id: 'a', text: 'A meeting on Thursday morning' },
      { id: 'b', text: 'A revised draft before Thursday evening' },
      { id: 'c', text: 'A final report next week' },
      { id: 'd', text: 'A phone call tonight' },
    ],
    correctOptionId: 'b',
    explanation: 'The speaker asks for the revised draft by Thursday evening.',
  },
  {
    id: 'l4',
    skill: 'listening',
    prompt:
      'You hear: "The north gate is closed for maintenance, so please use the east entrance." Which entrance should you use?',
    options: [
      { id: 'a', text: 'North entrance' },
      { id: 'b', text: 'West entrance' },
      { id: 'c', text: 'Main hall' },
      { id: 'd', text: 'East entrance' },
    ],
    correctOptionId: 'd',
    explanation: 'The speaker gives a clear instruction to use the east entrance.',
  },
  {
    id: 'l5',
    skill: 'listening',
    prompt:
      'You hear: "The tutor says pronunciation matters, but fluency and idea development carry more weight overall." Which is most important overall?',
    options: [
      { id: 'a', text: 'Pronunciation only' },
      { id: 'b', text: 'Fluency and idea development' },
      { id: 'c', text: 'Vocabulary only' },
      { id: 'd', text: 'Speed of speaking only' },
    ],
    correctOptionId: 'b',
    explanation: 'The phrase "carry more weight overall" identifies the main priority.',
  },
  {
    id: 'w1',
    skill: 'writing',
    prompt:
      'Choose the best thesis sentence for IELTS Writing Task 2 (agree/disagree).',
    options: [
      { id: 'a', text: 'This essay is about many things in modern society.' },
      { id: 'b', text: 'I totally agree because technology improves access to education, but this depends on equal internet access.' },
      { id: 'c', text: 'People have different opinions and it is complicated.' },
      { id: 'd', text: 'In conclusion, there are pros and cons.' },
    ],
    correctOptionId: 'b',
    explanation: 'A strong thesis states position clearly and previews key reasoning.',
  },
  {
    id: 'w2',
    skill: 'writing',
    prompt:
      'Which sentence is the most formal and suitable for IELTS Writing?',
    options: [
      { id: 'a', text: 'Kids these days are kinda addicted to phones.' },
      { id: 'b', text: 'It is evident that excessive smartphone use can reduce attention span among adolescents.' },
      { id: 'c', text: 'Phones are super bad, you know.' },
      { id: 'd', text: 'I think phones are a big problem lol.' },
    ],
    correctOptionId: 'b',
    explanation: 'Option B uses formal register and precise academic wording.',
  },
  {
    id: 'w3',
    skill: 'writing',
    prompt:
      'Which connector best adds a contrasting idea in academic writing?',
    options: [
      { id: 'a', text: 'Moreover' },
      { id: 'b', text: 'For example' },
      { id: 'c', text: 'However' },
      { id: 'd', text: 'Therefore' },
    ],
    correctOptionId: 'c',
    explanation: '"However" is the common transition marker for contrast.',
  },
  {
    id: 'w4',
    skill: 'writing',
    prompt:
      'Pick the grammatically correct sentence.',
    options: [
      { id: 'a', text: 'The number of students are increasing rapidly.' },
      { id: 'b', text: 'The number of students is increasing rapidly.' },
      { id: 'c', text: 'The number of students increase rapidly.' },
      { id: 'd', text: 'The number of students have increased rapidly.' },
    ],
    correctOptionId: 'b',
    explanation: 'The subject "number" is singular, so it takes "is".',
  },
  {
    id: 'w5',
    skill: 'writing',
    prompt:
      'For Task 1 line graph, which opening is best?',
    options: [
      { id: 'a', text: 'The graph gives some information, and I will describe it now.' },
      { id: 'b', text: 'The line graph illustrates changes in annual train usage in three cities from 2000 to 2020.' },
      { id: 'c', text: 'People in cities like trains a lot.' },
      { id: 'd', text: 'This chart is very interesting and important for everyone.' },
    ],
    correctOptionId: 'b',
    explanation: 'A good opening paraphrases chart type, metric, scope, and time period clearly.',
  },
  {
    id: 's1',
    skill: 'speaking',
    prompt:
      'In IELTS Speaking Part 1, which response is strongest?',
    options: [
      { id: 'a', text: 'Yes.' },
      { id: 'b', text: 'I like reading because it helps me relax after work, especially short biographies.' },
      { id: 'c', text: 'Reading. Next question.' },
      { id: 'd', text: 'I do not know maybe.' },
    ],
    correctOptionId: 'b',
    explanation: 'The best answer extends naturally with reason and example.',
  },
  {
    id: 's2',
    skill: 'speaking',
    prompt:
      'How can you improve coherence in Speaking Part 2?',
    options: [
      { id: 'a', text: 'Use no structure and talk randomly.' },
      { id: 'b', text: 'Use a simple structure: context, main event, reflection.' },
      { id: 'c', text: 'Memorize one answer for all topics.' },
      { id: 'd', text: 'Only list vocabulary words.' },
    ],
    correctOptionId: 'b',
    explanation: 'A clear story framework improves fluency and coherence.',
  },
  {
    id: 's3',
    skill: 'speaking',
    prompt:
      'Which phrase gives a balanced opinion in Part 3?',
    options: [
      { id: 'a', text: 'It is always true in every case.' },
      { id: 'b', text: 'I have no idea.' },
      { id: 'c', text: 'In many cases this is beneficial, although it can create inequality in rural areas.' },
      { id: 'd', text: 'That is all.' },
    ],
    correctOptionId: 'c',
    explanation: 'Balanced responses with nuance are typical of higher band performance.',
  },
  {
    id: 's4',
    skill: 'speaking',
    prompt:
      'Which answer best demonstrates lexical flexibility?',
    options: [
      { id: 'a', text: 'The city is good, good, and very good.' },
      { id: 'b', text: 'The city is vibrant, well-connected, and culturally diverse.' },
      { id: 'c', text: 'The city is okay.' },
      { id: 'd', text: 'The city is like city.' },
    ],
    correctOptionId: 'b',
    explanation: 'Option B uses precise and varied vocabulary naturally.',
  },
  {
    id: 's5',
    skill: 'speaking',
    prompt:
      'What should you do if you need one second to think during speaking?',
    options: [
      { id: 'a', text: 'Stay silent for 10 seconds.' },
      { id: 'b', text: 'Use a filler naturally, then continue with a clear point.' },
      { id: 'c', text: 'Switch to your first language.' },
      { id: 'd', text: 'End your answer immediately.' },
    ],
    correctOptionId: 'b',
    explanation: 'Short natural fillers are acceptable if fluency is maintained.',
  },
];

function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

function scoreToBand(correct: number, total: number): number {
  if (total <= 0) {
    return 3.5;
  }

  const ratio = correct / total;
  const rawBand = 3.5 + ratio * 4.5;
  const clampedBand = Math.max(3.5, Math.min(rawBand, 8.0));

  return roundToHalf(clampedBand);
}

export function evaluatePlacementAnswers(
  answers: Record<string, string | undefined>
): PlacementResult {
  const skillKeys: PlacementSkillKey[] = ['listening', 'reading', 'writing', 'speaking'];
  const bySkill: Record<PlacementSkillKey, PlacementQuestion[]> = {
    listening: placementQuestions.filter((question) => question.skill === 'listening'),
    reading: placementQuestions.filter((question) => question.skill === 'reading'),
    writing: placementQuestions.filter((question) => question.skill === 'writing'),
    speaking: placementQuestions.filter((question) => question.skill === 'speaking'),
  };

  const skillResults = skillKeys.reduce<Record<PlacementSkillKey, PlacementSkillResult>>((acc, skill) => {
    const questions = bySkill[skill];
    const correct = questions.reduce((count, question) => {
      return count + (answers[question.id] === question.correctOptionId ? 1 : 0);
    }, 0);

    acc[skill] = {
      skill,
      correct,
      total: questions.length,
      band: scoreToBand(correct, questions.length),
    };

    return acc;
  }, {
    listening: { skill: 'listening', correct: 0, total: 0, band: 3.5 },
    reading: { skill: 'reading', correct: 0, total: 0, band: 3.5 },
    writing: { skill: 'writing', correct: 0, total: 0, band: 3.5 },
    speaking: { skill: 'speaking', correct: 0, total: 0, band: 3.5 },
  });

  const totalCorrect = placementQuestions.reduce((count, question) => {
    return count + (answers[question.id] === question.correctOptionId ? 1 : 0);
  }, 0);

  const totalQuestions = placementQuestions.length;
  const overallBand = roundToHalf(
    skillKeys.reduce((sum, skill) => sum + skillResults[skill].band, 0) / skillKeys.length
  );

  const sortedSkills = [...skillKeys].sort((a, b) => skillResults[a].band - skillResults[b].band);

  return {
    totalCorrect,
    totalQuestions,
    overallBand,
    skillResults,
    weakSkills: sortedSkills.slice(0, 2),
    strongSkills: [...sortedSkills].reverse().slice(0, 2),
  };
}
