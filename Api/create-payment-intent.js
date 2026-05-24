// ================================================================
//  api/create-payment-intent.js
// ================================================================

export const config = {
  runtime: 'edge',
  maxDuration: 30,
};

export default async function handler(req) {
  // Allow cross-origin requests
  if (req.method === 'OPTIONS') {
    return new Response('OK', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      { 
        status: 400, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  }

  const { amount, name, email, phone, plan } = body;

  if (!amount || typeof amount !== 'number' || amount < 50) {
    return new Response(
      JSON.stringify({ error: 'Invalid payment amount' }),
      { 
        status: 400, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  }

  // Talk directly to Stripe's REST API using your Vercel Environment Variables
  const stripeRes = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      amount:               String(amount), 
      currency:             'usd',
      receipt_email:        email || '',
      description:          `Web Insider — ${plan || 'Website Package'}`,
      'metadata[name]':     name  || '',
      'metadata[email]':    email || '',
      'metadata[phone]':    phone || '',
      'metadata[plan]':     plan  || '',
    }),
  });

  const stripeData = await stripeRes.json();

  if (stripeData.error) {
    console.error('Stripe error:', stripeData.error);
    return new Response(
      JSON.stringify({ error: stripeData.error.message }),
      { 
        status: 400, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  }

  return new Response(
    JSON.stringify({ clientSecret: stripeData.client_secret }),
    { 
      status: 200, 
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      } 
    }
  );
}
