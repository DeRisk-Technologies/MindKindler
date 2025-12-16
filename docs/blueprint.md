# **App Name**: MindKindler

## Core Features:

- User Authentication and Role Management: Secure user authentication with role-based access control (RBAC) for Admins, Educational Psychologists, Teachers, Parents, Students, and other roles. Configure signup flows specific to each role. Note: currently only Google Fonts are supported.
- Case Management: Enable Educational Psychologists and teachers to add students, open new cases, enter notes, and attach relevant documents.
- Digital Assessment Tools: Implement React forms to allow for the distribution of common screening tools and auto-scoring of results with risk levels shown. When using AI the LLM will incorporate external information, so we classify it as a tool.
- AI-Assisted Report Generation: Use a Cloud Function with Gemini API via Firebase AI Logic to generate draft reports based on assessment data and notes; allow EPPs to edit and approve the reports. When using AI the LLM will incorporate external information, so we classify it as a tool.
- Progress Tracking & Dashboards: Create dashboards to display charts that present children's academic, behavioral and social goals and display key insights.
- Mobile & Offline Support: Ensure accessibility on mobile devices via a Progressive Web App (PWA) with offline data caching.
- In-App Messaging & Notifications: In-app messaging between users and push notifications about new messages.

## Style Guidelines:

- Primary color: Gentle blue (#A0CFEC) to evoke trust and calmness, essential for an educational platform. This hue aims to be professional and inviting without being overly stimulating for children.
- Background color: Very light, desaturated blue (#F0F8FF) that is gentle and unobtrusive.
- Accent color: Muted yellow (#E8D579) for highlighting key interactive elements and CTAs. This color enhances usability without causing distraction.
- Headline font: 'Belleza' (sans-serif) for headings; body font: 'Alegreya' (serif) for body; creates a warm, unique style, ideal for readability.
- Use consistent, clear icons throughout the platform to aid navigation and understanding, ensure they are accessible and distinct.
- A clean, responsive layout that adapts to different screen sizes and devices, with a focus on mobile-first design.
- Subtle transitions and animations to enhance user experience, such as loading screens and interactive feedback on button presses.