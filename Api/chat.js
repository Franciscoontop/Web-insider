const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const session = await stripe.checkout.sessions.create({
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Web Insider - Pro Plan',
              description: 'Up to 6 pages, custom premium design, 10-day delivery',
            },
            unit_amount: 89900, // $899 in cents
          },
          quantity: 1,
        }],
        mode: 'payment',
        ui_mode: 'embedded',
        return_url: `${req.headers.origin}/return?session_id={CHECKOUT_SESSION_ID}`,
      });

      res.status(200).json({ clientSecret: session.client_secret });
    } catch (err) {
      res.status(err.statusCode || 500).json(err.message);
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
