import { RecordType } from '../prisma/build';
import prisma from './lib/prisma';

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

seedRecords().then(() => console.log('Records seeded'));
