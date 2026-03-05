'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGetAllQuestions } from '@/hooks/questionnaire/use-get-questions';
import useSubmitAnswers from '@/hooks/questionnaire/use-answer-questions';
import { SubmitAnswersRequest } from '@/models/questionnaire.model';
import { AnswerType } from '@/models/enums';
import { useForm, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ROUTES } from '@/lib/routes';
import { useGetConsultation } from '@/hooks/consultation/use-get-consultation';
import { ConsultationModelData } from '@/models/consultation.model';

interface QuestionnaireAnswer {
  questionId: string;
  value?: string;
  selectedOptions?: Array<{ option: { value: string } }>;
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

  const consultation = consultationData?.data as ConsultationModelData | undefined;

  useEffect(() => {
    if (sortedQuestions.length > 0) {
      const hasExistingQuestionnaire = consultation?.questionnaire;
      if (hasExistingQuestionnaire) {
        const existingAnswers = consultation?.questionnaire?.answers as QuestionnaireAnswer[];
        const prefilledAnswers = sortedQuestions.map(q => {
          const existingAnswer = existingAnswers?.find(a => a.questionId === q.id);
          if (existingAnswer) {
            if (q.type === AnswerType.CHECKBOX) {
              return { questionId: q.id, value: existingAnswer.selectedOptions?.map(opt => opt.option.value).join(',') || '' };
            } else if (q.type === AnswerType.MULTIPLE_CHOICE) {
              return { questionId: q.id, value: existingAnswer.selectedOptions?.[0]?.option?.value || '' };
            } else {
              return { questionId: q.id, value: existingAnswer.value || '' };
            }
          }
          return { questionId: q.id, value: '' };
        });
        reset({ consultationId: cid, answers: prefilledAnswers });
      } else {
        reset({ consultationId: cid, answers: sortedQuestions.map(q => ({ questionId: q.id, value: '' })) });
      }
    }
  }, [sortedQuestions, consultation, cid, reset]);

  const { mutate: submit, isPending: isSubmitting } = useSubmitAnswers();

