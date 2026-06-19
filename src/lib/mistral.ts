/**
 * Mistral AI Client for Deep Workspace
 * Server-only module - imported by API routes and AI flows
 * - Text embedding (mistral-embed) for note vector search
 * - Chat completion for plan generation & refinement
 */

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY!;
const MISTRAL_BASE_URL = 'https://api.mistral.ai/v1';

// ============ EMBEDDING ============

export async function embedText(text: string): Promise<number[]> {
  const res = await fetch(`${MISTRAL_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'mistral-embed',
      input: [text],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Mistral embed error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data.data[0].embedding as number[];
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const res = await fetch(`${MISTRAL_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'mistral-embed',
      input: texts,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Mistral embed error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data.data.map((d: { embedding: number[] }) => d.embedding);
}

// ============ CHAT COMPLETION ============

export type MistralMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export async function chatCompletion(
  messages: MistralMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: { type: 'json_object' };
  }
): Promise<string> {
  const res = await fetch(`${MISTRAL_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: options?.model || 'mistral-large-latest',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
      ...(options?.responseFormat ? { response_format: options.responseFormat } : {}),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Mistral chat error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

// ============ TEXT CHUNKING ============

export function chunkText(text: string, maxChunkSize: number = 500): string[] {
  if (!text || text.trim().length === 0) return [];

  const sentences = text.split(/(?<=[.!?。\n])\s+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + ' ' + sentence).trim().length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// ============ COSINE SIMILARITY (for JSON-based fallback) ============

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}
