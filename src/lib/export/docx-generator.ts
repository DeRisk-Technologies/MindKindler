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

// --- HTML Parsing Helpers ---

function parseInline(text: string): TextRun[] {
    const runs: TextRun[] = [];
    // Regex for bold
    const parts = text.split(/(<(?:b|strong)>.*?<\/(?:b|strong)>)/gi);
    
    parts.forEach(part => {
        if (!part) return;
        if (part.match(/<(?:b|strong)>/i)) {
            // Bold
            const clean = part.replace(/<\/?(?:b|strong)>/gi, '').replace(/<[^>]+>/g, '');
            runs.push(new TextRun({ text: clean, bold: true }));
        } else {
            // Check for italic inside non-bold parts
            const italicParts = part.split(/(<(?:i|em)>.*?<\/(?:i|em)>)/gi);
            italicParts.forEach(iPart => {
                if (!iPart) return;
                if (iPart.match(/<(?:i|em)>/i)) {
                    const clean = iPart.replace(/<\/?(?:i|em)>/gi, '').replace(/<[^>]+>/g, '');
                    runs.push(new TextRun({ text: clean, italics: true }));
                } else {
                    // Plain (strip any other tags like spans/br)
                    // Replace <br> with \n if needed, but TextRun doesn't support \n easily without break:1
                    // For now, simple strip
                    const clean = iPart.replace(/<[^>]+>/g, '');
                    if (clean) runs.push(new TextRun({ text: clean }));
                }
            });
        }
    });
    return runs;
}

function parseHtmlToParagraphs(html: string): Paragraph[] {
    if (!html) return [];
    
    // Normalize newlines to avoid regex issues
    const raw = html.replace(/\n/g, ' ');
    
    // Regex to match block tags: p, h1-h6, li
    const blockRegex = /<(p|h[1-6]|li|blockquote)[^>]*>(.*?)<\/\1>/gi;
    const paras: Paragraph[] = [];
    
    let match;
    let found = false;
    
    while ((match = blockRegex.exec(raw)) !== null) {
        found = true;
        const tag = match[1].toLowerCase();
        let content = match[2];
        
        const children = parseInline(content);
        const options: any = { children };
        
        if (tag.startsWith('h')) {
            // Map h1->Heading1, etc.
            // docx supports "Heading1", "Heading2"...
            options.heading = `Heading${tag.replace('h','')}`;
            options.spacing = { before: 200, after: 100 };
        }
        else if (tag === 'li') {
            options.bullet = { level: 0 };
        }
        else if (tag === 'blockquote') {
             options.indent = { left: 720 }; 
             options.style = "Quote"; // Might require defined style, fallback to indentation
        }
        else {
            // Paragraph
            options.spacing = { after: 120 };
        }
        
        paras.push(new Paragraph(options));
    }
    
    // Fallback: If no block tags found (e.g. plain text or just one chunk), treat as one paragraph
    if (!found) {
        paras.push(new Paragraph({ children: parseInline(html) }));
    }
    
    return paras;
}

export const DocxGenerator = {
    generate: async (report: Report, tenantName: string): Promise<Blob> => {
        const branding = await getTenantBranding(report.tenantId);

        // Convert HTML Sections to DOCX Paragraphs
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
                // Section Title
                contentChildren.push(
                    new Paragraph({
                        text: section.title,
                        heading: "Heading1",
                        spacing: { before: 300, after: 100 },
                        border: { bottom: { color: "auto", space: 1, value: "single", size: 6 } }
                    })
                );
                
                // Section Content (Rich Text)
                const parsedParas = parseHtmlToParagraphs(section.content || "");
                contentChildren.push(...parsedParas);
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