  const onSubmit = (data: SubmitAnswersRequest) => {
    const filteredAnswers = data.answers.filter(a => a.value && a.value.trim() !== '');
    submit({ consultationId: cid, answers: filteredAnswers }, {
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
    return (
      <div className="flex justify-center items-center h-full">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="animate-spin h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading questions…
        </div>
      </div>
    );
  }

  if (isError) {
    return <div className="flex justify-center items-center h-full text-red-600">Failed to load questions.</div>;
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-5">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Medical Questionnaire</h1>
          <button
            type="button"
            onClick={handleSkipQuestionnaire}
            disabled={isSkipping}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isSkipping ? 'Skipping...' : 'Skip Questionnaire'}
          </button>
        </div>

        {/* Editing banner */}
        {consultation?.questionnaire && (
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <span className="text-base mt-0.5">✏️</span>
            <p className="text-sm text-blue-800">
              You are editing an existing questionnaire submitted on{' '}
              <span className="font-semibold">
                {new Date(consultation.questionnaire.submittedAt).toLocaleDateString('en-GB').replace(/\//g, '/')}
              </span>
            </p>
          </div>
        )}

        {/* Optional notice */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <span className="text-base mt-0.5">ℹ️</span>
          <p className="text-sm text-amber-800">
            This questionnaire is optional. You can skip it and proceed directly to the test selection if needed.
          </p>
        </div>

        {/* Questions */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {sortedQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5"
            >
              <p className="font-semibold text-gray-800 mb-4">
                {idx + 1}. {q.text}
                <span className="ml-2 text-sm font-normal text-gray-400">(Optional)</span>
              </p>

              <Controller
                name={`answers.${idx}.value` as const}
                control={control}
                defaultValue=""
                render={({ field }) => {
                  switch (q.type) {
                    case AnswerType.SHORT_TEXT:
                      return (
                        <input
                          {...field}
                          placeholder="Your answer..."
                          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent bg-gray-50 placeholder-gray-400 transition"
                        />
                      );
                    case AnswerType.LONG_TEXT:
                      return (
                        <textarea
                          {...field}
                          placeholder="Your detailed answer..."
                          className="w-full min-h-[100px] px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent bg-gray-50 placeholder-gray-400 resize-vertical transition"
                        />
                      );
                    case AnswerType.NUMBER:
                      return (
                        <input
                          {...field}
                          type="number"
                          placeholder="Enter a number..."
                          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent bg-gray-50 placeholder-gray-400 transition"
                        />
                      );
                    case AnswerType.DATE:
                      return (
                        <input
                          {...field}
                          type="date"
                          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent bg-gray-50 transition"
                        />
                      );
                    case AnswerType.MULTIPLE_CHOICE:
                      return (
                        <div className="flex flex-col gap-2.5">
                          {q.options?.map((opt: any, optIndex: number) => (
                            <label
                              key={`${q.id}-${opt.value}-${optIndex}`}
                              className="flex items-center gap-3 cursor-pointer group"
                            >
                              <div className="relative flex items-center justify-center">
                                <input
                                  type="radio"
                                  name={`answers.${idx}.value`}
                                  value={opt.value}
                                  checked={field.value === opt.value}
                                  onChange={() => field.onChange(opt.value)}
                                  className="sr-only"
                                />
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                                  field.value === opt.value
                                    ? 'border-green-500 bg-green-500'
                                    : 'border-gray-300 bg-white group-hover:border-green-400'
                                }`}>
                                  {field.value === opt.value && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  )}
                                </div>
                              </div>
                              <span className={`text-sm transition-colors ${
                                field.value === opt.value ? 'text-gray-900 font-medium' : 'text-gray-600'
                              }`}>
                                {opt.value}
                              </span>
                            </label>
                          ))}
                        </div>
                      );
                    case AnswerType.CHECKBOX:
                      return (
                        <div className="flex flex-col gap-2.5">
                          {q.options?.map((opt: any, optIndex: number) => {
                            const isChecked = field.value?.includes(opt.value) || false;
                            return (
                              <label
                                key={`checkbox-${q.id}-${opt.value}-${optIndex}`}
                                className="flex items-center gap-3 cursor-pointer group"
                              >
                                <div className="relative flex items-center justify-center">
                                  <input
                                    type="checkbox"
                                    value={opt.value}
                                    checked={isChecked}
                                    onChange={e => {
                                      const current = field.value ? field.value.split(',').filter(v => v.trim() !== '') : [];
                                      if (e.target.checked) {
                                        current.push(opt.value);
                                      } else {
                                        const i = current.indexOf(opt.value);
                                        if (i > -1) current.splice(i, 1);
                                      }
                                      field.onChange(current.join(','));
                                    }}
                                    className="sr-only"
                                  />
                                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                    isChecked
                                      ? 'border-green-500 bg-green-500'
                                      : 'border-gray-300 bg-white group-hover:border-green-400'
                                  }`}>
                                    {isChecked && (
                                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    )}
                                  </div>
                                </div>
                                <span className={`text-sm transition-colors ${isChecked ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                                  {opt.value}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      );
                    default:
                      return <div className="text-sm text-red-500">Unsupported question type.</div>;
                  }
                }}
              />
            </div>
          ))}

          {/* Submit */}
          <div className="flex justify-center gap-3 pt-2 pb-6">
            <button
              type="button"
              onClick={handleSkipQuestionnaire}
              disabled={isSkipping || isSubmitting}
              className="px-6 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isSkipping ? 'Skipping...' : 'Skip Questionnaire'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isSkipping}
              className="px-6 py-2.5 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? 'Submitting…'
                : consultation?.questionnaire
                ? 'Update Answers'
                : 'Submit Answers'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}