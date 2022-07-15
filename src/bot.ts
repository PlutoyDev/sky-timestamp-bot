import { Client, Message, PartialMessage } from 'discord.js';
import { GatewayServer, SlashCreator } from 'slash-create';
import { DISCORD_APP_ID, DISCORD_PUBLIC_KEY, DISCORD_BOT_TOKEN } from './lib/enviroment';
import { InitCommand } from './commands/init';
import { ConfigCommand, templateEditorDiscard, templateEditorRun, templateEditorSave } from './commands/config';

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
  .registerCommands([InitCommand, ConfigCommand])
  .syncCommands({ deleteCommands: true });

creator.registerGlobalComponent('template-save', templateEditorSave);
creator.registerGlobalComponent('template-discard', templateEditorDiscard);

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