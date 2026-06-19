'use server';

/**
 * Note Embedding Flow - Embeds note content into vector database using Mistral
 * Used for AI to understand learning progress and generate contextual plans
 */

import { embedTexts, chunkText } from '@/lib/mistral';
import { prisma } from '@/lib/prisma';

/**
 * Embed a note's content and store in NoteEmbedding table.
 * Chunks the text and creates separate embeddings for each chunk.
 */
export async function embedNote(noteId: string): Promise<void> {
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: { id: true, plainText: true, title: true },
  });

  if (!note || !note.plainText) return;

  const fullText = `${note.title}\n\n${note.plainText}`;
  const chunks = chunkText(fullText, 500);

  if (chunks.length === 0) return;

  // Delete old embeddings
  await prisma.noteEmbedding.deleteMany({
    where: { noteId },
  });

  // Get embeddings from Mistral
  const embeddings = await embedTexts(chunks);

  // Store embeddings using raw SQL for pgvector
  for (let i = 0; i < chunks.length; i++) {
    const vectorStr = `[${embeddings[i].join(',')}]`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO "NoteEmbedding" (id, "noteId", "chunkIndex", "chunkText", embedding, "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4::vector, NOW())
       ON CONFLICT ("noteId", "chunkIndex")
       DO UPDATE SET "chunkText" = $3, embedding = $4::vector`,
      noteId,
      i,
      chunks[i],
      vectorStr
    );
  }
}

/**
 * Search notes by semantic similarity.
 * Returns the most relevant note chunks for a given query.
 */
export async function searchNotesBySimilarity(
  userId: string,
  query: string,
  limit: number = 10
): Promise<{ noteId: string; chunkText: string; similarity: number }[]> {
  const [queryEmbedding] = await embedTexts([query]);
  const vectorStr = `[${queryEmbedding.join(',')}]`;

  const results = await prisma.$queryRawUnsafe<
    { noteId: string; chunkText: string; similarity: number }[]
  >(
    `SELECT ne."noteId", ne."chunkText",
            1 - (ne.embedding <=> $1::vector) as similarity
     FROM "NoteEmbedding" ne
     JOIN "Note" n ON n.id = ne."noteId"
     WHERE n."userId" = $2
       AND ne.embedding IS NOT NULL
     ORDER BY ne.embedding <=> $1::vector
     LIMIT $3`,
    vectorStr,
    userId,
    limit
  );

  return results;
}

/**
 * Get learning progress summary from notes for AI context.
 */
export async function getNotesLearningContext(userId: string, topic?: string): Promise<string> {
  const queryText = topic || 'learning progress summary';
  
  try {
    const results = await searchNotesBySimilarity(userId, queryText, 15);
    
    if (results.length === 0) {
      return 'Chưa có dữ liệu ghi chú để phân tích.';
    }

    return results
      .filter(r => r.similarity > 0.3)
      .map(r => r.chunkText)
      .join('\n---\n');
  } catch {
    // Fallback: if vector search fails, use plain text search
    const notes = await prisma.note.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 10,
      select: { plainText: true, title: true },
    });

    return notes
      .map(n => `${n.title}: ${(n.plainText || '').slice(0, 300)}`)
      .join('\n');
  }
}
