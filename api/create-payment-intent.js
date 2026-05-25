const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { amount, description, customerEmail, customerName } = req.body;

    const amountCents = Math.round(amount * 100);

    // Safety check — reject anything outside your real price range
    if (amountCents < 24900 || amountCents > 200000) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      description: description,
      receipt_email: customerEmail,
      metadata: { customerName, description }
    });

    return res.status(200).json({ clientSecret: paymentIntent.client_secret });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}