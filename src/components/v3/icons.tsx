import type { SVGProps } from "react";

type IcProps = SVGProps<SVGSVGElement> & { size?: number; stroke?: number };

function SvgIc({ children, size = 18, stroke = 1.6, ...p }: IcProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      {children}
    </svg>
  );
}

export const Icon = {
  Arrow: (p: IcProps) => (
    <SvgIc {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </SvgIc>
  ),
  ArrowUR: (p: IcProps) => (
    <SvgIc {...p}>
      <path d="M7 17 17 7M9 7h8v8" />
    </SvgIc>
  ),
  Check: (p: IcProps) => (
    <SvgIc {...p}>
      <path d="m4 12 5 5L20 6" />
    </SvgIc>
  ),
  Plus: (p: IcProps) => (
    <SvgIc {...p}>
      <path d="M12 5v14M5 12h14" />
    </SvgIc>
  ),
  Minus: (p: IcProps) => (
    <SvgIc {...p}>
      <path d="M5 12h14" />
    </SvgIc>
  ),
  Search: (p: IcProps) => (
    <SvgIc {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </SvgIc>
  ),
  Close: (p: IcProps) => (
    <SvgIc {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </SvgIc>
  ),
  Whatsapp: (p: IcProps) => (
    <SvgIc {...p}>
      <path d="M3 21l1.6-4.5A8 8 0 1 1 12 20a8 8 0 0 1-4-1.1z" />
    </SvgIc>
  ),
  Phone: (p: IcProps) => (
    <SvgIc {...p}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.78 19.78 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.13 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </SvgIc>
  ),
  Mail: (p: IcProps) => (
    <SvgIc {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </SvgIc>
  ),
  Pin: (p: IcProps) => (
    <SvgIc {...p}>
      <path d="M12 22s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12z" />
      <circle cx="12" cy="10" r="2.5" />
    </SvgIc>
  ),
  Truck: (p: IcProps) => (
    <SvgIc {...p}>
      <path d="M3 7h11v9H3z" />
      <path d="M14 10h4l3 3v3h-7" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </SvgIc>
  ),
  Pill: (p: IcProps) => (
    <SvgIc {...p}>
      <rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-30 12 12)" />
      <path d="M9.5 6.5 17 14" />
    </SvgIc>
  ),
  Cart: (p: IcProps) => (
    <SvgIc {...p}>
      <path d="M3 4h2l2.5 12h11l2-8H7" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
    </SvgIc>
  ),
  Star: (p: IcProps) => (
    <SvgIc {...p}>
      <path d="m12 3 2.9 6 6.6 1-4.7 4.5 1.1 6.5L12 18l-5.9 3 1.1-6.5L2.5 10l6.6-1z" />
    </SvgIc>
  ),
  Doc: (p: IcProps) => (
    <SvgIc {...p}>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4" />
      <path d="M9 13h6M9 17h6" />
    </SvgIc>
  ),
  Camera: (p: IcProps) => (
    <SvgIc {...p}>
      <rect x="3" y="7" width="18" height="13" rx="3" />
      <circle cx="12" cy="13.5" r="3.5" />
      <path d="M8 7l2-3h4l2 3" />
    </SvgIc>
  ),
  Sign: (p: IcProps) => (
    <SvgIc {...p}>
      <path d="M3 17c3-1 4-3 7-3 4 0 5 5 8 5" />
      <path d="M3 21h18" />
    </SvgIc>
  ),
  Box: (p: IcProps) => (
    <SvgIc {...p}>
      <path d="m3 7 9-4 9 4-9 4-9-4z" />
      <path d="M3 7v10l9 4 9-4V7" />
      <path d="M12 11v10" />
    </SvgIc>
  ),
  Send: (p: IcProps) => (
    <SvgIc {...p}>
      <path d="M3 11 21 3l-8 18-2-8z" />
    </SvgIc>
  ),
  Shield: (p: IcProps) => (
    <SvgIc {...p}>
      <path d="M12 3l8 3v6c0 4.5-3.5 8.3-8 9-4.5-.7-8-4.5-8-9V6l8-3z" />
      <path d="m9 12 2 2 4-4" />
    </SvgIc>
  ),
  Sun: (p: IcProps) => (
    <SvgIc {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </SvgIc>
  ),
  Moon: (p: IcProps) => (
    <SvgIc {...p}>
      <path d="M21 13a8 8 0 1 1-9-11 6 6 0 0 0 9 11z" />
    </SvgIc>
  ),
  Quote: (p: IcProps) => (
    <SvgIc {...p}>
      <path d="M7 7h4v6c0 2-2 3-4 3M13 7h4v6c0 2-2 3-4 3" />
    </SvgIc>
  ),
};

export const unsplash = (id: string, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&auto=format&fit=crop&q=80`;
