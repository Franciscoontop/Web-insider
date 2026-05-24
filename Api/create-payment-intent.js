// ================================================================
//  api/create-payment-intent.js
//
//  SETUP:
//  Add STRIPE_SECRET_KEY to Vercel → Settings → Environment Variables
//  Your secret key starts with sk_test_... (test) or sk_live_... (live)
//
//  This file runs on Vercel's edge runtime — no npm install needed.
//  It calls Stripe's REST API directly using fetch.
// ================================================================

export const config = {
  runtime: 'edge',
  maxDuration: 30,
};

export default async function handler(req) {

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Parse the request body
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { amount, name, email, phone, plan } = body;

  // Validate amount
  if (!amount || typeof amount !== 'number' || amount < 50) {
    return new Response(
      JSON.stringify({ error: 'Invalid payment amount' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── Call Stripe to create a PaymentIntent ──
  // Stripe requires form-encoded body (not JSON) for their REST API
  const stripeRes = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      // Your secret key from Vercel environment variables
      'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      amount:           String(amount),   // in cents, e.g. 49900 = $499
      currency:         'usd',
      receipt_email:    email || '',
      description:      `Web Insider — ${plan || 'Website Package'}`,
      // Metadata shows up in your Stripe dashboard for each payment
      'metadata[name]':  name  || '',
      'metadata[email]': email || '',
      'metadata[phone]': phone || '',
      'metadata[plan]':  plan  || '',
    }),
  });

  const stripeData = await stripeRes.json();

  // Handle Stripe errors
  if (stripeData.error) {
    console.error('Stripe error:', stripeData.error);
    return new Response(
      JSON.stringify({ error: stripeData.error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Return the client_secret to the frontend
  // The frontend uses this to confirm the payment with the card details
  return new Response(
    JSON.stringify({ clientSecret: stripeData.client_secret }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
