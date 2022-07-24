import { RecordType } from '../../../prisma/build';
import { DEFAULT_UUID } from '../../lib/enviroment';
import prisma from '../../lib/prisma';

const clear = process.argv[2] === 'delete';

const seedRecords = async () => {
  if (clear) {
    await prisma.record.deleteMany();
  }
  await prisma.record.createMany({
    skipDuplicates: true,
    data: [
      {
        name: 'Sanctuary Geyser Wax',
        key: 'recur_geyser_sanctuary',
        type: RecordType.Recur,
        interval: 120,
        offset: 0,
        duration: 15,
        collectibleAfter: 5,
      },
      {
        name: 'Forest Grandma Dinner Wax',
        key: 'recur_dinner_forest',
        type: RecordType.Recur,
        interval: 120,
        offset: 30,
        duration: 15,
        collectibleAfter: 5,
      },
      {
        name: 'Sanctuary Turtle Wax',
        key: 'recur_turtle_sanctuary',
        type: RecordType.Recur,
        interval: 120,
        offset: 50,
        duration: 10,
      },
      {
        name: 'Shattering Shards',
        key: 'recur_shards_shattering',
        type: RecordType.Recur,
        interval: 120,
        offset: 58,
        duration: 50,
        collectibleAfter: 10,
      },
      {
        name: 'Days of Rainbow 2022',
        key: 'event_2022_rainbow_days',
        type: RecordType.Event,
        start: new Date(2022, 5, 30),
        end: new Date(2022, 6, 14),
      },
      {
        name: 'Season of Shattering',
        key: 'event_shattering_season',
        type: RecordType.Event,
        start: new Date(2022, 6, 11),
        end: new Date(2022, 8, 26),
      },
    ],
  });
};

const seedTimestampConfig = async () => {
  if (clear) {
    await prisma.timestampConfig.deleteMany();
  }
  await prisma.timestampConfig.upsert({
    where: { id: DEFAULT_UUID },
    update: {},
    create: {
      id: DEFAULT_UUID,
      Guild: {
        connectOrCreate: {
          where: { id: 'default' },
          create: { id: 'default' },
        },
      },
    },
  });
};

const seedTemplate = async () => {
  if (clear) {
    await prisma.template.deleteMany();
  }
  await seedTimestampConfig();
  await prisma.template.createMany({
    skipDuplicates: true,
    data: [
      {
        configId: DEFAULT_UUID,
        recordKey: 'main',
        template: `**__Main Game__** \${now}
Daily Reset: \${daily_reset_next} (\${daily_reset_next,R})
Eden Reset: \${eden_reset_next} (\${eden_reset_next,R})

**__Traveling Spirit \${traveling_spirit_count}__**
Arrival: \${traveling_spirit_start} (\${traveling_spirit_start,R})
Departure: \${traveling_spirit_end} (\${traveling_spirit_end,R})`,
      },
      {
        configId: DEFAULT_UUID,
        recordKey: 'recur_geyser_sanctuary',
        template: `**__Sanctuary Geyser Wax__**
\${occurrences,t,➡️}
Next: \${next} (\${next,R})
\${ongoing_until, Ongoing Until: % (%R)}`,
      },
      {
        configId: DEFAULT_UUID,
        recordKey: 'recur_dinner_forest',
        template: `**__Forest Grandma Dinner Wax__**
\${occurrences,t,➡️}
Next: \${next} (\${next,R})
\${ongoing_until, Ongoing Until: % (%R)}`,
      },
      {
        configId: DEFAULT_UUID,
        recordKey: 'recur_turtle_sanctuary',
        template: `**__Sanctuary Turtle Wax__**
\${occurrences,t,➡️}
Next: \${next} (\${next,R})
\${ongoing_until, Ongoing Until: % (%R)}`,
      },
      {
        configId: DEFAULT_UUID,
        recordKey: 'recur_shards_shattering',
        template: `**__Shattering Shards__**
\${occurrences,t,➡️}
Next: \${next} (\${next,R})
\${ongoing_until, Ongoing Until: % (%R)}`,
      },
    ],
  });
};

// seedRecords().then(() => console.log('Records seeded'));
seedRecords()
  .then(() => seedTemplate())
  .then(() => console.log('Templates seeded'));
