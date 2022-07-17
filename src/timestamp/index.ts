import { getUnixTime } from 'date-fns';
import { APIMessage } from 'discord-api-types/v10';
import { Routes } from 'discord-api-types/v10';
import { Message, RecordType, Webhook } from '../../prisma/build';
import { DiscordRest } from '../lib/discordRest';
import prisma from '../lib/prisma';
import { calDailyReset, calEdenReset, calRecur, calTravelingSpirit, skyToUtc } from './calculate';
import { MainData, RecurData, renderMain, renderRecur } from './template';

const isPartial = process.argv.includes('partial');

(async () => {
  const date = new Date();

  const config = await prisma.timestampConfig.findMany({
    include: {
      Webhook: {
        include: {
          Message: true,
        },
      },
      Templates: true,
    },
  });
  const recurRecords = await prisma.record.findMany({
    where: {
      type: RecordType.Recur,
    },
  });

  const dailyReset = allDateToUnix(calDailyReset(date));
  const edenReset = allDateToUnix(calEdenReset(date));
  const ts = allDateToUnix(calTravelingSpirit(date));
  const recurData = recurRecords.map(record => allDateToUnix(calRecur(date, record))) as RecurData[];

  config.forEach(async c => {
    const { Templates, Webhook } = c;

    if (!Webhook) {
      console.log(`No Webhook found for ${c.guildId}`);
      return;
    }

    if (!isPartial) {
      const mainTemplate = Templates.find(({ recordKey }) => recordKey === 'main');
      if (!mainTemplate) {
        console.log(`No main template found for ${c.guildId}`);
        return;
      }
      const mainData = {
        daily_reset: dailyReset,
        eden_reset: edenReset,
        traveling_spirit: ts,
      } as MainData;
      const content = renderMain(mainData, mainTemplate);
      await sendUpdateMessage('main', content, Webhook);
    }

    const recurTemplate = Templates.filter(({ recordKey }) => recordKey.startsWith('recur'));
    const recurContent = recurData.reduce((content, data) => {
      const t = recurTemplate.find(({ recordKey }) => recordKey === data.recordKey);
      if (!t) return content;
      content += '\n\n' + renderRecur(data, t);
      return content;
    }, '');

    await sendUpdateMessage('recur', recurContent, Webhook);
  });
})();

function allDateToUnix(o: Record<string, any>) {
  Object.entries(o).forEach(([key, value]) => {
    if (value instanceof Date) {
      o[key] = getUnixTime(skyToUtc(value));
    } else if (value instanceof Array) {
      o[key] = value.map(v => getUnixTime(skyToUtc(v)));
    }
  });
  return o;
}

async function sendUpdateMessage(name: string, content: string, webhook: Webhook & { Message: Message[] }) {
  const Message = webhook.Message.find(({ usedFor }) => usedFor === name);

  if (Message) {
    try {
      await DiscordRest.patch(Routes.webhookMessage(webhook.id, webhook.token, Message.id), {
        auth: false,
        body: {
          content,
        },
      });
    } catch (e) {
      console.log(`Discord message deleted`);
      await prisma.message.delete({ where: { id: Message.id } });
      sendUpdateMessage(name, content, webhook);
    }
  } else {
    const { id: MessageId } = (await DiscordRest.post(Routes.webhook(webhook.id, webhook.token), {
      auth: false,
      query: new URLSearchParams({
        wait: 'true',
      }),
      body: {
        content,
      },
    })) as APIMessage;

    await prisma.message.create({
      data: {
        id: MessageId,
        usedFor: name,
        Webhook: {
          connect: {
            id: webhook.id,
          },
        },
      },
    });
  }
}
