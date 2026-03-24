import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAuth, unauthorized } from "./_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify auth
    const auth = await verifyAuth(req);
    if (!auth) {
      return unauthorized(res);
    }

    const { memberEmail, role, ownerName } = req.body;

    if (!memberEmail || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Use Resend API to send invite email
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      // No email service configured - just return success silently
      console.warn("[SEND-TEAM-INVITE] RESEND_API_KEY not configured, skipping email");
      return res.status(200).json({ success: true, emailSent: false, reason: "Email service not configured" });
    }

    const senderEmail = process.env.SENDER_EMAIL || "onboarding@resend.dev";
    const appUrl = process.env.VITE_APP_URL || "https://sharethelink.app";
    const roleName = role.charAt(0).toUpperCase() + role.slice(1);

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <tr>
      <td style="background:linear-gradient(135deg,#8B5CF6 0%,#EC4899 100%);padding:32px 24px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">You're Invited!</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Join a team on Share The Link</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 24px;">
        <p style="margin:0 0 20px;font-size:15px;color:#374151;">
          Hi there,
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
          <strong>${ownerName || "A creator"}</strong> has invited you to join their team on Share The Link as <strong>${roleName}</strong>.
        </p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f9fafb;border-radius:12px;border:1px solid #e5e7eb;">
          <tr>
            <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
              <span style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Your Role</span><br>
              <span style="font-size:15px;color:#111827;font-weight:600;">${roleName}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 20px;">
              <span style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">What you can do</span><br>
              <span style="font-size:14px;color:#374151;">${
                role === "admin"
                  ? "Full access to all settings and content"
                  : role === "editor"
                    ? "Edit links, content, and profile settings"
                    : "View dashboard and analytics"
              }</span>
            </td>
          </tr>
        </table>
        <div style="text-align:center;margin:28px 0;">
          <a href="${appUrl}/signup" style="display:inline-block;background:linear-gradient(135deg,#8B5CF6 0%,#EC4899 100%);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:12px;">
            Accept Invitation
          </a>
        </div>
        <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;text-align:center;">
          If you don't have an account yet, you'll be asked to create one.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 24px;text-align:center;border-top:1px solid #f3f4f6;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">
          Sent via <a href="${appUrl}" style="color:#8B5CF6;text-decoration:none;font-weight:500;">Share The Link</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `Share The Link <${senderEmail}>`,
        to: [memberEmail],
        subject: `${ownerName || "Someone"} invited you to their team on Share The Link`,
        html: emailHtml,
      }),
    });

    const emailResult = await emailRes.json();

    if (!emailRes.ok) {
      console.error("[SEND-TEAM-INVITE] Resend API error:", emailResult);
      return res.status(200).json({ success: true, emailSent: false, error: emailResult });
    }

    return res.status(200).json({ success: true, emailSent: true, emailId: emailResult.id });
  } catch (err) {
    console.error("[SEND-TEAM-INVITE] Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
