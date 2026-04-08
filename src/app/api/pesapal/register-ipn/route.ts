import { NextResponse } from 'next/server';

/**
 * @fileOverview REGISTER IPN handler for PesaPal V3.
 * Path: /api/pesapal/register-ipn
 * Logic: Fetches token and registers the nova-kx1k.vercel.app listener.
 */

const PESAPAL_URL = 'https://pay.pesapal.com/v3';
const CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;

export async function GET() {
  try {
    if (!CONSUMER_KEY || !CONSUMER_SECRET) {
      return NextResponse.json({ error: "Environment variables missing" }, { status: 500 });
    }

    // 1. Get Auth Token
    const tokenResponse = await fetch(`${PESAPAL_URL}/api/Auth/RequestToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        consumer_key: CONSUMER_KEY,
        consumer_secret: CONSUMER_SECRET,
      }),
      cache: 'no-store',
    });

    const tokenData = await tokenResponse.json();
    const token = tokenData.token;

    if (!token) {
      return NextResponse.json({ error: "Failed to obtain auth token", details: tokenData }, { status: 400 });
    }

    // 2. Register IPN
    const registerResponse = await fetch(`${PESAPAL_URL}/api/URLSetup/RegisterIPN`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        url: "https://nova-kx1k.vercel.app/api/pesapal-ipn",
        ipn_notification_type: "GET",
      }),
      cache: 'no-store',
    });

    const registerData = await registerResponse.json();
    console.log("REGISTER IPN RESPONSE:", registerData);
    
    return NextResponse.json(registerData);
  } catch (error: any) {
    console.error("IPN Registration Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 });
  }
}
