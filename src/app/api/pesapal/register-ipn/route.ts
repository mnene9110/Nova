import { NextResponse } from 'next/server';

/**
 * @fileOverview Deprecated IPN Registration for PesaPal.
 */

export async function GET() {
  return NextResponse.json({ error: "Endpoint Deprecated" }, { status: 410 });
}
