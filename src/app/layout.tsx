import type {Metadata} from 'next';
import {
  Afacad,
  Barlow_Condensed,
  Fjalla_One,
  Fragment_Mono,
} from 'next/font/google';
import type {ReactNode} from 'react';
import './globals.css';

const afacad = Afacad({
  subsets: ['latin'],
  variable: '--font-body',
  adjustFontFallback: false,
  fallback: ['sans-serif'],
});

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-condensed',
});

const fjallaOne = Fjalla_One({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
});

const fragmentMono = Fragment_Mono({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Missão Maranhão',
  description:
    'Encontre e entre no grupo de WhatsApp da sua cidade no Maranhão.',
};

export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html
      lang="pt-BR"
      className={`${afacad.variable} ${barlowCondensed.variable} ${fjallaOne.variable} ${fragmentMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
