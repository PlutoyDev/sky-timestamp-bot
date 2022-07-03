import express from 'express';
import { ExpressServer, SlashCreator } from 'slash-create';
import { DISCORD_APP_ID, DISCORD_PUBLIC_KEY, DISCORD_BOT_TOKEN, PORT } from './lib/enviroment';
import path from 'path';
import { InitCommand } from './commands/init';
import { ConfigCommand } from './commands/config';

const app = express();
app.use(express.json());

const creator = new SlashCreator({
  applicationID: DISCORD_APP_ID,
  publicKey: DISCORD_PUBLIC_KEY,
  token: DISCORD_BOT_TOKEN,
});

creator.on('debug', console.log);
// creator.on('error', console.error);

creator
  .registerCommands([InitCommand, ConfigCommand])
  .syncCommands({ deleteCommands: true })
  .withServer(new ExpressServer(app))
  .startServer();

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
