// api/create-payment-intent.js
// Uses your SECRET key — never expose this on the frontend

export const config = { runtime: 'edge', maxDuration: 30 };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const { amount, name, email, plan } = await req.json();

  // Call Stripe API directly (no SDK needed on edge runtime)
  const res = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      amount: String(amount),
      currency: 'usd',
      'metadata[name]': name,
      'metadata[email]': email,
      'metadata[plan]': plan,
      receipt_email: email,
    }),
  });

  const data = await res.json();

  if (data.error) {
    return new Response(JSON.stringify({ error: data.error.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ clientSecret: data.client_secret }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
