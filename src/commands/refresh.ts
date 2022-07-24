import { CommandContext, SlashCommand, SlashCreator } from 'slash-create';
import sendTimestamp from '../timestamp';

export class RefreshCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'refresh',
      description: 'Refresh timestamp',
      requiredPermissions: ['MANAGE_GUILD'],
    });
  }

  async run(ctx: CommandContext) {
    ctx.send('Will refresh shortly');
    sendTimestamp()
      .then(() => void console.log('Done'))
      .catch(e => void console.error(e));
  }
}
