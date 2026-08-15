import type { SVGProps } from 'react'

const base = { viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor', 'aria-hidden': true } as const

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return <svg {...base} width="16" height="16" strokeWidth="1.6" strokeLinecap="round" {...props}>
    <circle cx="8.3" cy="8.3" r="5.3" />
    <line x1="16.4" y1="16.4" x2="12.6" y2="12.6" />
  </svg>
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return <svg {...base} viewBox="0 0 16 16" width="13" height="13" strokeWidth="1.7" strokeLinecap="round" {...props}>
    <line x1="8" y1="2.5" x2="8" y2="13.5" />
    <line x1="2.5" y1="8" x2="13.5" y2="8" />
  </svg>
}

export function MinusIcon(props: SVGProps<SVGSVGElement>) {
  return <svg {...base} viewBox="0 0 16 16" width="13" height="13" strokeWidth="1.7" strokeLinecap="round" {...props}>
    <line x1="2.5" y1="8" x2="13.5" y2="8" />
  </svg>
}

export function PanIcon(props: SVGProps<SVGSVGElement>) {
  return <svg {...base} width="15" height="15" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M10 2.5v15M2.5 10h15" />
    <path d="M10 2.5 7.8 4.7M10 2.5l2.2 2.2M10 17.5l-2.2-2.2M10 17.5l2.2-2.2M2.5 10l2.2-2.2M2.5 10l2.2 2.2M17.5 10l-2.2-2.2M17.5 10l-2.2 2.2" />
  </svg>
}
