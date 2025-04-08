interface Response {
  text: string;
  keywords: string[];
  nextResponses: Response[];
  emotion?: 'frustrated' | 'confused' | 'anxious' | 'calm' | 'satisfied';
  customerDetails?: {
    name: string;
    studentId: string;
    centerNumber: string;
  };
}

export class ConversationService {
  private responses: Response[];
  private currentScenario: number;
  private scenarioStep: number;
  private scenarioResolved: boolean;
  private customerDetails: {
    name: string;
    studentId: string;
    centerNumber: string;
  };

  constructor() {
    this.currentScenario = 0;
    this.scenarioStep = 0;
    this.scenarioResolved = false;
    this.customerDetails = {
      name: 'Sarah Johnson',
      studentId: 'STU2024001',
      centerNumber: 'CN12345'
    };
    this.responses = [
      {
        text: "Hello, I'm having trouble with my exam registration. The system keeps showing an error message when I try to submit my application. I've been trying for hours and I'm getting really frustrated. Can you help me?",
        keywords: ['help', 'error', 'registration', 'submit'],
        emotion: 'frustrated',
        customerDetails: this.customerDetails,
        nextResponses: [
          {
            text: "The error message says 'Invalid student ID format'. I've checked my ID number multiple times and it's correct. I don't understand why it's not working.",
            keywords: ['id', 'format', 'invalid', 'number'],
            emotion: 'confused',
            nextResponses: []
          },
          {
            text: "I need to register for my final exams by tomorrow, and I'm really worried I won't be able to. What should I do?",
            keywords: ['deadline', 'tomorrow', 'worried', 'urgent'],
            emotion: 'anxious',
            nextResponses: []
          }
        ]
      },
      {
        text: "I've just received my exam timetable and there's a conflict between two of my exams. They're scheduled for the same time on the same day. I don't know what to do about this.",
        keywords: ['timetable', 'conflict', 'schedule', 'same time'],
        emotion: 'anxious',
        customerDetails: this.customerDetails,
        nextResponses: [
          {
            text: "Both exams are core modules for my degree, and I can't afford to miss either of them. Is there any way to reschedule one of them?",
            keywords: ['core', 'modules', 'reschedule', 'important'],
            emotion: 'anxious',
            nextResponses: []
          }
        ]
      },
      {
        text: "I need to request special accommodations for my exams due to my disability. I've submitted the medical documentation but haven't heard back yet. The exams are in two weeks.",
        keywords: ['accommodations', 'disability', 'medical', 'documentation'],
        emotion: 'anxious',
        customerDetails: this.customerDetails,
        nextResponses: [
          {
            text: "I have dyslexia and need extra time and a quiet room. I submitted all the required forms last month. Can you check the status of my request?",
            keywords: ['dyslexia', 'extra time', 'quiet room', 'status'],
            emotion: 'calm',
            nextResponses: []
          }
        ]
      },
      {
        text: "I missed my exam yesterday because of a family emergency. I have the documentation to prove it. What's the process for applying for a resit?",
        keywords: ['missed', 'emergency', 'documentation', 'resit'],
        emotion: 'calm',
        customerDetails: this.customerDetails,
        nextResponses: [
          {
            text: "I have the hospital documents and a letter from my doctor. When is the deadline to submit these for consideration?",
            keywords: ['hospital', 'doctor', 'deadline', 'submit'],
            emotion: 'calm',
            nextResponses: []
          }
        ]
      }
    ];
  }

  getInitialMessage(): string {
    const scenario = this.responses[this.currentScenario];
    return scenario.text;
  }

  getCustomerDetails(): { name: string; studentId: string; centerNumber: string } {
    return this.customerDetails;
  }

  getResponse(userInput: string): string {
    const input = userInput.toLowerCase();
    const currentScenario = this.responses[this.currentScenario];
    
    // Check for requests for customer details
    if (input.includes('name') || input.includes('who are you')) {
      return `My name is ${this.customerDetails.name}.`;
    }
    if (input.includes('id') || input.includes('student number')) {
      return `My student ID is ${this.customerDetails.studentId}.`;
    }
    if (input.includes('center') || input.includes('centre')) {
      return `My center number is ${this.customerDetails.centerNumber}.`;
    }

    // Check if the response contains helpful keywords
    const helpfulKeywords = ['help', 'assist', 'support', 'check', 'verify', 'confirm', 'understand', 'apologize'];
    const isHelpful = helpfulKeywords.some(keyword => input.includes(keyword));
    
    // Check for resolution keywords
    const resolutionKeywords = ['resolved', 'fixed', 'sorted', 'done', 'completed', 'finished'];
    const isResolved = resolutionKeywords.some(keyword => input.includes(keyword));

    if (!isHelpful && !isResolved) {
      return "I'm not sure how that helps with my current issue. Could you please provide more specific assistance?";
    }

    if (isResolved) {
      this.scenarioResolved = true;
      return "Thank you for your help! That resolves my issue. I appreciate your assistance.";
    }

    // Move to next step in scenario
    this.scenarioStep++;
    
    if (this.scenarioStep < currentScenario.nextResponses.length) {
      return currentScenario.nextResponses[this.scenarioStep].text;
    } else {
      // Move to next scenario only if current one is resolved
      if (this.scenarioResolved) {
        this.currentScenario = (this.currentScenario + 1) % this.responses.length;
        this.scenarioStep = 0;
        this.scenarioResolved = false;
        return this.responses[this.currentScenario].text;
      } else {
        return "I'm still having issues with this. Could you please provide more specific assistance?";
      }
    }
  }
} 