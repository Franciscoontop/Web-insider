// Initialize Stripe with your Public Key
const stripe = Stripe('pk_test_51TaNh049qpQ3ycd9iUMTSPQYmwQmQcy6qd1UlmwBgUycHqZGZzmvChEHFpgfJN85iaPiMwbkzPh6eaC6oJx0nk2n00wU7qf17a');
const elements = stripe.elements();

// Match input styles to your page layout
const styleConfig = {
  style: {
    base: {
      color: '#000000',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '15px',
      '::placeholder': { color: '#a0aec0' },
    },
    invalid: { color: '#e53e3e', iconColor: '#e53e3e' }
  }
};

// Create and mount the Card Element safely
const cardEl = elements.create('card', styleConfig);

document.addEventListener('DOMContentLoaded', () => {
  const mountPoint = document.getElementById('stripe-card-element');
  if (mountPoint) {
    cardEl.mount('#stripe-card-element');
  }
});

async function executePayment() {
  const submitBtn = document.getElementById('paySubmitBtn');
  
  // Grab your form details
  const fname = document.getElementById('pay-fname').value;
  const lname = document.getElementById('pay-lname').value;
  const email = document.getElementById('pay-email').value;
  const phone = document.getElementById('pay-phone').value;
  const cardName = document.getElementById('pay-cardname').value;
  
  // Grab current plan details from the HTML text
  const planName = document.getElementById('payPlanName').innerText;
  const totalText = document.getElementById('payTotalVal').innerText; 
  
  // Clean total text (e.g., "$1,127" -> 1127) and convert to cents
  const cleanAmount = parseInt(totalText.replace(/[^0-9]/g, ''), 10);
  const amountInCents = cleanAmount * 100; 

  if (!email || !cardName || isNaN(amountInCents)) {
    alert("Please fill out your Email, Name on Card, and ensure your order summary has updated.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerText = "Processing Transaction...";

  try {
    // Step 1: Tell your Vercel backend to start a payment session for the dynamic price
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amountInCents,
        name: `${fname} ${lname}`.trim(),
        email: email,
        phone: phone,
        plan: planName
      })
    });

    const backendResult = await response.json();

    if (backendResult.error) {
      alert(`Server Setup Error: ${backendResult.error}`);
      resetSubmitButton();
      return;
    }

    // Step 2: Use the clientSecret from your backend to let Stripe securely finish the transaction
    const { paymentIntent, error } = await stripe.confirmCardPayment(backendResult.clientSecret, {
      payment_method: {
        card: cardEl,
        billing_details: {
          name: cardName,
          email: email,
          phone: phone
        }
      }
    });

    if (error) {
      alert(`Payment Failed: ${error.message}`);
      resetSubmitButton();
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Step 3: Success! Swap form panel containers smoothly
      document.getElementById('payMain').style.display = 'none';
      document.getElementById('paySuccess').classList.add('show');
    }

  } catch (err) {
    alert("System error communicating with the payment terminal. Please try again.");
    resetSubmitButton();
  }
}

function resetSubmitButton() {
  const submitBtn = document.getElementById('paySubmitBtn');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerText = "Complete Purchase →";
  }
}
