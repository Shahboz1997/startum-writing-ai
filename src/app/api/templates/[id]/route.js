import { NextResponse } from 'next/server';
import * as bank from '../../../../lib/bankCore.js';

/**
 * GET /api/templates/:id
 */
export async function GET(request, context) {
  try {
    const params = await context.params;
    const id = params?.id;
    const row = bank.getTemplateById(id);
    if (!row) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    return NextResponse.json({ data: row });
  } catch (e) {
    console.error('[api/templates/[id]]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
