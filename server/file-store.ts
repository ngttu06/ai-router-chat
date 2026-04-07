// In-memory file content store (shared across API routes)
export const fileContents: Map<string, { name: string; content: string; mimeType: string }> = new Map();
