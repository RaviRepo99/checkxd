'use client';

import {useEffect, useMemo, useState} from 'react';
import {
  Check,
  CircleAlert,
  FileUp,
} from 'lucide-react';

const paymentMethods = [
  {id: 'esewa', label: 'eSewa', description: 'Fast wallet transfer'},
  {id: 'khalti', label: 'Khalti', description: 'Mobile wallet payment'},
  {id: 'imepay', label: 'IME Pay', description: 'Quick wallet transfer'},
  {id: 'bank', label: 'Bank Transfer', description: 'Direct bank deposit'},
  {
    id: 'manual',
    label: 'Manual QR / Cash',
    description: 'Manual payment confirmation',
  },
] as const;

type PaymentMethod = (typeof paymentMethods)[number]['id'];

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  message: string;
  amount: string;
  selectedQuickAmount: string;
  termsAccepted: boolean;
};

const initialForm: FormState = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  message: '',
  amount: '',
  selectedQuickAmount: '',
  termsAccepted: false,
};

function toCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'NPR',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DonationPageClient() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState | 'amount' | 'paymentMethod' | 'proof' | 'transactionId', string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [donationSummary, setDonationSummary] = useState<{
    donorName: string;
    email: string;
    phone: string;
    amount: number;
    donationId: string;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('esewa');
  const [transactionId, setTransactionId] = useState('');
  const [proofFileName, setProofFileName] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [impactStats, setImpactStats] = useState({
    totalDonations: 0,
    donorCount: 0,
  });
  const [recentDonors, setRecentDonors] = useState<Array<{
    full_name: string;
    amount: number;
    email: string;
    phone: string;
    created_at: string;
  }>>([]);

  useEffect(() => {
    const loadImpactStats = async () => {
      try {
        const response = await fetch('/api/donations');
        const data = await response.json();
        if (response.ok && data.success) {
          setImpactStats({
            totalDonations: Number(data.totalDonations || 0),
            donorCount: Number(data.donorCount || 0),
          });
          setRecentDonors(data.recentDonors || []);
        }
      } catch {
        // Keep the default values when statistics are unavailable.
      }
    };

    loadImpactStats();
    // Refresh stats every 30 seconds for live updates
    const interval = setInterval(loadImpactStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const selectedAmount = useMemo(() => {
    const customAmount = Number(form.amount || 0);
    if (Number.isFinite(customAmount) && customAmount > 0) {
      return customAmount;
    }
    const quickAmount = Number(form.selectedQuickAmount || 0);
    if (Number.isFinite(quickAmount) && quickAmount > 0) {
      return quickAmount;
    }
    return 0;
  }, [form.amount, form.selectedQuickAmount]);

  const updateField = (field: keyof FormState, value: string | boolean) => {
    setForm((current) => ({...current, [field]: value}));
    setErrors((current) => ({...current, [field]: undefined}));
    if (field === 'amount' || field === 'selectedQuickAmount') {
      setErrors((current) => ({...current, amount: undefined}));
    }
  };

  const validateForm = () => {
    const nextErrors: Partial<
      Record<keyof FormState | 'amount' | 'paymentMethod' | 'proof' | 'transactionId', string>
    > = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = 'Full name is required.';
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) {
      nextErrors.email = 'Email address is required.';
    } else if (!emailPattern.test(form.email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    const phonePattern = /^[0-9+()\-\s]{7,20}$/;
    if (!form.phone.trim()) {
      nextErrors.phone = 'Phone number is required.';
    } else if (!phonePattern.test(form.phone.trim())) {
      nextErrors.phone = 'Please enter a valid phone number.';
    }

    if (!selectedAmount || selectedAmount <= 0) {
      nextErrors.amount = 'Donation amount must be a valid positive number.';
    } else if (selectedAmount < 10) {
      nextErrors.amount = 'Minimum donation amount is NPR 10.';
    }

    if (!form.termsAccepted) {
      nextErrors.termsAccepted = 'You must agree to the donation terms.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors((current) => ({
      ...current,
      paymentMethod: undefined,
      proof: undefined,
      transactionId: undefined,
    }));

    try {
      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        signal: AbortSignal.timeout(30000),
        body: JSON.stringify({
          step: 'submit',
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          message: form.message.trim(),
          amount: selectedAmount,
          currency: 'NPR',
          termsAccepted: form.termsAccepted,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(
            data.message ||
            'We could not process your donation right now. Please try again.',
        );
      }

      if (typeof data.checkoutUrl === 'string' && data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
        return;
      }

      setDonationSummary({
        donorName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        amount: selectedAmount,
        donationId: data.donationId,
      });
      setSuccessMessage('');
    } catch (error) {
      setErrors((current) => ({
        ...current,
        amount:
          error instanceof Error ?
            error.message :
            'Unable to submit donation. Please try again.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!donationSummary) {
      return;
    }

    const nextErrors: Partial<Record<'paymentMethod' | 'proof' | 'transactionId', string>> = {};
    if (paymentMethod === 'manual' && !transactionId.trim()) {
      nextErrors.transactionId =
        'Transaction ID or reference number is required for manual payment.';
    }

    if (paymentMethod === 'manual' && !proofFileName) {
      nextErrors.proof = 'Please upload a payment proof image or receipt.';
    }

    setErrors((current) => ({...current, ...nextErrors}));

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          step: 'payment-confirmation',
          donationId: donationSummary.donationId,
          paymentMethod,
          transactionId: transactionId.trim(),
          proofFileName,
          amount: donationSummary.amount,
          donorName: donationSummary.donorName,
          email: donationSummary.email,
          phone: donationSummary.phone,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(
            data.message || 'Unable to confirm payment. Please try again.',
        );
      }

      setSuccessMessage('Thank You for Supporting Nepal Flood Relief ❤️');
      setIsSubmitting(false);
    } catch (error) {
      setErrors((current) => ({
        ...current,
        paymentMethod:
          error instanceof Error ?
            error.message :
            'Unable to confirm payment. Please try again.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const showSuccess = Boolean(successMessage);

  return (
    <main className="min-h-screen bg-[#f8f6f1] text-slate-900">
      <div className="site-container py-8 sm:py-10 lg:py-12">
        <section id="donate" className="mt-24 grid gap-8 sm:mt-20 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            {!showSuccess ? (
              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-600">
                    Make a Donation
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                    Support Nepal Flood Relief
                  </h2>
                </div>

                <div className="space-y-6">
                  <fieldset className="space-y-4">
                    <legend className="text-lg font-semibold text-slate-900">
                      Personal Information
                    </legend>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block sm:col-span-2">
                        <span className="mb-2 block text-sm font-medium text-slate-700">
                          Full Name *
                        </span>
                        <input
                          type="text"
                          value={form.fullName}
                          onChange={(event) =>
                            updateField('fullName', event.target.value)
                          }
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
                          aria-invalid={Boolean(errors.fullName)}
                          aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                          placeholder="Your full name"
                        />
                        {errors.fullName && (
                          <span id="fullName-error" className="mt-1 block text-sm text-red-600">
                            {errors.fullName}
                          </span>
                        )}
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">
                          Email Address *
                        </span>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(event) => updateField('email', event.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
                          aria-invalid={Boolean(errors.email)}
                          aria-describedby={errors.email ? 'email-error' : undefined}
                          placeholder="name@example.com"
                        />
                        {errors.email && (
                          <span id="email-error" className="mt-1 block text-sm text-red-600">
                            {errors.email}
                          </span>
                        )}
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">
                          Phone Number *
                        </span>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(event) => updateField('phone', event.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
                          aria-invalid={Boolean(errors.phone)}
                          aria-describedby={errors.phone ? 'phone-error' : undefined}
                          placeholder="98XXXXXXXX"
                        />
                        {errors.phone && (
                          <span id="phone-error" className="mt-1 block text-sm text-red-600">
                            {errors.phone}
                          </span>
                        )}
                      </label>

                      <label className="block sm:col-span-2">
                        <span className="mb-1.5 block text-sm font-medium text-slate-700">
                          Optional message
                        </span>
                        <textarea
                          rows={2}
                          value={form.message}
                          onChange={(event) => {
                            const words = event.target.value.trim().split(/\s+/);
                            const message =
                              event.target.value.trim() === '' ?
                                '' :
                                words.slice(0, 100).join(' ');
                            updateField('message', message);
                          }}
                          className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-900 outline-none transition focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
                          placeholder="A short message of support"
                        />
                      </label>
                    </div>
                  </fieldset>

                  <fieldset className="space-y-4">
                    <legend className="text-lg font-semibold text-slate-900">
                      Donation
                    </legend>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Donation Amount *
                      </label>
                      <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <span className="text-sm font-semibold text-slate-600">
                          NPR
                        </span>
                        <input
                          type="number"
                          min="10"
                          step="100"
                          value={form.amount}
                          onChange={(event) => {
                            updateField('amount', event.target.value);
                            updateField('selectedQuickAmount', '');
                          }}
                          placeholder="Enter amount"
                          className="w-full border-0 bg-transparent px-0 py-0 text-base text-slate-900 outline-none placeholder:text-slate-400"
                        />
                      </div>

                      {errors.amount && (
                        <span className="mt-2 block text-sm text-red-600">
                          {errors.amount}
                        </span>
                      )}
                    </div>
                  </fieldset>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <label className="flex items-start gap-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={form.termsAccepted}
                        onChange={(event) =>
                          updateField('termsAccepted', event.target.checked)
                        }
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                      />
                      <span>
                        I agree to the donation terms and confirm that the
                        information provided is correct.
                      </span>
                    </label>
                    {errors.termsAccepted && (
                      <span className="mt-2 block text-sm text-red-600">
                        {errors.termsAccepted}
                      </span>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-red-600 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSubmitting ? 'Processing...' : 'Donate Now'}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-green-100 p-2">
                      <Check className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">
                        {successMessage ||
                          'Thank You for Supporting Nepal Flood Relief ❤️'}
                      </p>
                    </div>
                  </div>
                </div>

                {donationSummary && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Donation Reference
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {donationSummary.donationId}
                    </p>
                    <dl className="mt-4 space-y-3 text-sm text-slate-700">
                      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
                        <dt>Donation amount</dt>
                        <dd className="font-semibold text-slate-900">
                          {toCurrency(donationSummary.amount)}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
                        <dt>Donor</dt>
                        <dd className="font-semibold text-slate-900">
                          {donationSummary.donorName}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
                        <dt>Email</dt>
                        <dd className="font-semibold text-slate-900">
                          {donationSummary.email}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt>Phone</dt>
                        <dd className="font-semibold text-slate-900">
                          {donationSummary.phone}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-600">
                Secure Payment
              </p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">
                Payment Details
              </h3>
            </div>

            <h4 className="mb-4 text-lg font-semibold text-slate-900">
              ### Recent Donors
            </h4>

            {recentDonors.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                No recent donor updates yet.
              </div>
            ) : (
              <div className="mb-6 max-h-80 space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
                {recentDonors.map((donor, index) => (
                  <div key={index} className="border-b border-slate-200 pb-3 last:border-0">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-900">{donor.full_name}</p>
                        <p className="text-xs text-slate-500">{donor.email}</p>
                      </div>
                      <p className="text-lg font-bold text-red-600">
                        {toCurrency(Number(donor.amount || 0))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {donationSummary && (
              <div className="mb-6 space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
                    <span>Donation amount</span>
                    <span className="text-lg font-bold text-slate-900">
                      {toCurrency(donationSummary.amount)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-600">
                    <span>Donor name</span>
                    <span className="font-medium text-slate-900">
                      {donationSummary.donorName}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-sm text-slate-600">
                    <span>Email</span>
                    <span className="font-medium text-slate-900">
                      {donationSummary.email}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-sm text-slate-600">
                    <span>Contact number</span>
                    <span className="font-medium text-slate-900">
                      {donationSummary.phone}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-semibold text-slate-700">
                    Available payment methods
                  </p>
                  <div className="space-y-3">
                    {paymentMethods.map((method) => {
                      const selected = paymentMethod === method.id;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setPaymentMethod(method.id)}
                          className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left transition ${selected ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white hover:border-red-300 hover:bg-red-50/50'}`}
                        >
                          <div>
                            <p className="font-semibold text-slate-900">
                              {method.label}
                            </p>
                            <p className="text-xs text-slate-500">
                              {method.description}
                            </p>
                          </div>
                          <div
                            className={`h-4 w-4 rounded-full border-2 ${selected ? 'border-red-600 bg-red-600' : 'border-slate-300'} `}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {paymentMethod === 'manual' && (
                  <div className="space-y-4 rounded-2xl border border-dashed border-red-200 bg-red-50 p-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        QR payment option
                      </p>
                      <div className="mt-3 flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                        QR Code
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Upload Payment Proof
                      </label>
                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 transition hover:border-red-300 hover:bg-red-50">
                        <FileUp className="h-4 w-4" />
                        <span>{proofFileName || 'Choose receipt or screenshot'}</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              setProofFileName(file.name);
                              setErrors((current) => ({...current, proof: undefined}));
                            }
                          }}
                        />
                      </label>
                      {errors.proof && (
                        <span className="mt-1 block text-sm text-red-600">
                          {errors.proof}
                        </span>
                      )}
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Transaction ID / Reference Number
                      </span>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(event) => {
                          setTransactionId(event.target.value);
                          setErrors((current) => ({
                            ...current,
                            transactionId: undefined,
                          }));
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                        placeholder="e.g. NFR-2026-001"
                      />
                      {errors.transactionId && (
                        <span className="mt-1 block text-sm text-red-600">
                          {errors.transactionId}
                        </span>
                      )}
                    </label>
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  <p className="font-semibold text-slate-800">Payment instructions</p>
                  <p className="mt-2">
                    {paymentMethod === 'manual' ?
                      'Please complete the transfer and upload the proof of payment. A reference number is required before the donation is marked as complete.' :
                      'Follow the selected payment method, complete the transfer, and keep the confirmation details for verification.'}
                  </p>
                </div>

                {errors.paymentMethod && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <CircleAlert className="mt-0.5 h-4 w-4" />
                    <span>{errors.paymentMethod}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handlePaymentSubmit}
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? 'Submitting...' : 'Complete Donation'}
                </button>
              </div>
            )}
          </aside>
        </section>

        <section className="mt-12 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-600">
              Impact Overview
            </p>
            <h3 className="mt-2 text-3xl font-bold text-slate-900">
              Donation Information
            </h3>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {label: 'Total Donations', value: toCurrency(impactStats.totalDonations)},
              {label: 'Number of Donors', value: impactStats.donorCount.toLocaleString('en-US')},
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <p className="text-sm font-medium text-slate-500">{item.label}</p>
                <p className="mt-3 text-2xl font-bold text-slate-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-600">
              How relief is used
            </p>
            <h3 className="mt-2 text-3xl font-bold text-slate-900">
              Where Your Donation Helps
            </h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              'Emergency food and water',
              'Temporary shelter',
              'Medical assistance',
              'Essential supplies',
              'Support for affected families',
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <Check className="h-5 w-5" />
                </div>
                <p className="text-base font-semibold text-slate-900">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

    </main>
  );
}
