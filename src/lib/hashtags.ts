import type { Platform, Topic } from '../types'

const TOPIC_TAGS: Record<Topic, string[]> = {
  'General Motorsport': ['#Motorsport', '#Racing', '#CarsOfInstagram', '#RaceDay'],
  'Formula 1': ['#F1', '#Formula1', '#F1News', '#Grandprix'],
  'Formula 2': ['#F2', '#FormulaTwo', '#F2Racing'],
  'Formula 3': ['#F3', '#FormulaThree', '#F3Racing'],
  MotoGP: ['#MotoGP', '#Motorcycle', '#MotoGPRacing'],
  'WRC / Rally': ['#WRC', '#Rally', '#RallyCar'],
  NASCAR: ['#NASCAR', '#StockCarRacing'],
  IndyCar: ['#IndyCar', '#Indy500'],
  'Le Mans / WEC': ['#LeMans', '#WEC', '#Endurance'],
  Karting: ['#Karting', '#GoKarting', '#KartRacing'],
  Drifting: ['#Drifting', '#Drift', '#DriftCar'],
  'Sim Racing': ['#SimRacing', '#iRacing', '#Esports'],
}

const PLATFORM_TAGS: Record<Platform, string[]> = {
  youtube: ['#YouTube'],
  youtube_shorts: ['#Shorts', '#YouTubeShorts'],
  instagram: ['#Reels', '#InstagramReels'],
  facebook: ['#FacebookReels'],
  x: ['#XPost'],
}

const EVERGREEN_TAGS = ['#MotorsportContent', '#CarTok', '#RaceFan', '#TrackDay']

export function generateHashtags(topic: Topic, platform: Platform, format: 'short' | 'long'): string[] {
  const topicTags = TOPIC_TAGS[topic] ?? TOPIC_TAGS['General Motorsport']
  const platformTags = format === 'short' ? PLATFORM_TAGS[platform] : []
  const set = new Set<string>([...topicTags, ...platformTags, ...EVERGREEN_TAGS])
  return Array.from(set).slice(0, 8)
}

const CAPTION_OPENERS = [
  'You need to see this.',
  "Here's something most fans miss.",
  'Break this down with me.',
  "Let's talk about it.",
  'This one surprised me too.',
]

const CAPTION_CTAS = [
  'Drop your take below.',
  'Follow for more like this.',
  'Which side are you on? Comment below.',
  'Save this for race day.',
  'Tag someone who needs to see this.',
]

export function generateCaption(
  title: string,
  topic: Topic,
  platform: Platform,
  format: 'short' | 'long',
): string {
  const opener = CAPTION_OPENERS[Math.floor(Math.random() * CAPTION_OPENERS.length)]
  const cta = CAPTION_CTAS[Math.floor(Math.random() * CAPTION_CTAS.length)]
  const hashtags = generateHashtags(topic, platform, format).join(' ')
  const body = format === 'short' ? title : `${title} — full breakdown in this video.`
  return `${opener} ${body}\n\n${cta}\n\n${hashtags}`
}
