// src/components/training/QuizRunner.tsx

"use client";

import React, { useState } from 'react';
import { TrainingLesson, TrainingQuizQuestion } from '@/types/schema';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Trophy, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizRunnerProps {
    lesson: TrainingLesson;
    onComplete: (score: number, passed: boolean) => void;
}

export function QuizRunner({ lesson, onComplete }: QuizRunnerProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    const questions = lesson.questions || [];
    const currentQ = questions[currentQuestionIndex];

    const handleSelect = (idx: number) => {
        if (isSubmitted) return;
        setAnswers(prev => ({ ...prev, [currentQ.id]: idx }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = () => {
        let correctCount = 0;
        questions.forEach(q => {
            if (answers[q.id] === q.correctIndex) correctCount++;
        });

        const finalScore = Math.round((correctCount / questions.length) * 100);
        setScore(finalScore);
        setIsSubmitted(true);
        const passed = finalScore >= 80;

        if (passed) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }

        // Notify parent after delay to show result first
        setTimeout(() => {
            onComplete(finalScore, passed);
        }, 2000);
    };

    if (questions.length === 0) {
        return <div className="text-center p-4">No questions in this quiz.</div>;
    }

    if (isSubmitted) {
        return (
            <Card className="text-center py-8">
                <CardContent className="flex flex-col items-center gap-4">
                    {score >= 80 ? (
                        <>
                            <Trophy className="h-16 w-16 text-yellow-500 animate-bounce" />
                            <h2 className="text-2xl font-bold text-green-700">Quiz Passed!</h2>
                            <p className="text-lg">You scored {score}%</p>
                        </>
                    ) : (
                        <>
                            <XCircle className="h-16 w-16 text-red-500" />
                            <h2 className="text-2xl font-bold text-red-700">Try Again</h2>
                            <p className="text-lg">You scored {score}%. Needed 80% to pass.</p>
                            <Button onClick={() => {
                                setIsSubmitted(false);
                                setCurrentQuestionIndex(0);
                                setAnswers({});
                            }} variant="outline" className="mt-4">
                                <RotateCcw className="mr-2 h-4 w-4"/> Retake Quiz
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="max-w-2xl mx-auto mt-4">
            <CardHeader>
                <CardTitle className="flex justify-between text-sm uppercase text-muted-foreground">
                    <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                    <span>Quiz Mode</span>
                </CardTitle>
                <h3 className="text-lg font-semibold mt-2">{currentQ.text}</h3>
            </CardHeader>
            <CardContent>
                <RadioGroup 
                    value={answers[currentQ.id]?.toString()} 
                    onValueChange={(val) => handleSelect(parseInt(val))}
                    className="space-y-3"
                >
                    {currentQ.options.map((opt, idx) => (
                        <div key={idx} className={`flex items-center space-x-2 border p-3 rounded-md hover:bg-slate-50 cursor-pointer ${answers[currentQ.id] === idx ? 'border-indigo-500 bg-indigo-50' : ''}`}>
                            <RadioGroupItem value={idx.toString()} id={`opt-${idx}`} />
                            <Label htmlFor={`opt-${idx}`} className="flex-1 cursor-pointer">{opt}</Label>
                        </div>
                    ))}
                </RadioGroup>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button onClick={handleNext} disabled={answers[currentQ.id] === undefined}>
                    {currentQuestionIndex === questions.length - 1 ? 'Submit Answers' : 'Next Question'}
                </Button>
            </CardFooter>
        </Card>
    );
}
