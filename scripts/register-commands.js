import 'dotenv/config';
import { commands } from '../bot.js';

const applicationId = process.env.DISCORD_APPLICATION_ID;
const botToken = process.env.DISCORD_BOT_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID;

if (!applicationId || !botToken) {
  console.error(
    'Isi DISCORD_APPLICATION_ID dan DISCORD_BOT_TOKEN di file .env terlebih dahulu.',
  );
  process.exit(1);
}

const baseUrl = `https://discord.com/api/v10/applications/${applicationId}`;
const endpoint = guildId
  ? `${baseUrl}/guilds/${guildId}/commands`
  : `${baseUrl}/commands`;

console.log(
  guildId
    ? `Mendaftarkan command ke server ${guildId}...`
    : 'Mendaftarkan command secara global...',
);

const response = await fetch(endpoint, {
  method: 'PUT',
  headers: {
    Authorization: `Bot ${botToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(commands),
});

const result = await response.json();

if (!response.ok) {
  console.error('Discord menolak registrasi command:', result);
  process.exit(1);
}

console.log(`${result.length} command berhasil didaftarkan.`);
