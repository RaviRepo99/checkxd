import {NextResponse} from 'next/server';
import {PayBridgeNP} from '@paybridge-np/sdk';
import {getSupabaseAdminClient} from '@/lib/supabase-storage';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9+()\-\s]{7,20}$/;
const MIN_DONATION_AMOUNT = 10;

function toPositiveNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function generateReferenceId() {
  const time = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `NFR-${time}-${random}`;
}

function getPayBridgeClient() {
  const apiKey = process.env.PAYBRIDGE_API_KEY;
  if (!apiKey) {
    throw new Error('PAYBRIDGE_API_KEY is not configured.');
  }
  return new PayBridgeNP({apiKey});
}

async function persistDonation(payload: Record<string, unknown>) {
  try {
    const {error} = await getSupabaseAdminClient()
        .from('donations')
        .insert([payload]);
    if (error) throw error;
    return {stored: true, error: null};
  } catch (error) {
    console.error(
        'Donation insert failed:',
        error instanceof Error ? error.message : JSON.stringify(error),
    );
    return {stored: false, error};
  }
}

async function updateDonationStatus(payload: Record<string, unknown>) {
  try {
    const {error} = await getSupabaseAdminClient()
        .from('donations')
        .update({
          payment_method: payload.payment_method,
          transaction_id: payload.transaction_id,
          proof_file_name: payload.proof_file_name,
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('reference_id', payload.reference_id);
    if (error) throw error;
    return {stored: true, error: null};
  } catch (error) {
    console.error(
        'Donation update unavailable:',
        error instanceof Error ? error.message : JSON.stringify(error),
    );
    return {stored: false, error};
  }
}

export async function GET() {
  try {
    const admin = getSupabaseAdminClient();
    const {data: confirmedDonations, error} = await admin
        .from('donations')
        .select('amount')
        .eq('status', 'confirmed');
    if (error) throw error;
    const totalDonations = confirmedDonations.reduce(
        (total, donation) => total + Number(donation.amount || 0),
        0,
    );

    const {data: recentDonors, error: recentError} = await admin
        .from('donations')
        .select('full_name, amount, created_at, email, phone')
        .eq('status', 'confirmed')
        .order('created_at', {ascending: false})
        .limit(10);
    if (recentError) throw recentError;

    return NextResponse.json({
      success: true,
      totalDonations,
      donorCount: confirmedDonations.length,
      recentDonors: recentDonors ?? [],
    });
  } catch (error) {
    console.warn('Unable to load donation statistics:', error);
    return NextResponse.json({
      success: true,
      totalDonations: 0,
      donorCount: 0,
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const step = body?.step ?? 'submit';

    if (step === 'submit') {
      const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : '';
      const email = typeof body?.email === 'string' ? body.email.trim() : '';
      const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
      const address = typeof body?.address === 'string' ? body.address.trim() : '';
      const message = typeof body?.message === 'string' ? body.message.trim() : '';
      const currency = typeof body?.currency === 'string' ? body.currency : 'NPR';
      const amount = toPositiveNumber(body?.amount);
      const termsAccepted = Boolean(body?.termsAccepted);

      if (!fullName) {
        return NextResponse.json({success: false, message: 'Full name is required.'}, {status: 400});
      }
      if (!email || !emailPattern.test(email)) {
        return NextResponse.json({success: false, message: 'Please enter a valid email address.'}, {status: 400});
      }
      if (!phone || !phonePattern.test(phone)) {
        return NextResponse.json({success: false, message: 'Please enter a valid phone number.'}, {status: 400});
      }
      if (!amount || amount <= 0) {
        return NextResponse.json({success: false, message: 'Donation amount must be a valid positive amount.'}, {status: 400});
      }
      if (amount < MIN_DONATION_AMOUNT) {
        return NextResponse.json({success: false, message: 'Minimum donation amount is NPR 10.'}, {status: 400});
      }
      if (!termsAccepted) {
        return NextResponse.json({success: false, message: 'You must agree to the donation terms.'}, {status: 400});
      }

      const donationId = generateReferenceId();
      const donationRecord = {
        referenceId: donationId,
        fullName,
        email,
        phone,
        address,
        message,
        amount,
        currency,
        status: 'pending',
        createdAt: new Date(),
      };

      const persisted = await persistDonation(donationRecord);
      if (!persisted.stored) {
        return NextResponse.json({
          success: false,
          message: 'Unable to save donation details. Please try again.',
        }, {status: 503});
      }
      const payBridge = getPayBridgeClient();
      const origin = new URL(request.url).origin;
      const session = await payBridge.checkout.create({
        amount: Math.round(amount * 100),
        currency: 'NPR',
        returnUrl: `${origin}/donation?payment=success`,
        cancelUrl: `${origin}/donation?payment=cancelled`,
        metadata: {donationId},
        customer: {
          name: fullName,
          email,
          phone,
        },
      });

      return NextResponse.json({
        success: true,
        donationId,
        amount,
        checkoutUrl: session.checkout_url,
        status: 'pending',
        message: 'Donation initialized successfully.',
      });
    }

    if (step === 'payment-confirmation') {
      const donationId = typeof body?.donationId === 'string' ? body.donationId.trim() : '';
      const paymentMethod = typeof body?.paymentMethod === 'string' ? body.paymentMethod : 'esewa';
      const transactionId = typeof body?.transactionId === 'string' ? body.transactionId.trim() : '';
      const proofFileName = typeof body?.proofFileName === 'string' ? body.proofFileName.trim() : '';

      if (!donationId) {
        return NextResponse.json({success: false, message: 'Donation reference is required.'}, {status: 400});
      }

      const payload = {
        reference_id: donationId,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        proof_file_name: proofFileName,
        status: 'confirmed',
      };

      await updateDonationStatus(payload);

      return NextResponse.json({
        success: true,
        donationId,
        paymentMethod,
        status: 'confirmed',
        message: 'Donation confirmed successfully.',
      });
    }

    return NextResponse.json({success: false, message: 'Unsupported request step.'}, {status: 400});
  } catch (error) {
    const message = error instanceof Error && typeof error.message === 'string' ? error.message : 'Something went wrong while processing your donation. Please try again.';

    console.error('Donation API error:', error);

    if (message.includes('at least NPR 10') || message.includes('minimum donation')) {
      return NextResponse.json({success: false, message}, {status: 400});
    }

    return NextResponse.json({
      success: false,
      message: 'Something went wrong while processing your donation. Please try again.',
    }, {status: 500});
  }
}
