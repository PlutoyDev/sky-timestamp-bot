import { Routes } from 'discord-api-types/v10';
import { DiscordRest } from '../../lib/discordRest';
import prisma from '../../lib/prisma';

const discard = process.argv[2] === 'delete';

const reapWebhooks = async () => {
  const msgs = await prisma.message.deleteMany();
  const webhooks = await prisma.webhook.findMany();

  await Promise.all(webhooks.map(async webhook => DiscordRest.delete(Routes.webhook(webhook.id))));

  await prisma.webhook.deleteMany();
};

reapWebhooks();

const reapFromGuild = async () => {};
