import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    app: 'NoteDrift Web API',
    timestamp: new Date().toISOString(),
  });
}
