// ================================================================
//  script.js — Stripe Payment Integration
// ================================================================

const stripe = Stripe('pk_test_51TaNh049qpQ3ycd9iUMTSPQYmwQmQcy6qd1UlmwBgUycHqZGZzmvChEHFpgfJN85iaPiMwbkzPh6eaC6oJx0nk2n00wU7qf17a');
const elements = stripe.elements();

// Card element — Stripe renders the secure card input
const cardElement = elements.create('card', {
  style: {
    base: {
      fontFamily: "'Cabinet Grotesk', 'Segoe UI', sans-serif",
      fontSize: '15px',
      color: '#080808',
      fontWeight: '500',
      '::placeholder': {
        color: '#9898a8',
        fontWeight: '400',
      },
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
    complete: {
      color: '#22c55e',
    },
  },
  hidePostalCode: false,
});

document.addEventListener('DOMContentLoaded', () => {
  const mountTarget = document.getElementById('stripe-card-element');
  if (mountTarget) {
    cardElement.mount('#stripe-card-element');

    cardElement.on('change', (event) => {
      const errorDiv = document.getElementById('card-errors');
      if (errorDiv) {
        errorDiv.textContent = event.error ? event.error.message : '';
      }
    });
  }
});

function getAmountCents() {
  const el = document.getElementById('payTotalVal');
  if (!el || !el.textContent) return 89900; 
  const raw = el.textContent.replace(/[^0-9]/g, '');
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? 89900 : parsed * 100;
}

async function executePayment() {
  const btn = document.getElementById('paySubmitBtn');

  const fname    = document.getElementById('pay-fname')?.value.trim();
  const lname    = document.getElementById('pay-lname')?.value.trim();
  const email    = document.getElementById('pay-email')?.value.trim();
  const phone    = document.getElementById('pay-phone')?.value.trim();
  const cardname = document.getElementById('pay-cardname')?.value.trim();
  const planName = document.getElementById('payPlanName')?.textContent || 'Plan';

  if (!fname || !lname) {
    showPayError('Please enter your first and last name.');
    return;
  }
  if (!email || !email.includes('@')) {
    showPayError('Please enter a valid email address.');
    return;
  }
  if (!cardname) {
    showPayError('Please enter the name on your card.');
    return;
  }

  btn.textContent = 'Processing...';
  btn.disabled = true;
  btn.style.opacity = '0.7';
  clearPayError();

  try {
    // Calls your server file in your repository's api folder
    const intentRes = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount:  getAmountCents(),
        name:    `${fname} ${lname}`,
        email:   email,
        phone:   phone || '',
        plan:    planName,
      }),
    });

    const intentData = await intentRes.json();

    if (!intentRes.ok || intentData.error) {
      throw new Error(intentData.error || 'Could not initialize payment.');
    }

    const { clientSecret } = intentData;

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name:  cardname,
          email: email,
          phone: phone || undefined,
        },
      },
      receipt_email: email,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (paymentIntent.status === 'succeeded') {
      showPaySuccess();
    } else {
      throw new Error('Payment did not complete. Please try again.');
    }

  } catch (err) {
    showPayError(err.message || 'Something went wrong. Please try again.');
    btn.textContent = 'Complete Purchase →';
    btn.disabled = false;
    btn.style.opacity = '1';
  }
}

function showPaySuccess() {
  const payMain    = document.getElementById('payMain');
  const paySuccess = document.getElementById('paySuccess');
  if (payMain)    payMain.style.display = 'none';
  if (paySuccess) paySuccess.classList.add('show');
  
  const pg = document.getElementById('pg-payment');
  if (pg) pg.scrollTop = 0;
  else window.scrollTo(0, 0);
}

function showPayError(message) {
  let errorDiv = document.getElementById('pay-error-msg');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.id = 'pay-error-msg';
    errorDiv.style.cssText = `
      color: #ef4444;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      margin-bottom: 12px;
      padding: 10px 14px;
      background: rgba(239,68,68,0.07);
      border: 1px solid rgba(239,68,68,0.2);
      border-radius: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    const submitBtn = document.getElementById('paySubmitBtn');
    if (submitBtn) submitBtn.before(errorDiv);
  }
  errorDiv.textContent = '⚠️ ' + message;
  errorDiv.style.display = 'flex';
}

function clearPayError() {
  const errorDiv = document.getElementById('pay-error-msg');
  if (errorDiv) errorDiv.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  const cardWrap = document.getElementById('stripe-card-element');
  if (cardWrap) {
    const errDiv = document.createElement('div');
    errDiv.id = 'card-errors';
    errDiv.style.cssText = `
      color: #ef4444;
      font-size: 12px;
      font-family: 'DM Sans', sans-serif;
      margin-top: -12px;
      margin-bottom: 14px;
      min-height: 16px;
    `;
    cardWrap.after(errDiv);
  }
});
