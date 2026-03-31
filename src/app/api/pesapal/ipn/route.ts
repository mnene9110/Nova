
import { NextRequest, NextResponse } from 'next/server';

/**
 * @fileOverview API Route to handle PesaPal IPN (Instant Payment Notification).
 * PesaPal calls this endpoint after a transaction is completed.
 */

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const OrderTrackingId = searchParams.get('OrderTrackingId');
    const OrderMerchantReference = searchParams.get('OrderMerchantReference');
    const OrderNotificationType = searchParams.get('OrderNotificationType');

    console.log('PesaPal IPN Received:', {
      OrderTrackingId,
      OrderMerchantReference,
      OrderNotificationType,
    });

    // In a full production app, you would:
    // 1. Re-authenticate with PesaPal to get a token.
    // 2. Call PesaPal GetTransactionStatus with the OrderTrackingId.
    // 3. Update the user's Firestore coinAccount balance based on the status.

    return NextResponse.json({ 
      status: 200, 
      message: 'Notification received successfully' 
    });
  } catch (error) {
    console.error('IPN Error:', error);
    return NextResponse.json({ status: 500, message: 'Internal Server Error' });
  }
}

export async function GET(req: NextRequest) {
  // PesaPal sometimes sends a GET request to verify the endpoint
  return NextResponse.json({ status: 200, message: 'IPN Endpoint Active' });
}
