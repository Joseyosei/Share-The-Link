import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_J5kLuv09oEJtidB1lthpxOB3pOUzOFQd";

// Map Stripe product IDs to tier names
const PRODUCT_TO_TIER: Record<string, string> = {
  prod_TuQRMlT6Gfn7Sv: "free",
  prod_TuQTRlytxHScfY: "pro",
  prod_TuQUStzRn07sTU: "business",
  prod_TuQWHzMKX8eKbS: "enterprise",
};

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let event: Stripe.Event;

  try {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"] as string;

    if (!sig) {
      return res.status(400).json({ error: "Missing stripe-signature header" });
    }

    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook signature verification failed";
    console.error("Webhook verification error:", message);
    return res.status(400).json({ error: message });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout completed for:", session.customer_email, "Tier:", session.metadata?.tier);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const productId = (subscription.items.data[0]?.price as Stripe.Price)?.product as string;
        const tier = PRODUCT_TO_TIER[productId] || subscription.metadata?.tier || "unknown";
        const status = subscription.status;
        const cancelAtPeriodEnd = subscription.cancel_at_period_end;

        console.log("Subscription event:", {
          type: event.type,
          customerId: subscription.customer,
          tier,
          status,
          cancelAtPeriodEnd,
          currentPeriodEnd: new Date((subscription.current_period_end as number) * 1000).toISOString(),
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription cancelled:", {
          customerId: subscription.customer,
          status: subscription.status,
        });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Payment succeeded:", {
          customerId: invoice.customer,
          amount: invoice.amount_paid,
          currency: invoice.currency,
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Payment failed:", {
          customerId: invoice.customer,
          amount: invoice.amount_due,
        });
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
}
