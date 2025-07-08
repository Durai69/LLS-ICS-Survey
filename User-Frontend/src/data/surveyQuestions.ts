export interface SurveyQuestion {
  id: number;
  category: 'QUALITY' | 'DELIVERY' | 'COMMUNICATION' | 'RESPONSIVENESS' | 'IMPROVEMENT';
  text: string;
  type: 'rating';
  order: number;
}

export const surveyQuestions: SurveyQuestion[] = [
  // QUALITY
  { id: 1, category: 'QUALITY', text: 'Understands Customer needs', type: 'rating', order: 1 },
  { id: 2, category: 'QUALITY', text: 'Provides 100% quality parts / service / information', type: 'rating', order: 2 },
  { id: 3, category: 'QUALITY', text: 'Accepts responsibility for quality works', type: 'rating', order: 3 },
  { id: 4, category: 'QUALITY', text: 'Eliminates repetitive complaints', type: 'rating', order: 4 },

  // DELIVERY
  { id: 5, category: 'DELIVERY', text: 'Fulfill 100% committed targets in service / information', type: 'rating', order: 5 },
  { id: 6, category: 'DELIVERY', text: 'Delivers promptly on time', type: 'rating', order: 6 },
  { id: 7, category: 'DELIVERY', text: 'Delivers to point of use', type: 'rating', order: 7 },
  { id: 8, category: 'DELIVERY', text: 'Delivers usable parts / service / information', type: 'rating', order: 8 },

  // COMMUNICATION
  { id: 9, category: 'COMMUNICATION', text: 'Interacts with customer regularly', type: 'rating', order: 9 },
  { id: 10, category: 'COMMUNICATION', text: 'Listens to customers views', type: 'rating', order: 10 },
  { id: 11, category: 'COMMUNICATION', text: 'Ensures timely feedback to customers', type: 'rating', order: 11 },
  { id: 12, category: 'COMMUNICATION', text: 'Reviews of changes with the customer', type: 'rating', order: 12 },

  // RESPONSIVENESS
  { id: 13, category: 'RESPONSIVENESS', text: 'Responds to customer complaints promptly', type: 'rating', order: 13 },
  { id: 14, category: 'RESPONSIVENESS', text: 'Provides service when needed', type: 'rating', order: 14 },
  { id: 15, category: 'RESPONSIVENESS', text: 'Responds quickly to changed customer needs', type: 'rating', order: 15 },
  { id: 16, category: 'RESPONSIVENESS', text: 'Goes extra mile to help', type: 'rating', order: 16 },

  // IMPROVEMENT
  { id: 17, category: 'IMPROVEMENT', text: 'Has a positive attitude for improvement', type: 'rating', order: 17 },
  { id: 18, category: 'IMPROVEMENT', text: 'Implements improvement', type: 'rating', order: 18 },
  { id: 19, category: 'IMPROVEMENT', text: 'Effectiveness of improvements', type: 'rating', order: 19 },
  { id: 20, category: 'IMPROVEMENT', text: 'Facilitates improvements at customer end', type: 'rating', order: 20 },
];
