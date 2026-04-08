import { NextResponse } from 'next/server';

/**
 * @fileOverview Custom IPN Listener for PesaPal.
 * Logs live notifications as requested.
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("LIVE IPN RECEIVED:", body);
    
    // Process payment status here...
    
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("IPN parse error:", error);
    return new Response("OK", { status: 200 }); // Still return 200 to acknowledge
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const data = Object.fromEntries(searchParams.entries());
  console.log("LIVE IPN RECEIVED (GET):", data);
  
  return new Response("OK", { status: 200 });
}
