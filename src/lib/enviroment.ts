import { config } from 'dotenv';

config();

export const NODE_ENV = process.env.NODE_ENV ?? 'development';
export const PORT = process.env.PORT ?? 2000;

export const DISCORD_APP_ID = process.env.DISCORD_APP_ID ?? '990032179604099124';
export const DISCORD_PUBLIC_KEY =
  process.env.DISCORD_PUBLIC_KEY ?? '4fb2e58f3bd89aea1be7497a4a76223c6e82af47c26e926df27158236543c416';
export const DISCORD_OAUTH_SECRET = process.env.DISCORD_OAUTH_SECRET as string;
export const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN as string;

export const REDIS_URL = process.env.REDIS_URL as string;

const requiredEnvs = {
  DISCORD_OAUTH_SECRET,
  DISCORD_BOT_TOKEN,
  REDIS_URL,
};

Object.entries(requiredEnvs).forEach(([key, value]) => {
  if (value == undefined || value == '') {
    throw new Error(`${key} is not defined`);
  }
});
