# Stripe Integration Setup Guide

This guide will help you set up Stripe for the Credit Card Optimizer app.

## 1. Create a Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete the account verification process
3. Navigate to the Dashboard

## 2. Get Your API Keys

1. In the Stripe Dashboard, go to **Developers** → **API keys**
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

## 3. Create a Product and Price

1. Go to **Products** in the Stripe Dashboard
2. Click **+ Add product**
3. Fill in the details:
   - **Name**: Credit Card Optimizer Premium
   - **Description**: Premium subscription for advanced credit card optimization
4. Click **Save product**
5. In the pricing section, click **+ Add pricing**
6. Set up the pricing:
   - **Pricing model**: Standard pricing
   - **Price**: $9.99
   - **Billing period**: Monthly
   - **Currency**: USD
7. Click **Save pricing**
8. Copy the **Price ID** (starts with `price_`)

## 4. Set Up Webhooks

1. Go to **Developers** → **Webhooks**
2. Click **+ Add endpoint**
3. Set the endpoint URL to: `https://yourdomain.com/api/stripe/webhooks`
   - For local development: `https://your-ngrok-url.ngrok.io/api/stripe/webhooks`
4. Select these events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)

## 5. Update Environment Variables

Add these to your `.env` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_your_secret_key_here"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_publishable_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"
```

## 6. Update the Price ID

In `src/lib/stripe.ts`, update the `priceId` in the `STRIPE_CONFIG`:

```typescript
export const STRIPE_CONFIG = {
  products: {
    premium: {
      monthly: {
        priceId: 'price_your_actual_price_id_here', // Replace this
        amount: 999, // $9.99 in cents
      }
    }
  },
  // ... rest of config
}
```

## 7. Test the Integration

1. Start your development server: `npm run dev`
2. Go to `/pricing` page
3. Click "Start 7-Day Free Trial"
4. Use Stripe's test card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - Use any future expiry date and any 3-digit CVC

## 8. Local Development with Webhooks

For local testing of webhooks, use the Stripe CLI:

1. Install Stripe CLI: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. Login: `stripe login`
3. Forward events to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhooks
   ```
4. The CLI will show you a webhook signing secret - use this in your `.env`

## 9. Production Deployment

1. Update webhook endpoint URL to your production domain
2. Use production API keys instead of test keys
3. Ensure your webhook endpoint is accessible and returns 200 status codes

## Troubleshooting

- **Webhook not working**: Check that the endpoint URL is correct and accessible
- **Payment not processing**: Verify your API keys are correct and not mixed up
- **Subscription not updating**: Check webhook events are being received and processed
- **CORS errors**: Ensure your domain is added to Stripe's allowed origins

## Security Notes

- Never expose your secret key in client-side code
- Always verify webhook signatures
- Use HTTPS in production
- Keep your webhook signing secret secure 