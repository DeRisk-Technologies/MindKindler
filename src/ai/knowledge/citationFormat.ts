export function formatCitation(docTitle: string, snippet: string, year?: string) {
    return `${docTitle} ${year ? `(${year})` : ''}: "${snippet.substring(0, 100)}..."`;
}
