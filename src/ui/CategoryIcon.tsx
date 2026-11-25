import type { ReactNode } from 'react'

export function CategoryIcon({ id }: { id: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const marks: Record<string, ReactNode> = {
    work: <><rect x="4" y="7" width="16" height="11" rx="2" {...common} /><path d="M9 7V5.7A1.7 1.7 0 0 1 10.7 4h2.6A1.7 1.7 0 0 1 15 5.7V7M4 11.5c4.7 2 11.3 2 16 0M10.5 12.5h3" {...common} /></>,
    study: <><path d="M4 5.5c2.7-.8 5.4-.3 8 1.4v12c-2.6-1.7-5.3-2.2-8-1.4v-12ZM20 5.5c-2.7-.8-5.4-.3-8 1.4v12c2.6-1.7 5.3-2.2 8-1.4v-12Z" {...common} /></>,
    exercise: <><path d="M7.5 12h9M3.5 10v4M20.5 10v4" {...common} /><rect x="4.5" y="8.5" width="3" height="7" rx="1.2" {...common} /><rect x="16.5" y="8.5" width="3" height="7" rx="1.2" {...common} /></>,
    leisure: <><rect x="4" y="6" width="16" height="12" rx="4" {...common} /><path d="M8 12h4M10 10v4M16.5 10.8h.01M18 13.2h.01" {...common} /></>,
    everyday: <><path d="m3.5 11 8.5-7 8.5 7M5.5 9.5V20h13V9.5M9.5 20v-6h5v6" {...common} /></>,
    rest: <><path d="M5 10h11v3.6a4.4 4.4 0 0 1-4.4 4.4H9.4A4.4 4.4 0 0 1 5 13.6V10ZM16 11h1.2a2.3 2.3 0 0 1 0 4.6h-1.7M4 20h14" {...common} /><path d="M8 7c-1-1.1.8-1.8-.1-3M12 7c-1-1.1.8-1.8-.1-3" {...common} /></>,
    social: <><circle cx="9" cy="8" r="3" {...common} /><circle cx="17" cy="9" r="2.3" {...common} /><path d="M3.8 19c.5-3.4 2.2-5.2 5.2-5.2s4.7 1.8 5.2 5.2M14.5 14.3c3.3-.8 5.2.7 5.7 3.7" {...common} /></>,
    creative: <><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3ZM18.5 14.5l.7 2.2 2.3.8-2.3.7-.7 2.3-.8-2.3-2.2-.7 2.2-.8.8-2.2Z" {...common} /></>,
    music: <><path d="M9 18V6l10-2v12" {...common} /><circle cx="6.5" cy="18" r="2.5" {...common} /><circle cx="16.5" cy="16" r="2.5" {...common} /></>,
    heart: <path d="M12 20S4 15.6 4 9.5A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 8 2.5C20 15.6 12 20 12 20Z" {...common} />,
    laptop: <><rect x="5" y="5" width="14" height="10" rx="1.5" {...common} /><path d="M3 18h18M8 18l1-3h6l1 3" {...common} /></>,
    camera: <><rect x="3.5" y="7" width="17" height="12" rx="2" {...common} /><circle cx="12" cy="13" r="3.3" {...common} /><path d="m7 7 1.2-2h7.6L17 7" {...common} /></>,
    pencil: <><path d="m5 19 1-4L16.7 4.3a1.8 1.8 0 0 1 2.5 2.5L8.5 17.5 5 19ZM14.5 6.5l3 3" {...common} /></>,
    shopping: <><path d="M5 8h14l-1 12H6L5 8ZM9 8V6a3 3 0 0 1 6 0v2" {...common} /></>,
    leaf: <><path d="M19.5 4.5C12 4 6.3 7 5 13.2c-.7 3.3 1.5 5.9 4.8 5.2 6.2-1.3 9.2-7 9.7-13.9Z" {...common} /><path d="M5 20c2.4-5.3 6-8.8 11-11" {...common} /></>,
    star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8-5.4 2.8 1-6-4.4-4.3 6.1-.9L12 3Z" {...common} />,
    other: <><circle cx="6" cy="12" r="1.3" fill="currentColor" /><circle cx="12" cy="12" r="1.3" fill="currentColor" /><circle cx="18" cy="12" r="1.3" fill="currentColor" /></>,
  }
  return <svg width={24} height={24} viewBox="0 0 24 24" aria-hidden="true">{marks[id] || marks.other}</svg>
}
