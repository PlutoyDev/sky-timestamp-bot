import { APIGuildChannel, APIWebhook, ChannelType, GuildChannelType, Routes } from 'discord-api-types/v10';
import { CommandContext, ComponentType, SlashCommand, SlashCreator } from 'slash-create';
import { DiscordRest } from '../lib/discordRest';
import { prisma } from '../lib/prisma';

export class InitCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'init',
      description: 'Initialize the bot in this server',
      requiredPermissions: ['MANAGE_GUILD'],
    });
  }

  async run(ctx: CommandContext) {
    ctx.defer();
    const guildId = ctx.guildID;
    if (!guildId) {
      return ctx.editOriginal('This command can only be used in a server');
    }
    const guild = await prisma.guild.findFirst({ where: { id: guildId } });
    if (guild) {
      ctx.editOriginal({
        content: `This server (${guildId}) had been already initialized.
To change the the timestamp channel use \`/config timestamp channel\`
\`/help\` for commands list`,
      });
    } else {
      await prisma.guild.create({
        data: {
          id: guildId,
        },
      });
      const channels = (await DiscordRest.get(Routes.guildChannels(guildId))) as APIGuildChannel<GuildChannelType>[];
      const textChannelsSelect = channels
        .filter(c => c.type === ChannelType.GuildText || c.type === ChannelType.GuildNews)
        .map(c => ({ value: c.id, label: c.name })) as { value: string; label: string }[];

      await ctx.editOriginal({
        content: `This server (${guildId}) is now initialized.`,
      });

      await ctx.sendFollowUp({
        content: 'Please select a channel to use for the timestamp:',
        components: [
          {
            type: ComponentType.ACTION_ROW,
            components: [
              {
                type: ComponentType.SELECT,
                custom_id: `${guildId}-timestamp-channel`,
                options: textChannelsSelect,
              },
            ],
          },
        ],
      });

      ctx.registerComponent(`${guildId}-timestamp-channel`, async cctx => {
        const channelId = cctx.values[0];
        if (channelId) {
          const { id: webhookID, token: webhookToken } = (await DiscordRest.post(Routes.channelWebhooks(channelId), {
            reason: `@${ctx.user.username} has initialized the bot`,
            body: { name: 'Timestampy' },
          })) as Required<APIWebhook>;

          const webhook = await prisma.webhook.create({
            data: {
              id: webhookID,
              token: webhookToken,
              channelId: channelId,
              Guild: {
                connect: {
                  id: guildId,
                },
              },
              TimestampConfig: {
                connectOrCreate: {
                  where: {
                    id: guildId,
                  },
                  create: {
                    Guild: {
                      connect: {
                        id: guildId,
                      },
                    },
                  },
                },
              },
            },
            include: {
              TimestampConfig: true,
            },
          });

          const configId = webhook.TimestampConfig?.id;

          await ctx.send('Timestamp channel updated');

          if (!configId) {
            return ctx.send('Something went wrong, please try again');
          }

          const defaultTmpl = await prisma.template.findMany({
            where: {
              configId: '@default',
            },
            select: {
              recordKey: true,
              template: true,
            },
          });

          if (defaultTmpl) {
            await prisma.template.createMany({
              skipDuplicates: true,
              data: defaultTmpl.map(t => ({ configId, ...t })),
            });

            await ctx.sendFollowUp('Default template has been applied.\nTo change it use `/config timestamp template`');
          }
        }
        ctx.unregisterComponent(`${guildId}-timestamp-channel`);
      });
    }
  }
}
