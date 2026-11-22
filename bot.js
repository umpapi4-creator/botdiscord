import {
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
} from 'discord-interactions';

// Daftar slash command yang dikirim ke Discord oleh `npm run register`.
export const commands = [
  {
    name: 'ping',
    description: 'Mengecek apakah bot sedang aktif',
  },
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
  {
    name: 'help',
    description: 'Menampilkan daftar perintah bot',
  },
  {
    name: 'kirim',
    description: 'Mengirim pesan ke channel tujuan',
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

function message(content, { ephemeral = false } = {}) {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content,
      ...(ephemeral
        ? { flags: InteractionResponseFlags.EPHEMERAL }
        : {}),
    },
  };
}

function getOption(interaction, optionName) {
  return interaction.data?.options?.find(
    (option) => option.name === optionName,
  )?.value;
}

export async function sendChannelMessage(content) {
  const channelId = process.env.CHANNEL_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!channelId || !botToken) {
    throw new Error('CHANNEL_ID atau DISCORD_BOT_TOKEN belum dikonfigurasi.');
  }

  const response = await fetch(
    `https://discord.com/api/v10/channels/${encodeURIComponent(channelId)}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        // Mencegah teks pengguna memicu @everyone, @here, atau mention lainnya.
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
  // Discord mengirim PING saat Interactions Endpoint URL disimpan.
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
        `Pesan berhasil dikirim ke <#${process.env.CHANNEL_ID}>.`,
        { ephemeral: true },
      );
    } catch (error) {
      console.error('Gagal mengirim pesan ke channel:', error);
      return message(
        'Pesan gagal dikirim. Periksa CHANNEL_ID, bot token, dan izin channel.',
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
        '`/kirim pesan:<teks>` — kirim pesan ke channel tujuan',
        '`/help` — tampilkan bantuan',
      ].join('\n'),
      { ephemeral: true },
    );
  }

  return message('Command tidak ditemukan.', { ephemeral: true });
}
