
export interface SurveyCategory {
  id: string;
  name: string;
  questions: {
    id: string;
    text: string;
  }[];
}

export const surveyCategories: SurveyCategory[] = [
  {
    id: 'quality',
    name: 'Quality',
    questions: [
      {
        id: 'q1',
        text: 'Understands Customer needs',
      },
      {
        id: 'q2',
        text: 'Provides 100% quality parts / service / information',
      },
      {
        id: 'q3',
        text: 'Accepts responsibility for quality works',
      },
      {
        id: 'q4',
        text: 'Resolves quality issues promptly',
      },
    ],
  },
  {
    id: 'delivery',
    name: 'Delivery',
    questions: [
      {
        id: 'q5',
        text: 'Meets agreed deadlines',
      },
      {
        id: 'q6',
        text: 'Provides regular status updates',
      },
      {
        id: 'q7',
        text: 'Prioritizes urgent requests appropriately',
      },
      {
        id: 'q8',
        text: 'Has efficient delivery processes',
      },
    ],
  },
  {
    id: 'communication',
    name: 'Communication',
    questions: [
      {
        id: 'q9',
        text: 'Communicates clearly and effectively',
      },
      {
        id: 'q10',
        text: 'Responds promptly to inquiries',
      },
      {
        id: 'q11',
        text: 'Shares relevant information proactively',
      },
      {
        id: 'q12',
        text: 'Listens to and understands requirements',
      },
    ],
  },
  {
    id: 'responsiveness',
    name: 'Responsiveness',
    questions: [
      {
        id: 'q13',
        text: 'Responds quickly to requests',
      },
      {
        id: 'q14',
        text: 'Shows flexibility when needed',
      },
      {
        id: 'q15',
        text: 'Makes themselves available for discussions',
      },
      {
        id: 'q16',
        text: 'Takes initiative to solve problems',
      },
    ],
  },
  {
    id: 'improvement',
    name: 'Improvement',
    questions: [
      {
        id: 'q17',
        text: 'Continuously improves processes',
      },
      {
        id: 'q18',
        text: 'Seeks and applies feedback',
      },
      {
        id: 'q19',
        text: 'Implements innovative solutions',
      },
      {
        id: 'q20',
        text: 'Shares best practices with other teams',
      },
    ],
  },
];
