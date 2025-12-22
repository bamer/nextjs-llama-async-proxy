import { createServer } from 'http';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(3000, (err) => {
    if (err) {
      console.error('Error starting server:', err);
      process.exit(1);
    }
    console.log('> Ready on http://localhost:3000');
  });
}).catch((err) => {
  console.error('Error preparing Next.js app:', err);
  process.exit(1);
});