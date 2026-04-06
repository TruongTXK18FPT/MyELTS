import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vocabCount = await prisma.vocab.count({
      where: { userId: session.user.id }
    });

    return NextResponse.json({ vocabCount });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
