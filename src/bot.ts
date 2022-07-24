import { Client, Message, PartialMessage } from 'discord.js';
import { GatewayServer, SlashCreator } from 'slash-create';
import { DISCORD_APP_ID, DISCORD_PUBLIC_KEY, DISCORD_BOT_TOKEN } from './lib/enviroment';
import { InitCommand, initTimestampChannelSelect } from './commands/init';
import {
  ConfigCommand,
  templateEditorDiscard,
  templateEditorRun,
  templateEditorSave,
  templateEditorStart,
} from './commands/config';
import * as cron from 'node-cron';
import sendTimestamp from './timestamp';
import { DestroyCommand } from './commands/destroy';
import { RefreshCommand } from './commands/refresh';

cron.schedule('0 */5 * * * *', () =>
  sendTimestamp()
    .then(() => void console.log('Done'))
    .catch(e => void console.error(e)),
);

const client = new Client({
  intents: ['GUILD_MESSAGES', 'GUILDS'],
});

const creator = new SlashCreator({
  applicationID: DISCORD_APP_ID,
  publicKey: DISCORD_PUBLIC_KEY,
  token: DISCORD_BOT_TOKEN,
  client,
});

creator.on('debug', console.log);
creator.on('error', console.log);

creator
  .withServer(new GatewayServer(handler => client.ws.on('INTERACTION_CREATE', handler)))
  .registerCommands([InitCommand, DestroyCommand, RefreshCommand, ConfigCommand])
  .syncCommands({ deleteCommands: true });

creator.registerGlobalComponent('config-timestamp-template', templateEditorStart);
creator.registerGlobalComponent('template-save', templateEditorSave);
creator.registerGlobalComponent('template-discard', templateEditorDiscard);
creator.registerGlobalComponent('init-timestamp-channel', initTimestampChannelSelect);

async function onMessageCU(message: Message | PartialMessage, newMessage?: Message | PartialMessage) {
  message = newMessage ?? message;
  const { guildId, channelId, id: messageId, content } = message;
  const authorId = message.author?.id;

  if (!guildId || !channelId || !authorId || content === null) return;

  if (await templateEditorRun({ guildId, channelId, messageId, authorId, content })) return;
}

client.on('messageCreate', onMessageCU);
client.on('messageUpdate', onMessageCU);

client.login(DISCORD_BOT_TOKEN).then(() => console.log('Bot is ready'));
