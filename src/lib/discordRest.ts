import { REST } from '@discordjs/rest';
import { DISCORD_BOT_TOKEN, NODE_ENV } from './enviroment';

const DiscordRestGlobal = global as typeof global & {
  DiscordRest: REST;
};

export const DiscordRest =
  DiscordRestGlobal.DiscordRest ||
  new REST({
    version: '10',
  }).setToken(DISCORD_BOT_TOKEN);

export const setTokenAsBot = () => {
  DiscordRest.setToken(DISCORD_BOT_TOKEN);
};

if (DiscordRest.listenerCount('rateLimited') === 0) {
  if (NODE_ENV !== 'production') {
    DiscordRestGlobal.DiscordRest = DiscordRest;

    DiscordRest.on('response', async (req, res) => {
      console.log(`<< ${res.statusCode} ${req.route}`);
    });

    DiscordRest.on('restDebug', info => {
      console.log('Discord API', info);
    });
  }

  DiscordRest.on('rateLimited', info => {
    console.log('Discord API - Rate Limited', info);
  });
}
