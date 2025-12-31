// src/integrations/documentAI/categories.ts

export const DOCUMENT_CATEGORIES = [
    { id: 'results', label: 'Exam/Test Results' },
    { id: 'attendance', label: 'Attendance Register' },
    { id: 'roster', label: 'Student Roster' },
    { id: 'timetable', label: 'Timetable' },
    { id: 'lessonPlan', label: 'Lesson Plan' },
    { id: 'behavior', label: 'Behaviour Log' },
    { id: 'safeguarding', label: 'Safeguarding Report' },
    { id: 'policy', label: 'Policy/Rulebook' },
    { id: 'training', label: 'Training Record' },
];

export type DocCategory = 'results' | 'attendance' | 'roster' | 'timetable' | 'lessonPlan' | 'behavior' | 'safeguarding' | 'policy' | 'training';
