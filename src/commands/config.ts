import {
  SlashCommand,
  SlashCreator,
  CommandContext,
  CommandOptionType,
  ChannelType,
  ComponentType,
  TextInputStyle,
} from 'slash-create';
import { prisma } from '../lib/prisma';

export class ConfigCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'config',
      description: `Configure the bot's feature`,
      requiredPermissions: ['MANAGE_GUILD'],
      options: [
        {
          type: CommandOptionType.SUB_COMMAND_GROUP,
          name: 'timestamp',
          description: 'Configure the timestamp feature',
          options: [
            {
              type: CommandOptionType.SUB_COMMAND,
              name: 'enable',
              description: 'Enable the timestamp feature',
            },
            {
              type: CommandOptionType.SUB_COMMAND,
              name: 'disable',
              description: 'Enable the timestamp feature',
            },
            {
              type: CommandOptionType.SUB_COMMAND,
              name: 'channel',
              description: 'Set the channel where the timestamp will be sent',
              options: [
                {
                  type: CommandOptionType.CHANNEL,
                  name: 'channel',
                  description: 'The channel where the timestamp will be sent (default to current channel)',
                  channel_types: [ChannelType.GUILD_TEXT, ChannelType.GUILD_NEWS],
                },
              ],
            },
            {
              type: CommandOptionType.SUB_COMMAND,
              name: 'template',
              description: 'Set the template of the timestamp',
            },
            {
              type: CommandOptionType.SUB_COMMAND,
              name: 'format',
              description: 'Set the format of the timestamp',
            },
          ],
        },
      ],
    });
  }

  async run(ctx: CommandContext) {
    ctx.defer();
    const guildId = ctx.guildID;
    if (!guildId) {
      return ctx.editOriginal('This command can only be used in a server');
    }
    const guild = await prisma.guild.findFirst({ where: { id: guildId } });
    if (!guild) {
      return ctx.editOriginal('This server has not been initialized yet\nUse `/init` to initialize it');
    }

    prisma.guild.findFirst({ where: { id: guildId } });

    const { subcommands, options, channelID: channelId } = ctx;
    console.log();

    ctx.editOriginal({
      content: '```json\n' + JSON.stringify({ subcommands, options }, null, 2) + '\n```',
    });

    const [sc_group, sc] = subcommands;

    if (sc === 'template') {
      ctx.sendModal({
        title: 'Timestamp Template',
        components: [
          {
            type: ComponentType.ACTION_ROW,
            components: [
              {
                type: ComponentType.TEXT_INPUT,
                label: 'Template',
                custom_id: 'template',
                style: TextInputStyle.PARAGRAPH,
                required: true,
              },
            ],
          },
        ],
      });
    }
  }
}
