import type { ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function base(props: IconProps, children: ReactNode) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  )
}

export const HomeIcon = (p: IconProps) =>
  base(p, <path d="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />)

export const BulbIcon = (p: IconProps) =>
  base(
    p,
    <>
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6V17h5.4v-1.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z" />
    </>,
  )

export const CalendarIcon = (p: IconProps) =>
  base(
    p,
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>,
  )

export const ChartIcon = (p: IconProps) =>
  base(p, <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />)

export const DollarIcon = (p: IconProps) =>
  base(
    p,
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M15 9.5c0-1.4-1.3-2.5-3-2.5s-3 1-3 2.4c0 3.1 6 1.5 6 4.5 0 1.4-1.3 2.6-3 2.6s-3-1.1-3-2.5" />
    </>,
  )

export const SettingsIcon = (p: IconProps) =>
  base(
    p,
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9c.2.6.7 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </>,
  )

export const FlameIcon = (p: IconProps) =>
  base(
    p,
    <path d="M12 3s4 3.5 4 7.5a4 4 0 0 1-8 0c0-1 .3-1.8.8-2.6C9.4 9 9 10.4 9 11.5A3 3 0 0 0 12 14.5 3 3 0 0 0 15 11.5c0-2.8-2-4.9-3-8.5Z M7 15a5 5 0 0 0 10 0c0-1.6-.6-2.8-1.3-3.9.2 1 .1 2-.4 2.9A4 4 0 0 1 12 17a4 4 0 0 1-3.3-2.9c-.4-.9-.6-1.9-.4-2.9-.7 1-1.3 2.3-1.3 3.8Z" />,
  )

export const BellIcon = (p: IconProps) =>
  base(
    p,
    <>
      <path d="M6 8a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>,
  )

export const HeartIcon = (p: IconProps) =>
  base(
    p,
    <path d="M12 20.5S3.5 15 3.5 9a4.5 4.5 0 0 1 8.5-2 4.5 4.5 0 0 1 8.5 2c0 6-8.5 11.5-8.5 11.5Z" />,
  )

export const SparklesIcon = (p: IconProps) =>
  base(
    p,
    <path d="M12 3v4M12 17v4M4 12h4M16 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />,
  )

export const HashIcon = (p: IconProps) =>
  base(p, <path d="M5 9h14M5 15h14M10 3 8 21M16 3l-2 18" />)

export const RefreshIcon = (p: IconProps) =>
  base(
    p,
    <>
      <path d="M3 12a9 9 0 0 1 15.4-6.4L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.4 6.4L3 16" />
      <path d="M3 21v-5h5" />
    </>,
  )

export const CheckIcon = (p: IconProps) => base(p, <path d="m5 12 5 5L20 7" />)

export const XIcon = (p: IconProps) => base(p, <path d="M6 6l12 12M18 6 6 18" />)

export const ClockIcon = (p: IconProps) =>
  base(
    p,
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>,
  )

export const TrendUpIcon = (p: IconProps) =>
  base(
    p,
    <>
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </>,
  )

export const PlugIcon = (p: IconProps) =>
  base(
    p,
    <>
      <path d="M9 3v4M15 3v4M7 7h10l-1 5a4 4 0 0 1-4 3.5V19a2 2 0 1 1-4 0v-3.5A4 4 0 0 1 8 12Z" />
    </>,
  )
