/**
 * Cloudflare Pages Function — handles POST /api/contact
 * Sends the contact form as an email via Resend (https://resend.com).
 *
 * Required environment variables (set in the Cloudflare Pages dashboard):
 *   RESEND_API_KEY  - your Resend API key (mark as "encrypted / secret")
 *   CONTACT_TO      - the inbox that should receive enquiries, e.g. hello@homedownsize.co.nz
 *   CONTACT_FROM    - a verified sender on your Resend domain, e.g. website@homedownsize.co.nz
 *
 * See DEPLOY.md for step-by-step setup.
 */

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function onRequestPost({ request, env }) {
  // Parse body (accept JSON or form-encoded)
  let data;
  try {
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      data = await request.json();
    } else {
      const form = await request.formData();
      data = Object.fromEntries(form.entries());
    }
  } catch (_) {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const firstName = (data.first_name || '').toString().trim();
  const lastName = (data.last_name || '').toString().trim();
  const email = (data.email || '').toString().trim();
  const phone = (data.phone || '').toString().trim();
  const comments = (data.comments || '').toString().trim();
  const honeypot = (data.company || '').toString().trim();

  // Spam bots fill hidden fields — silently accept, don't send.
  if (honeypot) return json({ ok: true });

  // Validation
  if (!firstName || !lastName || !email || !comments) {
    return json({ error: 'Please fill in all required fields.' }, 400);
  }
  if (!EMAIL_RE.test(email)) {
    return json({ error: 'Please enter a valid email address.' }, 400);
  }
  if (comments.length > 5000) {
    return json({ error: 'Message is too long.' }, 400);
  }

  // Config check
  const { RESEND_API_KEY, CONTACT_TO, CONTACT_FROM } = env;
  if (!RESEND_API_KEY || !CONTACT_TO || !CONTACT_FROM) {
    return json({ error: 'Email service is not configured yet.' }, 500);
  }

  const fullName = `${firstName} ${lastName}`;
  const html = `
    <h2>New enquiry from the Home Downsize website</h2>
    <p><strong>Name:</strong> ${escapeHtml(fullName)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(phone) || '(not provided)'}</p>
    <p><strong>Message:</strong></p>
    <p style="white-space:pre-wrap">${escapeHtml(comments)}</p>
  `;
  const text =
    `New enquiry from the Home Downsize website\n\n` +
    `Name: ${fullName}\n` +
    `Email: ${email}\n` +
    `Phone: ${phone || '(not provided)'}\n\n` +
    `Message:\n${comments}\n`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `Home Downsize Website <${CONTACT_FROM}>`,
        to: [CONTACT_TO],
        reply_to: email,
        subject: `New enquiry from ${fullName}`,
        html,
        text
      })
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('Resend error', res.status, detail);
      return json({ error: 'Could not send your message. Please try again later.' }, 502);
    }

    return json({ ok: true });
  } catch (err) {
    console.error('Contact function error', err);
    return json({ error: 'Unexpected error sending your message.' }, 500);
  }
}

// Reject anything that isn't POST
export async function onRequest({ request }) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405);
  }
}
