import { CommandContext, SlashCommand, SlashCreator } from 'slash-create';
import prisma from '../lib/prisma';

export class DestroyCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'destroy',
      description: 'Destroy server data',
      requiredPermissions: ['MANAGE_GUILD'],
    });
  }

  async run(ctx: CommandContext) {
    ctx.defer();
    const guildId = ctx.guildID;
    if (!guildId) {
      return ctx.editOriginal('This command can only be used in a server');
    }
    const guild = await prisma.guild.findFirst({
      where: { id: guildId },
      include: { TimestampConfig: { include: { Templates: true } } },
    });
    if (!guild) {
      return ctx.editOriginal('This server is not initialized');
    }
    await prisma.guild.delete({ where: { id: guildId } });
    await ctx.editOriginal('Server data destroyed');
  }
}
