'use client';

import React, { useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGetAllQuestions } from '@/hooks/questionnaire/use-get-questions';
import useSubmitAnswers from '@/hooks/questionnaire/use-answer-questions';
import { SubmitAnswersModel, AnswerType } from '@/models/questionnaire.model';
import { useForm, Controller } from 'react-hook-form';
import * as Label from '@radix-ui/react-label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ROUTES } from '@/lib/routes'
import { useGetConsultation } from '@/hooks/consultation/use-get-consultation';


export default function QuestionnairePage() {
  const { consultationId } = useParams();
  const cid = consultationId ?? '';
  const router = useRouter();

  const { data: resp, isLoading, isError } = useGetAllQuestions();
  const { data: consultationData, isLoading: isConsultationLoading } = useGetConsultation(cid); // Add this
  const questions = resp?.data ?? [];



  const sortedQuestions = useMemo(
    () => [...questions].sort((a, b) => a.order - b.order),
    [questions]
  );

  const { control, handleSubmit, reset } = useForm<SubmitAnswersModel>({
    defaultValues: { consultationId: cid, answers: [] }
  });

  useEffect(() => {
    if (sortedQuestions.length > 0) {
      const hasExistingQuestionnaire = consultationData?.data?.questionnaire;
      
      if (hasExistingQuestionnaire) {
        // Prefill with existing answers
        const existingAnswers = consultationData?.data?.questionnaire?.answers;
        const prefilledAnswers = sortedQuestions.map(q => {
          const existingAnswer = existingAnswers.find(answer => answer.questionId === q.id);
          
          if (existingAnswer) {
            if (q.type === AnswerType.CHECKBOX) {
              // For checkbox, use selectedOptions array
              return {
                questionId: q.id,
                value: existingAnswer.selectedOptions?.map(opt => opt.option.value) || []
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
            value: q.type === AnswerType.CHECKBOX ? [] : ''
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
            value: q.type === AnswerType.CHECKBOX ? [] : ''
          }))
        });
      }
    }
  }, [sortedQuestions, consultationData, cid, reset]);

  const { mutate: submit, isLoading: isSubmitting } = useSubmitAnswers();

  const onSubmit = (data: SubmitAnswersModel) => {
    const transformedAnswers = data.answers.map((answer) => {
      const question = sortedQuestions.find(q => q.id === answer.questionId);
      
      if (question?.type === AnswerType.MULTIPLE_CHOICE) {
        return {
          questionId: answer.questionId,
          selectedOptions: [answer.value] 
        };
      } else if (question?.type === AnswerType.CHECKBOX) {
        return {
          questionId: answer.questionId,
          selectedOptions: Array.isArray(answer.value) ? answer.value : []
        };
      } else {
        return {
          questionId: answer.questionId,
          value: answer.value
        };
      }
    });

    const payload = { 
      consultationId: cid, 
      answers: transformedAnswers
    };
    
    submit(payload, {
      onSuccess: (result) => {
        if (result.success) {
          toast.success('Patient updated successfully');
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

  if (isLoading || isConsultationLoading) {
    return <div className="flex justify-center items-center h-full">Loading questions…</div>;
  }
  
  if (isError) {
    return <div className="flex justify-center items-center h-full text-red-600">Failed to load questions.</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Medical Questionnaire</h1>
      
      {/* Show indicator if editing existing questionnaire */}
      {consultationData?.data?.questionnaire && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-800 text-sm">
            ✏️ You are editing an existing questionnaire submitted on{' '}
            {new Date(consultationData.data.questionnaire.submittedAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {sortedQuestions.map((q, idx) => (
        <div key={q.id} className="bg-white p-6 rounded-lg shadow border">
          <Label.Root className="block mb-2 font-semibold text-gray-800">
            {q.order}. {q.text}
          </Label.Root>

          <Controller
            name={`answers.${idx}.value` as const}
            control={control}
            defaultValue={q.type === AnswerType.CHECKBOX ? [] : ''}
            rules={{ required: true }}
            render={({ field }) => {
              switch (q.type) {
                case AnswerType.SHORT_TEXT:
                  return <Input {...field} placeholder="Your answer" className="w-full" />;
                case AnswerType.LONG_TEXT:
                  return <textarea {...field} placeholder="Your detailed answer" className="w-full min-h-[100px] px-3 py-2 border rounded focus:ring focus:ring-blue-400 resize-vertical" />;
                case AnswerType.NUMBER:
                  return <Input {...field} type="number" placeholder="Enter a number" className="w-full" />;
                case AnswerType.DATE:
                  return <Input {...field} type="date" className="w-full" />;
                case AnswerType.MULTIPLE_CHOICE:
                  return (
                    <div className="flex flex-col gap-3">
                      {q.options?.map(opt => (
                        <label key={opt.id} className="flex items-center gap-2">
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
                      {q.options?.map(opt => (
                       <label key={`checkbox-${q.id}-${opt.id}`} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600"
                            value={opt.value}
                            checked={Array.isArray(field.value) && field.value.includes(opt.value)}
                            onChange={e => {
                              const newVal = Array.isArray(field.value) ? [...field.value] : [];
                              if (e.target.checked) newVal.push(opt.value);
                              else {
                                const i = newVal.indexOf(opt.value);
                                if (i > -1) newVal.splice(i, 1);
                              }
                              field.onChange(newVal as any);
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

      <div className="flex justify-center">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded"
        >
          {isSubmitting ? 'Submitting…' : 
           consultationData?.data?.questionnaire ? 'Update Answers' : 'Submit Answers'}
        </Button>
      </div>
    </form>
  );
}