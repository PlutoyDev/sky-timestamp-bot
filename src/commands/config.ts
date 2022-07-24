import { APIMessage, APIWebhook, Routes } from 'discord-api-types/v10';
import { MessageButtonStyles, MessageComponentTypes } from 'discord.js/typings/enums';
import {
  ButtonStyle,
  ChannelType,
  CommandContext,
  CommandOptionType,
  ComponentContext,
  ComponentType,
  SlashCommand,
  SlashCreator,
} from 'slash-create';
import { RecordType } from '../../prisma/build';
import { DiscordRest } from '../lib/discordRest';
import prisma from '../lib/prisma';
import redis from '../lib/redis';
import { replacer } from '../timestamp/template';
export class ConfigCommand extends SlashCommand {
  recordsOptions: { label: string; value: string }[] = [];

  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'config',
      description: `Configure the bot's feature`,
      requiredPermissions: ['MANAGE_GUILD'],
      options: [
        {
          type: CommandOptionType.SUB_COMMAND_GROUP,
          name: 'timestamp',
          description: "Configure Bot's Timestamp function",
          options: [
            {
              type: CommandOptionType.SUB_COMMAND,
              name: 'channel',
              description: "Configure channel for Bot's Timestamp",
              options: [
                {
                  type: CommandOptionType.CHANNEL,
                  name: 'channel',
                  required: true,
                  description: 'Channel where the timestamp will be sent',
                  channel_types: [ChannelType.GUILD_TEXT],
                },
              ],
            },
            {
              type: CommandOptionType.SUB_COMMAND,
              name: 'template',
              description: "Configure message template for Bot's Timestamp",
            },
          ],
        },
      ],
    });
    prisma.record
      .findMany({
        where: {
          OR: [
            {
              type: {
                equals: RecordType.Recur,
              },
            },
            {
              start: {
                gte: new Date(),
              },
              end: {
                gte: new Date(),
              },
            },
          ],
        },
      })
      .then(records => {
        this.recordsOptions = records.map(({ key, name }) => ({
          label: name,
          value: key,
        }));
        this.recordsOptions.unshift({ label: 'Main', value: 'main' });
      });
  }

  async run(ctx: CommandContext) {
    await ctx.defer();
    const {
      subcommands: [feature, prop],
      options,
      guildID: guildId,
      channelID: channelId,
      user: { id: authorId, username },
    } = ctx;
    if (guildId == undefined) {
      return ctx.send('This command can only be used in a server');
    }
    const guild = await prisma.guild.findUnique({ where: { id: guildId } });
    const args = options[feature][prop];

    if (guild == undefined) {
      return ctx.send(`The guild ${guildId} does not exist`);
    }

    if (feature == 'timestamp') {
      const timestampConfig =
        (await prisma.timestampConfig.findUnique({
          where: { guildId: guildId },
        })) ??
        (await prisma.timestampConfig.create({
          data: {
            Guild: {
              connect: {
                id: guildId,
              },
            },
          },
        }));

      if (prop === 'channel') {
        const selChannelID = args.channel as string;
        const reason = `@${username} changed the timestamp channel`;
        const existingWebhook =
          (timestampConfig.webhookId &&
            (await prisma.webhook.findUnique({ where: { id: timestampConfig.webhookId } }))) ||
          null;

        if (existingWebhook && existingWebhook.channelId === selChannelID) {
          return ctx.send('This channel is already set as timestamp channel, nothing has been changed');
        }

        if (existingWebhook) {
          console.log('deleting existing webhook');

          await Promise.all([
            DiscordRest.delete(Routes.webhook(existingWebhook.id), { reason }),
            prisma.message
              .deleteMany({ where: { webhookId: existingWebhook.id } })
              .then(() => prisma.webhook.delete({ where: { id: existingWebhook.id } }))
              .catch(console.error),
          ]);

          console.log('deleted existing webhook');
        }

        const { id: webhookID, token: webhookToken } = (await DiscordRest.post(Routes.channelWebhooks(selChannelID), {
          reason,
          body: { name: 'Timestampy' },
        })) as Required<APIWebhook>;

        await prisma.webhook.create({
          data: {
            id: webhookID,
            token: webhookToken,
            channelId: selChannelID,
            Guild: {
              connect: {
                id: guildId,
              },
            },
            TimestampConfig: {
              connect: {
                guildId: guildId,
              },
            },
          },
        });

        return ctx.send('Timestamp channel updated');
      } else if (prop === 'template') {
        const cacheKey = `template-${guildId}-${channelId}-${authorId}`;
        const existing = await redis.get(cacheKey);
        if (existing) {
          return ctx.send(`You are already editing a template`);
        }

        await ctx.send({
          content: `Select which template you want to edit`,
          components: [
            {
              type: ComponentType.ACTION_ROW,
              components: [
                {
                  type: ComponentType.SELECT,
                  custom_id: `config-timestamp-template`,
                  options: this.recordsOptions,
                },
              ],
            },
          ],
        });
        //         const configId = timestampConfig.id;
        //         const recordKey = args.key;

        //         const cacheKey = `template-${guildId}-${channelId}-${authorId}`;
        //         const existingPr = redis.get(cacheKey);
        //         const template = await prisma.template.findFirst({
        //           where: {
        //             Config: {
        //               Guild: {
        //                 id: guildId,
        //               },
        //             },
        //             recordKey,
        //           },
        //         });

        //         const prevTmpl = template?.template ?? '';
        //         const cacheValue: EditorCacheData = {
        //           guildId,
        //           channelId,
        //           authorId,
        //           configId,
        //           recordKey,
        //           prevTmpl,
        //           newTmpl: '',
        //         };

        //         console.log(cacheValue);

        //         if (await existingPr) {
        //           return ctx.send(`You are already editing a template`);
        //         }

        //         await redis.setEx(cacheKey, 900, JSON.stringify(cacheValue));
        //         await ctx.send({
        //           content: `Please send a new template for ${recordKey}\nAfterwards continue editing and refine the template by editing your message`,
        //           components: [
        //             {
        //               type: ComponentType.ACTION_ROW,
        //               components: [
        //                 {
        //                   type: ComponentType.BUTTON,
        //                   style: ButtonStyle.DESTRUCTIVE,
        //                   custom_id: 'template-discard',
        //                   label: 'Cancel',
        //                   emoji: {
        //                     name: '🚫',
        //                     animated: false,
        //                   },
        //                 },
        //               ],
        //             },
        //           ],
        //         });
        //         await ctx.sendFollowUp({
        //           content: `Your current template is
        // \`\`\`
        // ${prevTmpl}
        // \`\`\``,
        //         });
      }
    }
  }
}

