import type { FC } from 'react';
import MultipleChoice from './MultipleChoice';
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ImageQuestionProps {
  question: string;
  imageUrl: string;
  options: string[];
  correctAnswer: string;
  onAnswer: (answer: string) => void;
  selectedAnswer?: string;
  isCorrect?: boolean;
}

const ImageQuestion: FC<ImageQuestionProps> = ({
  question,
  imageUrl,
  options,
  correctAnswer,
  onAnswer,
  selectedAnswer,
  isCorrect
}) => {
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border-2 border-border/50 dark:border-border shadow-sm">
        <AspectRatio ratio={16 / 9}>
          <img
            src={imageUrl}
            alt="Quiz visual"
            className="h-full w-full object-cover"
          />
        </AspectRatio>
      </div>
      
      <MultipleChoice
        question={question}
        options={options}
        correctAnswer={correctAnswer}
        onAnswer={onAnswer}
        selectedAnswer={selectedAnswer}
        isCorrect={isCorrect}
      />
    </div>
  );
};

export default ImageQuestion;
