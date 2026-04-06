import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    const vocab = await prisma.vocab.create({
      data: {
        word: data.word,
        image: data.image,
        grammar: data.grammar,
        pronunciation: data.pronunciation,
        category: data.category,
        notes: data.notes,
        userId: session.user.id,
      }
    });

    return NextResponse.json(vocab, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create vocabulary' }, { status: 500 });
  }
}
