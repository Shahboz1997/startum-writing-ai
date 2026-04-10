import { NextResponse } from 'next/server';
import * as bank from '../../../lib/bankCore.js';

/**
 * GET /api/topics
 * Query: type, subtype, dateFrom, dateTo, q | search
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = Object.fromEntries(searchParams.entries());
    const list = bank.filterTopics(q);
    return NextResponse.json({ data: list, count: list.length });
  } catch (e) {
    console.error('[api/topics]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
