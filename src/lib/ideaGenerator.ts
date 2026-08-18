import { TOPICS, type ContentFormat, type ContentIdea, type Platform, type Topic } from '../types'
import { generateId } from './id'
import { randomTrend, trendsForTopic } from './competitors'
import type { db } from '../db/db'

interface IdeaTemplate {
  title: (topic: string) => string
  hook: (topic: string) => string
  description: (topic: string) => string
}

const SHORT_TEMPLATES: IdeaTemplate[] = [
  {
    title: (t) => `3 ${t} moments you missed this week`,
    hook: (t) => `Wait, did you catch this ${t} clip?`,
    description: (t) => `Fast cut countdown of 3 standout ${t} moments from the last 7 days, ending on the biggest one.`,
  },
  {
    title: (t) => `The ${t} rule casual fans don't know`,
    hook: (t) => `Most fans have no idea this ${t} rule exists.`,
    description: (t) => `A single confusing ${t} regulation explained in plain English with an on-screen example.`,
  },
  {
    title: (t) => `${t} onboard vs TV camera comparison`,
    hook: (_t) => `This is why onboard footage changes everything.`,
    description: (t) => `Split-screen comparison showing the same ${t} moment from onboard and broadcast angles.`,
  },
  {
    title: (t) => `Hot take: this ${t} storyline is overrated`,
    hook: (_t) => `Unpopular opinion incoming.`,
    description: (t) => `A punchy, opinionated take on a current ${t} talking point, inviting comments to disagree.`,
  },
  {
    title: (t) => `${t} beginner mistake #1`,
    hook: (t) => `If you're new to ${t}, avoid this.`,
    description: (t) => `One common misconception new ${t} fans have, corrected in under 30 seconds.`,
  },
  {
    title: (t) => `Rating every ${t} livery this season`,
    hook: (_t) => `Tier list time.`,
    description: (t) => `Rapid-fire ranking of current ${t} liveries or team colors with quick verdicts.`,
  },
]

const LONG_TEMPLATES: IdeaTemplate[] = [
  {
    title: (t) => `The complete beginner's guide to ${t}`,
    hook: (t) => `Everything you need to actually understand ${t}.`,
    description: (t) => `A structured explainer walking a total newcomer through how ${t} works, its calendar, and why it matters.`,
  },
  {
    title: (t) => `How ${t} teams actually make decisions on race day`,
    hook: (_t) => `The strategy calls nobody talks about.`,
    description: (t) => `Deep dive into the decision-making process behind a recent ${t} event, using real examples.`,
  },
  {
    title: (t) => `Ranking every era of ${t}`,
    hook: (_t) => `From the earliest days to now.`,
    description: (t) => `A retrospective long-form video ranking eras/generations of ${t} with historical footage references.`,
  },
  {
    title: (t) => `What it actually costs to compete in ${t}`,
    hook: (_t) => `The real numbers behind the sport.`,
    description: (t) => `Breaking down budgets, sponsorship, and cost structures in ${t} for viewers curious about the business side.`,
  },
  {
    title: (t) => `The most controversial ${t} decision ever, explained`,
    hook: (_t) => `Still debated to this day.`,
    description: (t) => `A researched deep-dive into a famous controversial ${t} moment, presenting multiple perspectives.`,
  },
  {
    title: (t) => `Predicting the next 5 years of ${t}`,
    hook: (_t) => `Where is this sport heading?`,
    description: (t) => `Analysis-driven predictions about regulation changes, technology, and storylines shaping ${t}.`,
  },
]

function engagementScore(views: number, likes: number, comments: number, shares: number): number {
  return views + likes * 3 + comments * 5 + shares * 4
}

export async function computeTopicWeights(database: typeof db): Promise<Record<Topic, number>> {
  const snapshots = await database.analyticsSnapshots.toArray()
  const base: Record<string, number> = {}
  TOPICS.forEach((t) => (base[t] = 1))

  if (snapshots.length === 0) {
    return base as Record<Topic, number>
  }

  const totals: Record<string, { score: number; count: number }> = {}
  for (const s of snapshots) {
    const score = engagementScore(s.views, s.likes, s.comments, s.shares)
    if (!totals[s.topic]) totals[s.topic] = { score: 0, count: 0 }
    totals[s.topic].score += score
    totals[s.topic].count += 1
  }

  const avgScores = Object.entries(totals).map(([topic, v]) => ({ topic, avg: v.score / v.count }))
  const maxAvg = Math.max(...avgScores.map((a) => a.avg), 1)

  const weights: Record<string, number> = {}
  TOPICS.forEach((t) => {
    const found = avgScores.find((a) => a.topic === t)
    // Floor of 0.35 keeps broad discovery alive even once one topic dominates.
    weights[t] = found ? 0.35 + 0.65 * (found.avg / maxAvg) : 0.35
  })
  return weights as Record<Topic, number>
}

function weightedPick<T extends string>(weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][]
  const total = entries.reduce((sum, [, w]) => sum + w, 0)
  let roll = Math.random() * total
  for (const [key, w] of entries) {
    roll -= w
    if (roll <= 0) return key
  }
  return entries[entries.length - 1][0]
}

function platformsForFormat(format: ContentFormat): Platform[] {
  return format === 'short'
    ? ['youtube_shorts', 'instagram', 'x', 'facebook']
    : ['youtube', 'facebook']
}

export async function generateIdeas(database: typeof db, count = 6): Promise<ContentIdea[]> {
  const weights = await computeTopicWeights(database)
  const ideas: ContentIdea[] = []

  for (let i = 0; i < count; i++) {
    const topic = weightedPick(weights)
    const format: ContentFormat = Math.random() < 0.6 ? 'short' : 'long'
    const templates = format === 'short' ? SHORT_TEMPLATES : LONG_TEMPLATES
    const template = templates[Math.floor(Math.random() * templates.length)]

    const relevantTrends = trendsForTopic(topic)
    const useInspiration = Math.random() < 0.6
    const trend = useInspiration ? (relevantTrends[0] ?? (Math.random() < 0.3 ? randomTrend() : undefined)) : undefined

    ideas.push({
      id: generateId(),
      title: template.title(topic),
      hook: template.hook(topic),
      description: template.description(topic),
      topic,
      format,
      suggestedPlatforms: platformsForFormat(format),
      inspiration: trend
        ? `Inspiration, not a copy: ${trend.creator} has been getting traction on ${trend.platform.replace('_', ' ')} with ${trend.whyItWorks} — try your own spin on that angle.`
        : undefined,
      liked: false,
      createdAt: new Date().toISOString(),
    })
  }

  return ideas
}
