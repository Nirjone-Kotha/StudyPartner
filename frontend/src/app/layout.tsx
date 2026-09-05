import type { Metadata, Viewport } from 'next';
import { Fredoka, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-fredoka',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#FFFFFF' },
  ],
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Study Partner — Learn, Poll & Connect',
  description: 'Study Partner — Connect, collaborate, and study together with friends.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Study Partner',
    startupImage: '/icons/icon-512x512.png',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'application-name': 'Study Partner',
    'msapplication-TileColor': '#FFFFFF',
    'msapplication-TileImage': '/icons/icon-144x144.png',
    'msapplication-tap-highlight': 'no',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={`${fredoka.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FFFFFF" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#FFFFFF" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#FFFFFF" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Study Partner" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="msapplication-TileColor" content="#FFFFFF" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var enforceWhite = function() {
                var metas = document.querySelectorAll('meta[name="theme-color"]');
                metas.forEach(function(m) { m.setAttribute('content', '#FFFFFF'); });
              };
              enforceWhite();
              window.addEventListener('DOMContentLoaded', enforceWhite);
            } catch(e) {}
          })();
        `}} />
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js')
                .then(function(registration) {
                  registration.update();
                  console.log('SW registered & updated:', registration.scope);
                })
                .catch(function(err) {
                  console.log('SW registration failed:', err);
                });
            });
          }
        `}} />
      </body>
    </html>
  );
}
