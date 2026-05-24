// Initialize Stripe with your Public Key
const stripe = Stripe('pk_test_51TaNh049qpQ3ycd9iUMTSPQYmwQmQcy6qd1UlmwBgUycHqZGZzmvChEHFpgfJN85iaPiMwbkzPh6eaC6oJx0nk2n00wU7qf17a');
const elements = stripe.elements();

// Match input internal parameters directly to your page styling fonts
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

const cardEl = elements.create('card', styleConfig);
cardEl.mount('#stripe-card-element');

async function executePayment() {
  const submitBtn = document.getElementById('paySubmitBtn');
  const cardNameInput = document.getElementById('pay-cardname').value;
  const emailInput = document.getElementById('pay-email').value;

  if (!cardNameInput || !emailInput) {
    alert("Please fill out your Name on Card and Email Address.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerText = "Processing Transaction...";

  // Call Stripe servers directly to extract token
  const { paymentMethod, error } = await stripe.createPaymentMethod({
    type: 'card',
    card: cardEl,
    billing_details: {
      name: cardNameInput,
      email: emailInput
    }
  });

  if (error) {
    alert(`Payment Verification Failed: ${error.message}`);
    resetSubmitButton();
  } else {
    sendPaymentToServer(paymentMethod.id);
  }
}

async function sendPaymentToServer(paymentMethodId) {
  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethodId: paymentMethodId })
    });

    const paymentResult = await response.json();

    if (paymentResult.success) {
      document.getElementById('payMain').style.display = 'none';
      document.getElementById('paySuccess').classList.add('show');
    } else {
      alert(`Server Charge Refused: ${paymentResult.error}`);
      resetSubmitButton();
    }
  } catch (err) {
    alert("Unable to reach transaction server. Please try again later.");
    resetSubmitButton();
  }
}

function resetSubmitButton() {
  const submitBtn = document.getElementById('paySubmitBtn');
  submitBtn.disabled = false;
  submitBtn.innerText = "Complete Purchase →";
}
