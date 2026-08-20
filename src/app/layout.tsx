import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description = "Feed de notícias personalizado: escolha suas categorias e receba notícias de múltiplas fontes, deduplicadas e classificadas por IA.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "TrackFeed | Notícias Personalizadas",
  description,
  openGraph: {
    title: "TrackFeed | Notícias Personalizadas",
    description,
    type: "website",
    locale: "pt_BR",
    images: ["/screenshots/feed.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "TrackFeed | Notícias Personalizadas",
    description,
    images: ["/screenshots/feed.png"],
  },
};

// Aplica o tema salvo antes da primeira pintura, evitando flash de tema claro
// (o ThemeProvider só roda no useEffect, depois da hidratação).
const themeScript = `
try {
  var t = localStorage.getItem('theme') || 'dark';
  document.documentElement.classList.toggle('dark', t === 'dark');
} catch (e) {
  document.documentElement.classList.add('dark');
}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}>
        <ThemeProvider
          defaultTheme="dark"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>

  );
}
