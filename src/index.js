/**
 * Worker entry point.
 * - POST /api/contact -> contact form handler (emails via Resend)
 * - everything else   -> static files in ./public
 */
import { onRequestPost as handleContact } from '../functions/api/contact.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact') {
      if (request.method === 'POST') return handleContact({ request, env });
      return new Response(JSON.stringify({ error: 'Method not allowed.' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', Allow: 'POST' }
      });
    }

    return env.ASSETS.fetch(request);
  }
};
