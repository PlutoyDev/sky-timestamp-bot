import { sleep } from './../utils/sleep';
import sendTimestamp from '.';

sendTimestamp()
  .then(() => sleep(3000))
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
