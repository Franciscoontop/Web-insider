// ================================================================
//  script.js — Stripe Payment Integration
//  
//  SETUP CHECKLIST:
//  1. Replace YOUR_PUBLISHABLE_KEY_HERE with your pk_test_... key
//  2. Create api/create-payment-intent.js (separate file)
//  3. Add STRIPE_SECRET_KEY to Vercel environment variables
//  4. Test with card: 4242 4242 4242 4242 | 12/29 | 123
// ================================================================


// ================================================================
//  ① STRIPE INIT
//  Replace the key below with your publishable key from:
//  dashboard.stripe.com → Developers → API Keys
//  It starts with pk_test_ (for testing) or pk_live_ (for real payments)
// ================================================================
const stripe = Stripe('pk_test_YOUR_PUBLISHABLE_KEY_HERE');
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


// ================================================================
//  ② MOUNT CARD ELEMENT
//  Waits for the DOM to be ready before mounting into the div.
//  This fires when the page loads — Stripe injects the secure
//  card input fields into #stripe-card-element automatically.
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
  const mountTarget = document.getElementById('stripe-card-element');
  if (mountTarget) {
    cardElement.mount('#stripe-card-element');

    // Show real-time validation feedback under the card field
    cardElement.on('change', (event) => {
      const errorDiv = document.getElementById('card-errors');
      if (errorDiv) {
        errorDiv.textContent = event.error ? event.error.message : '';
      }
    });
  }
});


// ================================================================
//  ③ HELPER — GET AMOUNT IN CENTS
//  Reads the "Due Today" price from the order summary and
//  converts it to cents (Stripe requires amounts in cents).
//  e.g. "$499" → 49900
// ================================================================
function getAmountCents() {
  const el = document.getElementById('payTotalVal');
  if (!el) return 49900; // fallback $499
  const raw = el.textContent.replace(/[^0-9]/g, '');
  return parseInt(raw) * 100;
}


// ================================================================
//  ④ EXECUTE PAYMENT
//  Called when the user clicks "Complete Purchase →"
//  Flow:
//    1. Validate form fields
//    2. Call your backend to create a PaymentIntent
//    3. Confirm the card payment with Stripe
//    4. Show success or error
// ================================================================
async function executePayment() {
  const btn = document.getElementById('paySubmitBtn');

  // ── Collect form values ──
  const fname    = document.getElementById('pay-fname')?.value.trim();
  const lname    = document.getElementById('pay-lname')?.value.trim();
  const email    = document.getElementById('pay-email')?.value.trim();
  const phone    = document.getElementById('pay-phone')?.value.trim();
  const cardname = document.getElementById('pay-cardname')?.value.trim();
  const planName = document.getElementById('payPlanName')?.textContent || 'Plan';

  // ── Validate required fields ──
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

  // ── Disable button while processing ──
  btn.textContent = 'Processing...';
  btn.disabled = true;
  btn.style.opacity = '0.7';
  clearPayError();

  try {

    // ── STEP 1: Create PaymentIntent on your backend ──
    // This calls api/create-payment-intent.js which uses your
    // secret key to create a PaymentIntent with Stripe.
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

    // ── STEP 2: Confirm the card payment with Stripe ──
    // Stripe handles 3D Secure, card validation, etc.
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
      // Card was declined, wrong number, expired, etc.
      throw new Error(error.message);
    }

    if (paymentIntent.status === 'succeeded') {
      // ── STEP 3: Payment succeeded! Show confirmation ──
      showPaySuccess();
    } else {
      throw new Error('Payment did not complete. Please try again.');
    }

  } catch (err) {
    // Reset button and show error
    showPayError(err.message || 'Something went wrong. Please try again.');
    btn.textContent = 'Complete Purchase →';
    btn.disabled = false;
    btn.style.opacity = '1';
  }
}


// ================================================================
//  ⑤ SHOW SUCCESS STATE
//  Hides the form and shows the green success screen.
// ================================================================
function showPaySuccess() {
  const payMain    = document.getElementById('payMain');
  const paySuccess = document.getElementById('paySuccess');
  if (payMain)    payMain.style.display = 'none';
  if (paySuccess) paySuccess.classList.add('show');
  // Scroll to top of payment page
  const pg = document.getElementById('pg-payment');
  if (pg) pg.scrollTop = 0;
  else window.scrollTo(0, 0);
}


// ================================================================
//  ⑥ ERROR HELPERS
//  Shows/clears the error message under the submit button.
// ================================================================
function showPayError(message) {
  let errorDiv = document.getElementById('pay-error-msg');
  if (!errorDiv) {
    // Create the error div if it doesn't exist yet
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


// ================================================================
//  ⑦ CARD VALIDATION ERROR DIV
//  Real-time errors from Stripe (wrong card number, expired, etc.)
//  are shown here as the user types.
// ================================================================
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