export async function templateEditorStart(cctx: ComponentContext) {
  cctx.defer();
  const {
    guildID: guildId,
    channelID: channelId,
    user: { id: authorId },
    values: [recordKey],
  } = cctx;

  if (!guildId) {
    return cctx.send('This command can only be used in a server');
  }

  // const config = await prisma.timestampConfig.findUnique({
  //   where: { guildId },
  // })

  const config = await prisma.timestampConfig.upsert({
    where: { guildId },
    update: {},
    create: {
      Guild: {
        connect: {
          id: guildId,
        },
      },
    },
  });

  const configId = config.id;

  const cacheKey = `template-${guildId}-${channelId}-${authorId}`;
  const template = await prisma.template.findFirst({
    where: {
      Config: {
        Guild: {
          id: guildId,
        },
      },
      recordKey,
    },
  });

  const prevTmpl = template?.template ?? '';
  const cacheValue: EditorCacheData = {
    guildId,
    channelId,
    authorId,
    configId,
    recordKey,
    prevTmpl,
    newTmpl: '',
  };

  console.log(cacheValue);

  await redis.setEx(cacheKey, 900, JSON.stringify(cacheValue));
  await cctx.editParent({
    content: `Please send a new template for ${recordKey}\nAfterwards continue editing and refine the template by editing your message`,
    components: [
      {
        type: ComponentType.ACTION_ROW,
        components: [
          {
            type: ComponentType.BUTTON,
            style: ButtonStyle.DESTRUCTIVE,
            custom_id: 'template-discard',
            label: 'Cancel',
            emoji: {
              name: '🚫',
              animated: false,
            },
          },
        ],
      },
    ],
  });
  await cctx.sendFollowUp({
    content: `Your current template is
\`\`\`
${prevTmpl}
\`\`\``,
  });
}

interface EditorArgs {
  guildId: string;
  channelId: string;
  messageId: string;
  authorId: string;
  content: string;
}

interface EditorCacheData {
  guildId: string;
  channelId: string;
  authorId: string;
  configId: string;
  recordKey: string;
  prevTmpl: string;
  newTmpl: string;
  authorMessageId?: string;
  botMessageId?: string;
}

