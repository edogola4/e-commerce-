
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from 'next-themes';
import { cn } from '@/lib/utils';
import { Providers } from '@/components/providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartModal } from '@/components/cart/cart-modal';
import { SearchModal } from '@/components/common/search-modal';
import { WishlistModal } from '@/components/wishlist/wishlist-modal';
import '../app/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'ECommercy - Your Ultimate Shopping Destination',
    template: '%s | ECommercy',
  },
  description: 'Discover amazing products with personalized recommendations, secure payments, and fast delivery. Shop electronics, fashion, home goods and more.',
  keywords: ['ecommerce', 'shopping', 'online store', 'electronics', 'fashion', 'Kenya', 'M-Pesa'],
  authors: [{ name: 'ECommercy Team' }],
  creator: 'ECommercy',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'ECommercy',
    title: 'ECommercy - Your Ultimate Shopping Destination',
    description: 'Discover amazing products with personalized recommendations, secure payments, and fast delivery.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ECommercy - Online Shopping',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ECommercy - Your Ultimate Shopping Destination',
    description: 'Discover amazing products with personalized recommendations, secure payments, and fast delivery.',
    images: ['/images/og-image.jpg'],
    creator: '@ecommercy',
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
  verification: {
    google: 'google-site-verification-code',
  },
  category: 'ecommerce',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Theme color */}
        <meta name="theme-color" content="#000000" />
        <meta name="color-scheme" content="light dark" />
        
        {/* Viewport */}
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        
        {/* Structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "ECommercy",
              "description": "Your Ultimate Shopping Destination",
              "url": process.env.NEXT_PUBLIC_APP_URL,
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": `${process.env.NEXT_PUBLIC_APP_URL}/search?q={search_term_string}`
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body 
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.className
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <div className="relative flex min-h-screen flex-col">
              {/* Skip to main content link for accessibility */}
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
              >
                Skip to main content
              </a>
              
              {/* Header */}
              <Header />
              
              {/* Main content */}
              <main 
                id="main-content" 
                className="flex-1"
                role="main"
              >
                {children}
              </main>
              
              {/* Footer */}
              <Footer />
              
              {/* Modals */}
              <CartModal />
              <SearchModal />
              <WishlistModal />
              
              {/* Toast notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  className: 'text-sm',
                  success: {
                    className: 'bg-green-50 text-green-900 border-green-200',
                  },
                  error: {
                    className: 'bg-red-50 text-red-900 border-red-200',
                  },
                }}
              />
            </div>
          </Providers>
        </ThemeProvider>
        
        {/* Analytics script placeholder */}
        {process.env.NODE_ENV === 'production' && (
          <>
            {/* Google Analytics */}
            <script
              async
              src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', 'GA_MEASUREMENT_ID');
                `,
              }}
            />
          </>
        )}
      </body>
    </html>
  );
}