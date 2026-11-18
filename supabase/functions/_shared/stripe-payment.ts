/**
 * Payment links that don't die.
 *
 * A Stripe **Checkout Session** can only live for 24 hours (`expires_at` is
 * capped there by Stripe). Every FNH/voice confirmation email used to embed
 * one, so a client who came back to the email a day later got Stripe's
 * "This checkout session has expired" page — which is exactly what happened to
 * a real booking.
 *
 * A Stripe **Payment Link** has no expiry and can be paid whenever the client
 * is ready. This helper is the single place that creates one.
 */

type StripeClient = {
  paymentLinks: {
    create: (params: Record<string, unknown>) => Promise<{ url: string; id: string }>;
  };
};

export interface PaymentLinkInput {
  /** Amount in major units (e.g. 70 = $70.00). */
  amount: number;
  currency?: string;
  name: string;
  description?: string;
  customerEmail?: string | null;
  metadata?: Record<string, string>;
  statementDescriptor?: string;
}

/**
 * Create a reusable Stripe Payment Link and return its URL.
 *
 * `after_completion: hosted_confirmation` lets Stripe show its own receipt
 * page, so we don't bounce a client back into the CRM (which needs a
 * practitioner login) after they pay.
 */
export async function createPaymentLink(
  stripe: StripeClient,
  input: PaymentLinkInput,
): Promise<string> {
  const { amount, currency = "aud", name, description, customerEmail, metadata, statementDescriptor } = input;

  const mergedMetadata: Record<string, string> = { ...(metadata || {}) };
  if (customerEmail) mergedMetadata.customer_email = customerEmail;

  const link = await stripe.paymentLinks.create({
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name,
            ...(description ? { description } : {}),
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    ...(Object.keys(mergedMetadata).length ? { metadata: mergedMetadata } : {}),
    // Payment Links take the statement descriptor but not a prefilled receipt
    // email — Stripe collects that at checkout.
    payment_intent_data: statementDescriptor
      ? { statement_descriptor: statementDescriptor }
      : undefined,
    after_completion: { type: "hosted_confirmation" },
  });

  if (!link?.url) throw new Error("Stripe returned no payment link URL");
  return link.url;
}

/**
 * Extract the Stripe object id from a stored payment link.
 *
 * Checkout Sessions look like `…/pay/cs_live_abc123#…`; Payment Links look
 * like `https://buy.stripe.com/abc123`. Returns null when there is no id to
 * check (older/hand-pasted links).
 */
export function stripeObjectIdFromPaymentLink(link?: string | null): { type: "checkout_session"; id: string } | { type: "payment_link"; id: string } | null {
  if (!link) return null;
  const cs = link.match(/\/(cs_(?:live|test)_[A-Za-z0-9]+)/);
  if (cs) return { type: "checkout_session", id: cs[1] };
  const pl = link.match(/buy\.stripe\.com\/([A-Za-z0-9]+)/);
  if (pl) return { type: "payment_link", id: pl[1] };
  return null;
}