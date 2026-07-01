import type { FC } from 'react';
import { Question } from "@/utils/quiz-engine";
import MultipleChoice from "./MultipleChoice";
import FillInTheBlank from "./FillInTheBlank";
import ImageQuestion from "./ImageQuestion";
import FlashcardQuestion from "./FlashcardQuestion";

interface QuestionRendererProps {
  question: Question;
  onAnswer: (answer: string | boolean) => void;
  selectedAnswer?: string;
  isCorrect?: boolean;
}

const QuestionRenderer: FC<QuestionRendererProps> = ({
  question,
  onAnswer,
  selectedAnswer,
  isCorrect
}) => {
  switch (question.type) {
    case 'mcq':
      return (
        <MultipleChoice
          question={question.question}
          options={question.options || []}
          correctAnswer={question.correctAnswer}
          onAnswer={(ans) => onAnswer(ans)}
          selectedAnswer={selectedAnswer}
          isCorrect={isCorrect}
        />
      );
    case 'fill-in-the-blank':
      return (
        <FillInTheBlank
          question={question.question}
          correctAnswer={question.correctAnswer}
          onAnswer={(ans) => onAnswer(ans)}
          selectedAnswer={selectedAnswer}
          isCorrect={isCorrect}
        />
      );
    case 'image':
      return (
        <ImageQuestion
          question={question.question}
          imageUrl={question.imageUrl || ''}
          options={question.options || []}
          correctAnswer={question.correctAnswer}
          onAnswer={(ans) => onAnswer(ans)}
          selectedAnswer={selectedAnswer}
          isCorrect={isCorrect}
        />
      );
    case 'flashcard':
      return (
        <FlashcardQuestion
          question={question.question}
          correctAnswer={question.correctAnswer}
          explanation={question.explanation}
          onAnswer={(correct) => onAnswer(correct)}
        />
      );
    default:
      return null;
  }
};

export default QuestionRenderer;
