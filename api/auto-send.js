import { sendChannelMessage } from '../bot.js';

function json(data, status = 200) {
  return Response.json(data, { status });
}

export default {
  async fetch(request) {
    if (request.method !== 'GET' && request.method !== 'POST') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: { Allow: 'GET, POST' },
      });
    }

    const cronSecret = process.env.CRON_SECRET;
    const authorization = request.headers.get('authorization');

    // Gagal secara aman jika secret belum dikonfigurasi atau tidak cocok.
    if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const content = process.env.AUTO_MESSAGE?.trim();

    if (!content) {
      return json({ error: 'AUTO_MESSAGE belum dikonfigurasi.' }, 500);
    }

    try {
      const sentMessage = await sendChannelMessage(content);

      return json({
        ok: true,
        messageId: sentMessage.id,
        channelId: sentMessage.channel_id ?? process.env.CHANNEL_ID,
      });
    } catch (error) {
      console.error('Pengiriman pesan otomatis gagal:', error);
      return json({ error: 'Pengiriman pesan otomatis gagal.' }, 502);
    }
  },
};
