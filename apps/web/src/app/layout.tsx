import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AppHeader } from '../components/AppHeader';
import { getThemeInitScript } from '../lib/theme-utils';

export const metadata: Metadata = {
  title: 'Pokémon GO Data Platform',
  description: 'Data-first MVP for Pokémon GO content',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: getThemeInitScript(),
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <AppHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

