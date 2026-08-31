import {PayBridgeNP} from '@paybridge-np/sdk';
import {NextResponse} from 'next/server';
import {db} from '@/db';
import {donations} from '@/db/schema';
import {eq} from 'drizzle-orm';

type PayBridgeEvent = {
  id?: string;
  type?: string;
  created?: number;
  livemode?: boolean;
  data?: {
    id?: string;
    amount?: number;
    currency?: string;
    provider?: string;
    provider_ref?: string;
    session_id?: string;
    metadata?: Record<string, string>;
  };
};

async function updateDonationFromEvent(event: PayBridgeEvent, status: string) {
  const donationId = event.data?.metadata?.donationId;
  if (!donationId) {
    console.warn('PayBridgeNP event has no donation reference:', event.id);
    return;
  }

  const updated = await db.update(donations)
      .set({
        status: status as 'pending' | 'confirmed',
        paymentMethod: event.data?.provider || null,
        transactionId: event.data?.provider_ref || event.data?.id || null,
        updatedAt: new Date(),
      })
      .where(eq(donations.referenceId, donationId))
      .returning({referenceId: donations.referenceId});

  if (!updated.length) {
    throw new Error(`No donation found for PayBridge reference ${donationId}.`);
  }
}

export async function GET() {
  const secret = process.env.PAYBRIDGENP_WEBHOOK_SECRET;
  console.log('📋 Webhook Endpoint Status:', {
    secretLoaded: !!secret,
    secretLength: secret?.length,
    timestamp: new Date().toISOString(),
  });
  return NextResponse.json({
    status: 'webhook-endpoint-active',
    secretConfigured: !!secret,
  });
}

export async function POST(request: Request) {
  const secret =
    process.env.PAYBRIDGENP_WEBHOOK_SECRET ||
    process.env.PAYBRIDGE_WEBHOOK_SECRET;
  const signature =
    request.headers.get('x-paybridgenp-signature') ||
    request.headers.get('x-paybridge-signature');

  console.log('🔍 Webhook Debug:', {
    hasSecret: !!secret,
    hasSignature: !!signature,
    secretLength: secret?.length,
    signatureLength: signature?.length,
    secretPrefix: secret?.substring(0, 15),
    signaturePrefix: signature?.substring(0, 15),
  });

  if (!secret || !signature) {
    console.error('❌ Missing secret or signature');
    return NextResponse.json(
        {received: false, message: 'Webhook verification is not configured.'},
        {status: 400},
    );
  }

  const body = await request.text();
  console.log('📦 Webhook Body:', body);
  console.log('📝 Signature header value:', signature);
  console.log('🔑 Secret (first 20 chars):', secret.substring(0, 20));

  let event: PayBridgeEvent;
  try {
    event = await PayBridgeNP.webhooks.constructEvent(
        body,
        signature,
        secret,
    ) as PayBridgeEvent;
    console.log('✅ Webhook Verified:', {type: event.type, livemode: event.livemode});
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid webhook.';
    console.error('❌ PayBridgeNP webhook verification failed:', message);
    console.error('Error details:', error);
    return NextResponse.json({received: false, message}, {status: 400});
  }

  if (event.livemode !== true) {
    console.log('⚠️ Test mode event (livemode: false) - ignoring');
    return NextResponse.json({received: true, ignored: true});
  }

  switch (event.type) {
    case 'payment.succeeded':
      await updateDonationFromEvent(event, 'confirmed');
      console.info('PayBridgeNP payment succeeded:', event.data?.id);
      break;
    case 'payment.failed':
      await updateDonationFromEvent(event, 'failed');
      console.info('PayBridgeNP payment failed:', event.data?.id);
      break;
    case 'payment.cancelled':
    case 'payment.refunded':
    case 'payment_link.paid':
      console.info(`PayBridgeNP ${event.type}:`, event.data?.id);
      break;
    default:
      console.info('PayBridgeNP event received:', event.type);
  }

  return NextResponse.json({received: true});
}
