import { verifyKey } from 'discord-interactions';
import { handleInteraction } from '../bot.js';

function json(data, status = 200) {
  return Response.json(data, { status });
}

export default {
  async fetch(request) {
    if (request.method === 'GET') {
      return json({
        ok: true,
        message: 'Discord interactions endpoint is ready.',
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: { Allow: 'GET, POST' },
      });
    }

    const publicKey = process.env.DISCORD_PUBLIC_KEY;

    if (!publicKey) {
      console.error('DISCORD_PUBLIC_KEY belum diatur.');
      return json({ error: 'Server belum dikonfigurasi.' }, 500);
    }

    const signature = request.headers.get('x-signature-ed25519');
    const timestamp = request.headers.get('x-signature-timestamp');

    if (!signature || !timestamp) {
      return json({ error: 'Signature Discord tidak ditemukan.' }, 401);
    }

    // Signature harus diverifikasi menggunakan body mentah sebelum JSON diparsing.
    const rawBody = await request.text();
    const isValidRequest = await verifyKey(
      rawBody,
      signature,
      timestamp,
      publicKey,
    );

    if (!isValidRequest) {
      return json({ error: 'Signature Discord tidak valid.' }, 401);
    }

    let interaction;

    try {
      interaction = JSON.parse(rawBody);
    } catch {
      return json({ error: 'Body JSON tidak valid.' }, 400);
    }

    try {
      const response = await handleInteraction(interaction);
      return json(response);
    } catch (error) {
      console.error('Gagal memproses interaction:', error);
      return json({ error: 'Terjadi kesalahan pada bot.' }, 500);
    }
  },
};