export async function templateEditorRun({ guildId, channelId, authorId, messageId, content }: EditorArgs) {
  const cacheKey = `template-${guildId}-${channelId}-${authorId}`;
  const cacheValue = await redis.get(cacheKey);
  if (!cacheValue) {
    return false;
  }

  const data = JSON.parse(cacheValue) as EditorCacheData;
  data.newTmpl = content;

  content = await renderFromCache(content, data.recordKey);

  const replyBody = {
    content,
    components: [
      {
        type: MessageComponentTypes.ACTION_ROW,
        components: [
          {
            type: MessageComponentTypes.BUTTON,
            style: MessageButtonStyles.PRIMARY,
            custom_id: 'template-save',
            label: 'Save',
            emoji: {
              id: null,
              name: '💾',
              animated: false,
            },
          },
          {
            type: MessageComponentTypes.BUTTON,
            style: MessageButtonStyles.DANGER,
            custom_id: 'template-discard',
            label: 'Discard',
            emoji: {
              id: null,
              name: '🚫',
              animated: false,
            },
          },
        ],
      },
    ],
    message_reference: {
      message_id: messageId,
      guild_id: guildId,
      fail_if_not_exists: false,
    },
  };

  if (!data.botMessageId || messageId !== data.authorMessageId) {
    if (data.botMessageId) {
      DiscordRest.delete(Routes.channelMessage(channelId, data.botMessageId));
    }

    const reply = (await DiscordRest.post(Routes.channelMessages(channelId), {
      body: replyBody,
    })) as APIMessage;

    data.botMessageId = reply.id;
    data.authorMessageId = messageId;
  } else {
    (await DiscordRest.patch(Routes.channelMessage(channelId, data.botMessageId), {
      body: replyBody,
    })) as APIMessage;
  }
  await redis.setEx(cacheKey, 900, JSON.stringify(data));
  return true;
}

async function renderFromCache(template: string, recordKey: string) {
  const cacheKeyPrefix = `timestamp_${recordKey}_`;
  const prefixLen = cacheKeyPrefix.length;
  const cacheKeys = await redis.keys(cacheKeyPrefix + '*');
  const cacheValues = (await Promise.all(
    cacheKeys.map(async key => {
      return await redis.get(key);
    }),
  )) as string[];
  const cache = cacheKeys.reduce((acc, key, i) => {
    key = key.substring(prefixLen);
    const value = cacheValues[i];
    if (value === 'null') {
      return acc;
    } else if (value.includes(',')) {
      acc[key] = value.split(',').map(parseInt);
    } else {
      acc[key] = parseInt(value);
    }
    return acc;
  }, {} as Record<string, any>);

  console.log(cache);

  return replacer(template, cache);
}

export async function templateEditorSave(ctx: ComponentContext) {
  const {
    guildID: guildId,
    channelID: channelId,
    user: { id: authorId },
    message: { content },
  } = ctx;
  const cacheKey = `template-${guildId}-${channelId}-${authorId}`;
  const cacheValue = await redis.get(cacheKey);
  if (!cacheValue) {
    return ctx.send('You are not editing a template');
  }

  const data = JSON.parse(cacheValue) as EditorCacheData;
  await prisma.template.upsert({
    create: {
      template: data.newTmpl,
      recordKey: data.recordKey,
      Config: {
        connect: {
          id: data.configId,
        },
      },
    },
    update: {
      template: data.newTmpl,
    },
    where: {
      configId_recordKey: {
        configId: data.configId,
        recordKey: data.recordKey,
      },
    },
  });

  await redis.del(cacheKey);

  return ctx.editParent({ content: `Template saved`, components: [] });
}

export async function templateEditorDiscard(ctx: ComponentContext) {
  const {
    guildID: guildId,
    channelID: channelId,
    user: { id: authorId },
  } = ctx;
  const cacheKey = `template-${guildId}-${channelId}-${authorId}`;
  const cacheValue = await redis.get(cacheKey);
  if (!cacheValue) {
    return ctx.send('You are not editing a template');
  }

  const data = JSON.parse(cacheValue) as EditorCacheData;
  await redis.del(cacheKey);
  if (data.botMessageId) {
    DiscordRest.delete(Routes.channelMessage(channelId, data.botMessageId));
  }
  return ctx.send(`Template discarded`);
}

/* 
const features = ['main', 'recur', 'event'];
const configsOption: Record<string, ApplicationCommandOption[] | undefined> = {
  template: undefined,
  channel: [
    {
      type: CommandOptionType.CHANNEL,
      name: 'channel',
      description: 'The channel where the timestamp will be sent (default to current channel)',
      channel_types: [ChannelType.GUILD_TEXT, ChannelType.GUILD_NEWS],
    },
  ],
};

const options = features.map(feature => ({
  type: CommandOptionType.SUB_COMMAND_GROUP,
  name: feature,
  description: `Configure the ${feature} timestamp feature`,
  options: Object.entries(configsOption).map(([config, options]) => ({
    type: CommandOptionType.SUB_COMMAND,
    name: config,
    description: `Set the ${config} for ${feature} timestamp`,
    options,
  })),
})),
 */
