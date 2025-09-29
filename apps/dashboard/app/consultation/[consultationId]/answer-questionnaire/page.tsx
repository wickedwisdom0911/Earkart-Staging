'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGetAllQuestions } from '@/hooks/questionnaire/use-get-questions';
import useSubmitAnswers from '@/hooks/questionnaire/use-answer-questions';
import { SubmitAnswersRequest } from '@/models/questionnaire.model';
import { AnswerType } from '@/models/enums';
import { useForm, Controller } from 'react-hook-form';
import * as Label from '@radix-ui/react-label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ROUTES } from '@/lib/routes'
import { useGetConsultation } from '@/hooks/consultation/use-get-consultation';
import { ConsultationModelData } from '@/models/consultation.model';

// Define the questionnaire answer type based on the actual structure
interface QuestionnaireAnswer {
  questionId: string;
  value?: string;
  selectedOptions?: Array<{
    option: {
      value: string;
    };
  }>;
}

export default function QuestionnairePage() {
  const { consultationId } = useParams();
  const cid = Array.isArray(consultationId) ? consultationId[0] : consultationId ?? '';
  const router = useRouter();
  const [isSkipping, setIsSkipping] = useState(false);

  const { data: resp, isLoading, isError } = useGetAllQuestions();
  const { data: consultationData, isLoading: isConsultationLoading } = useGetConsultation(cid);
  const questions = resp?.data ?? [];

  const sortedQuestions = useMemo(
    () => [...questions].sort((a, b) => a.order - b.order),
    [questions]
  );

  const { control, handleSubmit, reset } = useForm<SubmitAnswersRequest>({
    defaultValues: { consultationId: cid, answers: [] }
  });

  // Type the consultation data properly
  const consultation = consultationData?.data as ConsultationModelData | undefined;

  useEffect(() => {
    if (sortedQuestions.length > 0) {
      const hasExistingQuestionnaire = consultation?.questionnaire;
      
      if (hasExistingQuestionnaire) {
        // Prefill with existing answers
        const existingAnswers = consultation?.questionnaire?.answers as QuestionnaireAnswer[];
        const prefilledAnswers = sortedQuestions.map(q => {
          const existingAnswer = existingAnswers?.find(answer => answer.questionId === q.id);
          
          if (existingAnswer) {
            if (q.type === AnswerType.CHECKBOX) {
              // For checkbox, use selectedOptions array
              return {
                questionId: q.id,
                value: existingAnswer.selectedOptions?.map(opt => opt.option.value).join(',') || ''
              };
            } else if (q.type === AnswerType.MULTIPLE_CHOICE) {
              // For multiple choice, use the first selected option value
              return {
                questionId: q.id,
                value: existingAnswer.selectedOptions?.[0]?.option?.value || ''
              };
            } else {
              // For text, number, date fields, use the value
              return {
                questionId: q.id,
                value: existingAnswer.value || ''
              };
            }
          }
          
          // Default values for questions without existing answers
          return {
            questionId: q.id,
            value: ''
          };
        });

        reset({
          consultationId: cid,
          answers: prefilledAnswers
        });
      } else {
        // No existing questionnaire, use empty default values
        reset({
          consultationId: cid,
          answers: sortedQuestions.map(q => ({
            questionId: q.id,
            value: ''
          }))
        });
      }
    }
  }, [sortedQuestions, consultation, cid, reset]);

  const { mutate: submit, isPending: isSubmitting } = useSubmitAnswers();

  const onSubmit = (data: SubmitAnswersRequest) => {
    // Filter out empty answers to avoid sending unnecessary data
    const filteredAnswers = data.answers.filter(answer => 
      answer.value && answer.value.trim() !== ''
    );

    const payload = { 
      consultationId: cid, 
      answers: filteredAnswers
    };
    
    submit(payload, {
      onSuccess: (result) => {
        if (result.success) {
          toast.success('Questionnaire submitted successfully');
          router.push(ROUTES.CONSULTATION_TEST_SELECTION(cid));
        } else {
          toast.error(result.message);
          router.push(ROUTES.ANSWER_QUESTIONNAIRE(cid));
        }
      },
      onError: (error: any) => {
        console.error(error);
        toast.error(error.message || 'Failed to submit answers.');
      }
    });
  };

  const handleSkipQuestionnaire = () => {
    setIsSkipping(true);
    toast.success('Questionnaire skipped. Proceeding to test selection.');
    router.push(ROUTES.CONSULTATION_TEST_SELECTION(cid));
  };

  if (isLoading || isConsultationLoading) {
    return <div className="flex justify-center items-center h-full">Loading questions…</div>;
  }
  
  if (isError) {
    return <div className="flex justify-center items-center h-full text-red-600">Failed to load questions.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Medical Questionnaire</h1>
        <Button
          type="button"
          variant="outline"
          onClick={handleSkipQuestionnaire}
          disabled={isSkipping}
          className="px-4 py-2 text-gray-600 border-gray-300 hover:bg-gray-50"
        >
          {isSkipping ? 'Skipping...' : 'Skip Questionnaire'}
        </Button>
      </div>
      
      {/* Show indicator if editing existing questionnaire */}
      {consultation?.questionnaire && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-800 text-sm">
            ✏️ You are editing an existing questionnaire submitted on{' '}
            {new Date(consultation.questionnaire.submittedAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Optional notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-yellow-800 text-sm">
          ℹ️ This questionnaire is optional. You can skip it and proceed directly to the test selection if needed.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {sortedQuestions.map((q, idx) => (
          <div key={q.id} className="bg-white p-6 rounded-lg shadow border">
            <Label.Root className="block mb-2 font-semibold text-gray-800">
              {idx + 1}. {q.text}
              <span className="text-gray-500 text-sm font-normal ml-2">(Optional)</span>
            </Label.Root>

            <Controller
              name={`answers.${idx}.value` as const}
              control={control}
              defaultValue=""
              render={({ field }) => {
                switch (q.type) {
                  case AnswerType.SHORT_TEXT:
                    return <Input {...field} placeholder="Your answer (optional)" className="w-full" />;
                  case AnswerType.LONG_TEXT:
                    return <textarea {...field} placeholder="Your detailed answer (optional)" className="w-full min-h-[100px] px-3 py-2 border rounded focus:ring focus:ring-blue-400 resize-vertical" />;
                  case AnswerType.NUMBER:
                    return <Input {...field} type="number" placeholder="Enter a number (optional)" className="w-full" />;
                  case AnswerType.DATE:
                    return <Input {...field} type="date" className="w-full" />;
                  case AnswerType.MULTIPLE_CHOICE:
                    return (
                      <div className="flex flex-col gap-3">
                        {q.options?.map((opt: any, optIndex: number) => (
                          <label key={`${q.id}-${opt.value}-${optIndex}`} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`answers.${idx}.value`}
                              className="h-4 w-4 text-blue-600"
                              value={opt.value}
                              checked={field.value === opt.value}
                              onChange={() => field.onChange(opt.value)}
                            />
                            <span>{opt.value}</span>
                          </label>
                        ))}
                      </div>
                    );
                  case AnswerType.CHECKBOX:
                    return (
                      <div className="flex flex-col gap-3">
                        {q.options?.map((opt: any, optIndex: number) => (
                         <label key={`checkbox-${q.id}-${opt.value}-${optIndex}`} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-blue-600"
                              value={opt.value}
                              checked={field.value?.includes(opt.value) || false}
                              onChange={e => {
                                const currentValues = field.value ? field.value.split(',').filter(v => v.trim() !== '') : [];
                                if (e.target.checked) {
                                  currentValues.push(opt.value);
                                } else {
                                  const index = currentValues.indexOf(opt.value);
                                  if (index > -1) currentValues.splice(index, 1);
                                }
                                field.onChange(currentValues.join(','));
                              }}
                            />
                            <span>{opt.value}</span>
                          </label>
                        ))}
                      </div>
                    );
                  default:
                    return <div className="text-red-500">Unsupported question type.</div>;
                }
              }}
            />
          </div>
        ))}

        <div className="flex justify-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleSkipQuestionnaire}
            disabled={isSkipping || isSubmitting}
            className="px-6 py-2 text-gray-600 border-gray-300 hover:bg-gray-50"
          >
            {isSkipping ? 'Skipping...' : 'Skip Questionnaire'}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isSkipping}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded"
          >
            {isSubmitting ? 'Submitting…' : 
             consultation?.questionnaire ? 'Update Answers' : 'Submit Answers'}
          </Button>
        </div>
      </form>
    </div>
  );
}