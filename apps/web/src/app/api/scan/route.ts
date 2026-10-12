import { NextResponse } from 'next/server';
import { processMarkdownScan } from '@/lib/scan';
import { getVisitorIdentifier, checkVisitorQuota } from '@/lib/quota';
import { getServerEnv } from '@/lib/env';

export async function GET(req: Request) {
  try {
    const env = getServerEnv();
    const { visitorId, isNewCookie } = getVisitorIdentifier(req);
    const quota = checkVisitorQuota(visitorId);

    const res = NextResponse.json({
      liveDemoEnabled: env.liveDemoEnabled,
      hasKeyConfigured: !!env.serpApiKey,
      remainingLiveScans: quota.remaining,
      visitorId,
    });

    if (isNewCookie) {
      res.cookies.set('notedrift_vid', visitorId, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 31536000,
      });
    }

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? 'Failed to retrieve demo status' },
      { status: 500 }
    );
  }
}

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
    const { visitorId, isNewCookie } = getVisitorIdentifier(req);

    const result = await processMarkdownScan(markdown, forceLive, visitorId);

    const res = NextResponse.json(result);

    if (isNewCookie) {
      res.cookies.set('notedrift_vid', visitorId, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 31536000,
      });
    }

    return res;
  } catch (err: any) {
    const message = String(err?.message || 'Internal scanning error');
    let status = 500;

    if (message.includes('limit reached') || message.includes('allowance')) {
      status = 429;
    } else if (message.includes('401') || message.includes('rejected')) {
      status = 401;
    } else if (message.includes('disabled') || message.includes('missing')) {
      status = 400;
    }

    return NextResponse.json({ error: message }, { status });
  }
}
