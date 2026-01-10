// src/lib/export/docx-generator.ts
import { Report } from "@/types/schema";
import { saveAs } from 'file-saver';
// We use a dynamic import for html-to-docx in the client-side function to avoid SSR issues if used directly
// or use a compatible client-side library. 
// Note: html-to-docx is Node.js primarily. For Client Side, 'docx' library is better.
// Switching strategy to 'docx' library for robust client-side generation without server roundtrip if possible.
// However, since prompt asked for html-to-docx (which often requires Node buffer), let's use a server action or cloud function approach
// OR use 'docx' + 'html-to-docx' if running in browser with polyfills.

// SIMPLER STRATEGY for Reliability:
// We will generate a basic HTML blob and convert it, OR use the 'docx' library to build it programmatically from the sections.
// Building programmatically is cleaner for "Statutory Style" than converting messy HTML.

import { Document, Packer, Paragraph, TextRun, HeadingLevel, Header, Footer, AlignmentType, ImageRun } from "docx";

export const DocxGenerator = {
    async generate(report: Report, tenantName: string = "MindKindler Practice"): Promise<Blob> {
        
        // 1. Build Header
        const header = new Header({
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "CONFIDENTIAL - STATUTORY ADVICE",
                            bold: true,
                            color: "FF0000",
                            size: 24, // 12pt
                        }),
                    ],
                    alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Practice: ${tenantName}`,
                            italics: true,
                            size: 20, // 10pt
                        }),
                    ],
                    alignment: AlignmentType.CENTER,
                }),
            ],
        });

        // 2. Build Footer (Page Numbers)
        const footer = new Footer({
            children: [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: "Page ",
                            size: 20,
                        }),
                        new TextRun({
                            children: ["PAGE_NUMBER"], // Auto page number
                            fieldInstruction: "PAGE",
                        }),
                        new TextRun({
                            text: " of ",
                            size: 20,
                        }),
                        new TextRun({
                            children: ["NUMPAGES"],
                            fieldInstruction: "NUMPAGES",
                        }),
                    ],
                }),
            ],
        });

        // 3. Build Content Sections
        const docSections = report.content.sections.map(section => {
            // Strip HTML tags for clean Docx (Basic text extraction)
            // In a full prod version, we would parse HTML to Docx nodes.
            const cleanContent = section.content.replace(/<[^>]*>?/gm, ''); 

            return [
                new Paragraph({
                    text: section.title,
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 400, after: 200 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: cleanContent,
                            size: 24, // 12pt Arial Equivalent
                            font: "Arial",
                        }),
                    ],
                    spacing: { line: 360 }, // 1.5 spacing
                })
            ];
        }).flat();

        // 4. Construct Document
        const doc = new Document({
            sections: [
                {
                    properties: {},
                    headers: { default: header },
                    footers: { default: footer },
                    children: [
                        new Paragraph({
                            text: report.title,
                            heading: HeadingLevel.HEADING_1,
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 400 },
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: "Student Name: ", bold: true }),
                                new TextRun({ text: report.studentId || "Unknown" }), // Replace with actual name if available in Report object
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: "Date of Report: ", bold: true }),
                                new TextRun({ text: new Date().toLocaleDateString() }),
                            ],
                            spacing: { after: 400 },
                        }),
                        ...docSections
                    ],
                },
            ],
        });

        // 5. Pack & Return Blob
        return await Packer.toBlob(doc);
    },

    save(blob: Blob, filename: string) {
        saveAs(blob, filename);
    }
};
