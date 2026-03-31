import { NextResponse } from 'next/server';

/**
 * @fileOverview Deprecated IPN Listener for PesaPal.
 */

export async function POST() {
  return NextResponse.json({ status: 410, message: 'Endpoint Deprecated' });
}

export async function GET() {
  return NextResponse.json({ status: 410, message: 'Endpoint Deprecated' });
}
