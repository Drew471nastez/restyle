import { stripe } from './client';

interface CreateCheckoutParams {
  listingId: string;
  title: string;
  imageUrl: string;
  itemPrice: number;
  shippingCost: number;
  platformFee: number;
  currency: string;
  sellerStripeAccountId: string;
  buyerId: string;
  sellerId: string;
  locale: string;
}

export async function createCheckoutSession(params: CreateCheckoutParams) {
  const {
    listingId,
    title,
    imageUrl,
    itemPrice,
    shippingCost,
    platformFee,
    currency,
    sellerStripeAccountId,
    buyerId,
    sellerId,
    locale,
  } = params;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_intent_data: {
      capture_method: 'manual', // ESCROW: authorize but don't capture
      application_fee_amount: platformFee,
      transfer_data: {
        destination: sellerStripeAccountId,
      },
      metadata: {
        listing_id: listingId,
        buyer_id: buyerId,
        seller_id: sellerId,
      },
    },
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: title,
            images: imageUrl ? [imageUrl] : [],
          },
          unit_amount: itemPrice,
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: 'Shipping',
          },
          unit_amount: shippingCost,
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/orders?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/item/${listingId}`,
    metadata: {
      listing_id: listingId,
      buyer_id: buyerId,
      seller_id: sellerId,
      item_price: itemPrice.toString(),
      shipping_cost: shippingCost.toString(),
      platform_fee: platformFee.toString(),
    },
  });

  return session;
}

export async function capturePayment(paymentIntentId: string) {
  return stripe.paymentIntents.capture(paymentIntentId);
}

export async function refundPayment(paymentIntentId: string, amount?: number) {
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount,
  });
}

export async function cancelPaymentIntent(paymentIntentId: string) {
  return stripe.paymentIntents.cancel(paymentIntentId);
}
