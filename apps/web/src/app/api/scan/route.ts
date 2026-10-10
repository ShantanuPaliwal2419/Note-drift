import { NextResponse } from 'next/server';
import { processMarkdownScan } from '@/lib/scan';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const markdown = body.markdown;

    if (typeof markdown !== 'string') {
      return NextResponse.json(
        { error: 'Invalid payload: "markdown" string required' },
        { status: 400 }
      );
    }

    const forceLive = body.live === true;
    const result = await processMarkdownScan(markdown, forceLive);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? 'Internal scanning error' },
      { status: 500 }
    );
  }
}
