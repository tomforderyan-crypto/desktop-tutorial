import { Router } from 'express';
import Mux from '@mux/mux-node';

export const livestreamRouter = Router();

/**
 * The only place the Mux secret token exists. The app fetches this route
 * and gets back just a boolean + a public playback ID — never the token
 * itself. Set MUX_TOKEN_ID / MUX_TOKEN_SECRET / MUX_LIVE_STREAM_ID once the
 * production partner's Mux live stream is provisioned; until then this
 * degrades to a static "offline" response instead of failing the request.
 */
livestreamRouter.get('/livestream/status', async (_req, res) => {
  const { MUX_TOKEN_ID, MUX_TOKEN_SECRET, MUX_LIVE_STREAM_ID } = process.env;

  if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET || !MUX_LIVE_STREAM_ID) {
    res.json({
      isLive: false,
      playbackId: null,
      streamTitle: 'Wake County Speedway Live',
    });
    return;
  }

  try {
    const mux = new Mux({ tokenId: MUX_TOKEN_ID, tokenSecret: MUX_TOKEN_SECRET });
    const stream = await mux.video.liveStreams.retrieve(MUX_LIVE_STREAM_ID);
    const playbackId = stream.playback_ids?.[0]?.id ?? null;
    res.json({
      isLive: stream.status === 'active',
      playbackId,
      streamTitle: 'Wake County Speedway Live',
    });
  } catch (err) {
    console.error('Mux live stream lookup failed', err);
    res.status(502).json({ error: 'Unable to reach Mux.' });
  }
});
