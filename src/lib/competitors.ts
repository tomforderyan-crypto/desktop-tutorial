import type { CompetitorTrend } from '../types'

// Placeholder "what's working right now" feed. In production this would be
// populated by a scraper/API job that watches public metrics of comparable
// creators (view velocity, comment growth) and refreshes periodically.
export const COMPETITOR_TRENDS: CompetitorTrend[] = [
  {
    creator: 'a mid-size F1 explainer channel',
    platform: 'youtube_shorts',
    topic: 'Formula 1',
    format: 'short',
    whyItWorks: 'quick side-by-side onboard comparisons with a one-line verdict at the end',
  },
  {
    creator: 'a rally-focused creator',
    platform: 'instagram',
    topic: 'WRC / Rally',
    format: 'short',
    whyItWorks: 'raw co-driver audio layered over slow-motion stage footage',
  },
  {
    creator: 'a NASCAR breakdown page',
    platform: 'x',
    topic: 'NASCAR',
    format: 'short',
    whyItWorks: 'posting a hot take within minutes of a race incident, before the algorithm cools off',
  },
  {
    creator: 'a sim racing streamer',
    platform: 'youtube',
    topic: 'Sim Racing',
    format: 'long',
    whyItWorks: 'setup comparison videos that double as affiliate gear reviews',
  },
  {
    creator: 'a MotoGP highlights account',
    platform: 'facebook',
    topic: 'MotoGP',
    format: 'short',
    whyItWorks: 'reposting a single dramatic overtake with captions in three languages',
  },
  {
    creator: 'an IndyCar stats nerd',
    platform: 'x',
    topic: 'IndyCar',
    format: 'short',
    whyItWorks: 'a single striking stat graphic dropped right after a session ends',
  },
  {
    creator: 'a karting coach',
    platform: 'youtube_shorts',
    topic: 'Karting',
    format: 'short',
    whyItWorks: 'pointing out one beginner mistake per clip using freeze-frame annotations',
  },
  {
    creator: 'a WEC/Le Mans historian',
    platform: 'youtube',
    topic: 'Le Mans / WEC',
    format: 'long',
    whyItWorks: 'deep-dive retrospectives timed to release right before the current race weekend',
  },
  {
    creator: 'a drift media crew',
    platform: 'instagram',
    topic: 'Drifting',
    format: 'short',
    whyItWorks: 'smoke-heavy vertical reels cut to the beat of the engine note, no music overlay',
  },
  {
    creator: 'a general motorsport news page',
    platform: 'facebook',
    topic: 'General Motorsport',
    format: 'short',
    whyItWorks: 'aggregating "this week across every series" round-ups for casual fans',
  },
  {
    creator: 'an F2/F3 feeder-series specialist',
    platform: 'youtube_shorts',
    topic: 'Formula 2',
    format: 'short',
    whyItWorks: 'spotlighting future F1 talent before the big channels notice them',
  },
]

export function trendsForTopic(topic: string): CompetitorTrend[] {
  return COMPETITOR_TRENDS.filter((t) => t.topic === topic)
}

export function randomTrend(): CompetitorTrend {
  return COMPETITOR_TRENDS[Math.floor(Math.random() * COMPETITOR_TRENDS.length)]
}
