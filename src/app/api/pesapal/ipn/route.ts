import { NextResponse } from 'next/server';

/**
 * @fileOverview Optional IPN Listener under the /pesapal/ nested path.
 * Path: /api/pesapal/ipn
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("NESTED IPN RECEIVED (POST):", body);
    return new Response("OK", { status: 200 });
  } catch (error) {
    return new Response("OK", { status: 200 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const data = Object.fromEntries(searchParams.entries());
  console.log("NESTED IPN RECEIVED (GET):", data);

  return NextResponse.json({ status: 200, message: "OK" });
}
