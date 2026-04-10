import { NextResponse } from 'next/server';
import * as bank from '../../../lib/bankCore.js';

function headersToObject(request) {
  const h = {};
  request.headers.forEach((value, key) => {
    h[key.toLowerCase()] = value;
  });
  return h;
}

/**
 * GET /api/templates — filters: type, subtype, dateFrom, dateTo, q | search
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = Object.fromEntries(searchParams.entries());
    const list = bank.filterTemplates(q);
    return NextResponse.json({ data: list, count: list.length });
  } catch (e) {
    console.error('[api/templates GET]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/templates — admin: header x-bank-admin-key (or dev without key)
 */
export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const result = bank.addTemplate(body, headersToObject(request));
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ data: result.template }, { status: result.status });
  } catch (e) {
    console.error('[api/templates POST]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
