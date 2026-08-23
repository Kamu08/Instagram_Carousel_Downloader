import type { Metadata, Viewport } from 'next';
import {
  Space_Grotesk,
  Caveat,
  Patrick_Hand,
  JetBrains_Mono,
  Inter,
  Titan_One,
  Paytone_One,
} from 'next/font/google';
import './globals.css';

const titanOne = Titan_One({
  variable: '--font-titan',
  subsets: ['latin'],
  weight: ['400'],
});

const paytoneOne = Paytone_One({
  variable: '--font-paytone',
  subsets: ['latin'],
  weight: ['400'],
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

const caveat = Caveat({
  variable: '--font-caveat',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

const patrickHand = Patrick_Hand({
  variable: '--font-patrick',
  subsets: ['latin'],
  weight: ['400'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://instagram-carousel-downloader.vercel.app';
const SITE_TITLE = 'Instagram Carousel Downloader & LinkedIn PDF Studio | By Kamal Sharma';
const SITE_DESC =
  'Download Instagram carousel slides in HD PNG, convert into 4:5 LinkedIn PDF documents, stamp custom watermarks, and generate viral AI post captions with Gemini Vision. Created by Kamal Sharma.';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F4EB' },
    { media: '(prefers-color-scheme: dark)', color: '#161412' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: '%s | Instagram Carousel Downloader & LinkedIn Studio',
  },
  description: SITE_DESC,
  keywords: [
    'Instagram Carousel Downloader',
    'Instagram to LinkedIn PDF',
    'Download Instagram Carousel',
    'Instagram Carousel to PDF',
    'LinkedIn Carousel PDF Generator',
    'Download Instagram Slides HD',
    'LinkedIn Document Carousel Maker',
    'Instagram Slide Downloader',
    'Kamal Sharma',
    'Carousel Watermark Maker',
    'LinkedIn Caption Generator AI',
    'Gemini AI LinkedIn Writer',
    'Instagram Post Downloader Free',
    'Social Media Carousel Converter',
  ],
  authors: [{ name: 'Kamal Sharma', url: 'https://linkedin.com' }],
  creator: 'Kamal Sharma',
  publisher: 'Kamal Sharma',
  applicationName: 'Instagram Carousel Downloader & LinkedIn Studio',
  generator: 'Next.js',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESC,
    url: SITE_URL,
    siteName: 'Instagram Carousel Downloader & LinkedIn Studio',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESC,
    creator: '@kamalsharma',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
  },
};

// Schema.org Structured Data (JSON-LD) for Google Rich Results
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/#webapp`,
      name: 'Instagram Carousel Downloader & LinkedIn PDF Studio',
      url: SITE_URL,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'All',
      browserRequirements: 'Requires JavaScript. Works on Chrome, Safari, Firefox, Edge.',
      description: SITE_DESC,
      author: {
        '@type': 'Person',
        name: 'Kamal Sharma',
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: [
        'Instant Instagram Carousel HD Slide Downloader',
        'Automatic Conversion to 4:5 Portrait LinkedIn PDF Document',
        'Lossless PNG ZIP batch export with sequential naming',
        'Custom Slide Watermark & Branding Studio with 6 positions and 8 badge styles',
        'Gemini Multimodal AI Post Caption & 500+ Word Masterclass Writer',
        'Viral Hook A/B Testing Lab with 5 strategic angles',
        'Interactive Drag-and-Drop Slide Reordering & Single Slide Export',
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE_URL}/#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How do I download high-resolution slides from an Instagram carousel?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Paste the public Instagram carousel link into the downloader input field and click "Process Carousel". The studio will download and extract all slides in full original resolution lossless PNG format.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do I convert an Instagram Carousel into a LinkedIn PDF Document?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Once your carousel slides are loaded, click "Download LinkedIn PDF (1080x1350)". The tool automatically formats each slide into a 4:5 aspect ratio swipeable PDF document optimized for LinkedIn dwell time and feed reach.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I add watermarks and generate AI LinkedIn captions?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes! You can add non-destructive branding stamps in 6 positions with 8 styles, and use the Gemini 3.6 Flash AI Studio to visually scan your slides and generate viral LinkedIn captions and hooks.',
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${titanOne.variable} ${paytoneOne.variable} ${spaceGrotesk.variable} ${caveat.variable} ${patrickHand.variable} ${jetbrainsMono.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Titan+One&family=Paytone+One&family=Bungee&family=Bowlby+One+SC&display=swap"
          rel="stylesheet"
        />
        {/* Google Rich Snippet JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
