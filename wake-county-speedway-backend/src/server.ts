import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { contentRouter } from './routes/content';
import { livestreamRouter } from './routes/livestream';
import { checkoutRouter, stripeWebhookRouter } from './routes/checkout';

const app = express();

app.use(cors());

// Stripe needs the raw, unparsed body to verify webhook signatures, so this
// route is mounted before express.json() touches the body.
app.use('/webhooks/stripe', stripeWebhookRouter);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use(contentRouter);
app.use(livestreamRouter);
app.use('/checkout', checkoutRouter);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`Wake County Speedway backend listening on :${port}`);
});
