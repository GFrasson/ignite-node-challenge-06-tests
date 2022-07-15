import { app } from './app';
import createConnection from './database';

(async () => await createConnection())();

app.listen(3333, () => { console.log('Server is running') });
