// Initialize Stripe using your Public Key
const stripe = Stripe('pk_live_51TaNh049qpQ3ycd9YVdtSZcv4OuTW1rKqBHmmYE1MgK8vAYak7Q4wo1CNdMdnSp3HQJQxU4mDq7l6la78SBF2Joh00KIVIOb0J
');

initialize();

async function initialize() {
  // 1. Fetch the secure session ticket from your Vercel backend
  const fetchClientSecret = async () => {
    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
    });
    const { clientSecret } = await response.json();
    return clientSecret;
  };

  // 2. Initialize the embedded Stripe checkout UI
  const checkout = await stripe.createEmbeddedCheckout({
    fetchClientSecret,
  });

  // 3. Mount the secure payment inputs into your HTML layout box
  checkout.mount('#checkout');
}
