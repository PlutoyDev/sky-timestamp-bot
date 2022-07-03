import { SlashCommand, SlashCreator, CommandContext } from 'slash-create';
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
        content: `This server (${guildId}) had been already initialized.`,
      });
    } else {
      await prisma.guild.create({
        data: {
          id: guildId,
        },
      });
      ctx.editOriginal({
        content: `This server (${guildId}) is now initialized.`,
      });
    }
  }
}
