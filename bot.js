import {
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
} from 'discord-interactions';

// Daftar slash command yang dikirim ke Discord oleh `npm run register`.
export const commands = [
  { name: 'ping', description: 'Mengecek apakah bot sedang aktif' },
  {
    name: 'halo',
    description: 'Menyapa kamu atau seseorang',
    options: [
      {
        name: 'nama',
        description: 'Nama orang yang ingin disapa',
        type: 3,
        required: false,
      },
    ],
  },
  { name: 'help', description: 'Menampilkan daftar perintah bot' },
  {
    name: 'kirim',
    description: 'Mengirim pesan ke channel tujuan SEBAGAI AKUN DISCORD kamu',
    default_member_permissions: '32',
    options: [
      {
        name: 'pesan',
        description: 'Pesan yang ingin dikirim',
        type: 3,
        required: true,
        max_length: 2000,
      },
    ],
  },
];

// Simulasi User-Agent desktop Discord agar request dengan user token tidak
// dianggap anomali.
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9164 Chrome/120.0.6099.291 Electron/28.3.1 Safari/537.36';

function message(content, { ephemeral = false } = {}) {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content,
      ...(ephemeral ? { flags: InteractionResponseFlags.EPHEMERAL } : {}),
    },
  };
}

function getOption(interaction, optionName) {
  return interaction.data?.options?.find((o) => o.name === optionName)?.value;
}

/**
 * Kirim pesan ke channel sebagai akun user (DISCORD_USER_TOKEN).
 * Fallback ke bot token jika user token belum diisi.
 */
export async function sendChannelMessage(content) {
  const channelId = process.env.CHANNEL_ID;
  const userToken = process.env.DISCORD_USER_TOKEN;
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const token = userToken || botToken;

  if (!channelId || !token) {
    throw new Error(
      'CHANNEL_ID / token belum dikonfigurasi (butuh DISCORD_USER_TOKEN).',
    );
  }

  const usingUserToken = Boolean(userToken);
  const headers = {
    Authorization: usingUserToken ? userToken : `Bot ${botToken}`,
    'Content-Type': 'application/json',
  };
  if (usingUserToken) headers['User-Agent'] = USER_AGENT;

  const response = await fetch(
    `https://discord.com/api/v10/channels/${encodeURIComponent(channelId)}/messages`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        content,
        allowed_mentions: { parse: [] },
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Discord API ${response.status}: ${errorBody}`);
  }

  return response.json();
}

export async function handleInteraction(interaction) {
  if (interaction.type === InteractionType.PING) {
    return { type: InteractionResponseType.PONG };
  }

  if (interaction.type !== InteractionType.APPLICATION_COMMAND) {
    return message('Jenis interaksi ini belum didukung.', { ephemeral: true });
  }

  const commandName = interaction.data?.name;

  if (commandName === 'ping') {
    return message('Pong! Bot aktif dan berjalan di Vercel. 🏓');
  }

  if (commandName === 'halo') {
    const displayName =
      getOption(interaction, 'nama') ||
      interaction.member?.nick ||
      interaction.member?.user?.global_name ||
      interaction.user?.global_name ||
      interaction.member?.user?.username ||
      interaction.user?.username ||
      'teman';
    return message(`Halo, ${displayName}! 👋`);
  }

  if (commandName === 'kirim') {
    const content = getOption(interaction, 'pesan');

    try {
      await sendChannelMessage(content);
      return message(
        `Pesan terkirim sebagai akun kamu ke <#${process.env.CHANNEL_ID}>.`,
        { ephemeral: true },
      );
    } catch (error) {
      console.error('Gagal mengirim pesan ke channel:', error);
      return message(
        'Pesan gagal dikirim. Cek CHANNEL_ID, DISCORD_USER_TOKEN, dan pastikan akunmu ada di channel itu.',
        { ephemeral: true },
      );
    }
  }

  if (commandName === 'help') {
    return message(
      [
        '**Daftar command**',
        '`/ping` — cek status bot',
        '`/halo [nama]` — kirim sapaan',
        '`/kirim pesan:<teks>` — kirim pesan sebagai akunmu',
        '`/help` — tampilkan bantuan',
        '',
        'Pesan dari `/kirim` dan auto-send muncul sebagai **akun Discord kamu sendiri**, bukan bot.',
      ].join('\n'),
      { ephemeral: true },
    );
  }

  return message('Command tidak ditemukan.', { ephemeral: true });
}
