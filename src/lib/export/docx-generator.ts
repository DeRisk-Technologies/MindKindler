// src/lib/export/docx-generator.ts

import { Document, Packer, Paragraph, TextRun, Header, Footer, AlignmentType } from "docx";
import { saveAs } from "file-saver";
import { Report } from "@/types/schema";

// Helper to fetch branding
async function getTenantBranding(tenantId: string) {
    return {
        logoUrl: "https://via.placeholder.com/150x50.png?text=Leeds+City+Council",
        headerText: "Leeds City Council - SEND Services",
        footerText: "Official Sensitive - Not for distribution",
        primaryColor: "#4f46e5"
    };
}

export const DocxGenerator = {
    generate: async (report: Report, tenantName: string): Promise<Blob> => {
        const branding = await getTenantBranding(report.tenantId);

        // Convert HTML Sections to DOCX Paragraphs (Simplified)
        const contentChildren: Paragraph[] = [];

        // Title
        contentChildren.push(
            new Paragraph({
                text: report.title,
                heading: "Title",
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 }
            })
        );

        // Metadata
        contentChildren.push(
            new Paragraph({
                children: [
                    new TextRun({ text: `Student ID: ${report.studentId}`, bold: true }),
                    new TextRun({ text: `\nDate: ${new Date().toLocaleDateString()}`, break: 1 })
                ],
                spacing: { after: 200 }
            })
        );

        // Sections
        if (report.content && report.content.sections) {
            report.content.sections.forEach((section: any) => {
                contentChildren.push(
                    new Paragraph({
                        text: section.title,
                        heading: "Heading1",
                        spacing: { before: 200, after: 100 }
                    })
                );
                // Strip HTML tags for basic text
                const cleanText = section.content ? section.content.replace(/<[^>]*>?/gm, '') : ''; 
                contentChildren.push(
                    new Paragraph({
                        text: cleanText,
                        spacing: { after: 200 }
                    })
                );
            });
        }

        const doc = new Document({
            sections: [{
                headers: {
                    default: new Header({
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: branding.headerText || tenantName,
                                        bold: true,
                                        color: branding.primaryColor?.replace('#', '') || "000000"
                                    })
                                ],
                                alignment: AlignmentType.RIGHT
                            })
                        ]
                    })
                },
                footers: {
                    default: new Footer({
                        children: [
                            new Paragraph({
                                text: branding.footerText || "MindKindler Generated Report",
                                alignment: AlignmentType.CENTER,
                                style: "Footer"
                            })
                        ]
                    })
                },
                children: contentChildren
            }]
        });

        return await Packer.toBlob(doc);
    },

    save: (blob: Blob, filename: string) => {
        saveAs(blob, filename);
    }
};
