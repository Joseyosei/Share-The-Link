/**
 * SEND BOOKING EMAIL - Edge Function
 *
 * Sends a confirmation email to the client after a booking is created.
 * Uses Resend API (https://resend.com) for email delivery.
 *
 * Required env var:
 *   RESEND_API_KEY - Your Resend API key (set in Supabase Dashboard → Edge Functions → Secrets)
 *
 * Optional env var:
 *   SENDER_EMAIL - Verified sender email (defaults to onboarding@resend.dev for testing)
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingEmailRequest {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  creatorName: string;
  bookingDate: string;
  bookingTime: string;
  duration: number;
  amount: number;
  currency: string;
}

const formatTime12h = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const buildEmailHtml = (data: BookingEmailRequest) => {
  const formattedDate = formatDate(data.bookingDate);
  const formattedTime = formatTime12h(data.bookingTime);
  const priceDisplay =
    data.amount > 0 ? `$${data.amount.toFixed(2)} ${data.currency.toUpperCase()}` : "Free";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <tr>
      <td style="background:linear-gradient(135deg,#8B5CF6 0%,#EC4899 100%);padding:32px 24px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Booking Confirmed!</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Your session has been booked successfully</p>
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding:32px 24px;">
        <p style="margin:0 0 20px;font-size:15px;color:#374151;">
          Hi <strong>${data.clientName}</strong>,
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
          Your booking with <strong>${data.creatorName}</strong> has been confirmed. Here are the details:
        </p>
        <!-- Details card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f9fafb;border-radius:12px;border:1px solid #e5e7eb;">
          <tr>
            <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
              <span style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Service</span><br>
              <span style="font-size:15px;color:#111827;font-weight:600;">${data.serviceName}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
              <span style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Date & Time</span><br>
              <span style="font-size:15px;color:#111827;font-weight:600;">${formattedDate}</span><br>
              <span style="font-size:14px;color:#374151;">${formattedTime} &middot; ${data.duration} minutes</span>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 20px;">
              <span style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Price</span><br>
              <span style="font-size:15px;color:#111827;font-weight:600;">${priceDisplay}</span>
            </td>
          </tr>
        </table>

        <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.5;">
          If you need to reschedule or cancel, please contact ${data.creatorName} directly.
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding:16px 24px;text-align:center;border-top:1px solid #f3f4f6;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">
          Sent via <a href="https://sharethelink.app" style="color:#8B5CF6;text-decoration:none;font-weight:500;">Share The Link</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("[SEND-BOOKING-EMAIL] RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data: BookingEmailRequest = await req.json();
    const { clientName, clientEmail, serviceName, creatorName, bookingDate, bookingTime, duration, amount, currency } = data;

    if (!clientEmail || !clientName || !serviceName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const senderEmail = Deno.env.get("SENDER_EMAIL") || "onboarding@resend.dev";
    const formattedDate = formatDate(bookingDate);
    const formattedTime = formatTime12h(bookingTime);

    console.log(`[SEND-BOOKING-EMAIL] Sending to ${clientEmail} for ${serviceName} on ${formattedDate} at ${formattedTime}`);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `Share The Link <${senderEmail}>`,
        to: [clientEmail],
        subject: `Booking Confirmed: ${serviceName} with ${creatorName}`,
        html: buildEmailHtml(data),
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("[SEND-BOOKING-EMAIL] Resend API error:", result);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: result }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[SEND-BOOKING-EMAIL] Email sent successfully:", result.id);
    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[SEND-BOOKING-EMAIL] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
