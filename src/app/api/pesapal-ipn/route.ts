import { NextResponse } from 'next/server';

/**
 * @fileOverview LIVE IPN Listener for PesaPal V3.
 * Path: /api/pesapal-ipn
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("LIVE IPN RECEIVED (POST):", body);
    
    // Logic to handle payment confirmation would go here
    
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("IPN Parse Error:", error);
    // Always return 200 OK to PesaPal to acknowledge receipt, even on parse error
    return new Response("OK", { status: 200 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const data = Object.fromEntries(searchParams.entries());
  console.log("LIVE IPN RECEIVED (GET):", data);

  return new Response("OK", { status: 200 });
}
