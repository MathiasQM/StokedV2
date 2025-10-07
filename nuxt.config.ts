import './env'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import 'dotenv/config'
import fs from 'fs'

export default defineNuxtConfig({
  build: { transpile: ['vue-chartjs'] },
  modules: [
    '@nuxt/ui',
    '@vueuse/nuxt',
    'nuxt-auth-utils',
    '@nuxtjs/supabase',
    '@vite-pwa/nuxt',
    'shadcn-nuxt',
    '@pinia/nuxt',
    'nuxt-charts',
    '@nuxtjs/google-fonts',
  ],
  googleFonts: {
    families: {
      Inter: [400, 500, 600, 700],
    },
    display: 'swap',
  },
  plugins: ['~/plugins/plaid-link.client.ts', '~/plugins/dayjs.ts'],
  colorMode: {
    preference: 'dark',
  },
  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      meta: [
        {
          name: 'viewport',
          content:
            'width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0, user-scalable=no',
        },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'theme-color', content: '#121212' },
        {
          name: 'apple-mobile-web-app-status-bar-style',
          content: 'black-translucent',
        },
        { name: 'mobile-web-app-capable', content: 'yes' },
        {
          hid: 'description',
          name: 'description',
          content: 'description',
        },
        { name: 'robots', content: 'index, follow' },
        { name: 'og:type', content: 'website' },
      ],
      link: [
        {
          rel: 'manifest',
          href: '/manifest.webmanifest',
        },
        { rel: 'canonical', href: 'https://app.striiveai.com' },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/icons/apple-touch-180.png',
        },
        {
          rel: 'apple-touch-icon',
          sizes: '167x167',
          href: '/icons/apple-touch-167.png',
        },
        {
          rel: 'apple-touch-icon',
          sizes: '152x152',
          href: '/icons/apple-touch-152.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: '/favicon-32.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '16x16',
          href: '/favicon-16.png',
        },
        {
          rel: 'mask-icon',
          href: '/icons/icon-mono.svg',
          color: '#121212',
        },
      ],
      script: [
        { src: 'https://unpkg.com/pwacompat', crossorigin: 'anonymous' },
      ],
    },
    pageTransition: { name: 'fade', mode: 'out-in' },
    layoutTransition: { name: 'fade', mode: 'out-in' },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  pwa: {
    injectRegister: 'script',
    strategies: 'injectManifest',
    includeManifestIcons: true,
    srcDir: 'public',
    filename: 'sw.js',
    scope: '/',
    registerType: 'autoUpdate',
    // includeAssets: ['favicon.ico'],
    manifest: {
      name: 'Striive',
      short_name: 'Striive',
      description:
        'Striive is a next-generation investment platform built for everyday investors. Stay briefed with AI-powered summaries of your portfolios, track performance across accounts, test strategies, and gain deep insights — all in one place. Works seamlessly on desktop and mobile.',
      theme_color: '#121212',
      icons: [
        {
          src: '/icons/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icons/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
        {
          src: '/icons/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/icons/icon-1024.png',
          sizes: '1024x1024',
          type: 'image/png',
        },
        {
          src: '/icons/icon-mono.svg',
          sizes: '1024x1024',
          type: 'image/svg+xml',
          purpose: 'monochrome',
        },
      ],
      start_url: '/',
      id: '/',
      background_color: '#121212',
      display: 'standalone',
      dir: 'ltr',
      display_override: ['standalone', 'window-controls-overlay'],
      lang: 'en-us',
      orientation: 'portrait',
      features: [
        'AI-Generated Briefings',
        ' Strategy Backtesting',
        'Market Explorer',
        'Performance Insights',
        'Watchlists',
      ],
      categories: [
        'Finance',
        'Investing',
        'Stock Market Tools',
        'Personal Finance',
        'AI / Automation',
        'Fintech',
      ],
      screenshots: [
        {
          src: '/screenshots/desktop.png',
          sizes: '1280x708',
          type: 'image/png',
          form_factor: 'wide',
          label: 'AI-Generated Briefings',
          platform: 'desktop',
        },
        {
          src: '/screenshots/mobile.png',
          sizes: '391x844',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Strategy Backtesting',
          platform: 'mobile',
        },
      ],
      launch_handler: {
        route_to: 'auto',
      },
      prefer_related_applications: false,
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      type: 'module',
      enabled: true,
    },
  },
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  ui: {
    theme: {
      colors: [
        'primary',
        'orange',
        'sort',
        'secondary',
        'tertiary',
        'info',
        'success',
        'warning',
        'error',
      ],
    },
  },
  runtimeConfig: {
    buildEnv: process.env.BUILD_ENV,
    yodleeAdminLogin: process.env.YODLEE_ADMIN_LOGIN,
    yodleeClientId: process.env.YODLEE_CLIENT_ID,
    yodleeSecret: process.env.YODLEE_SECRET,
    yodleeApiBase: process.env.YODLEE_API_BASE,
    yodleeFastlinkUrl: process.env.YODLEE_FASTLINK_URL,
    eodApiKey: process.env.EOD_API_KEY,
    resendApiToken: process.env.RESEND_API_TOKEN,
    fromEmail: process.env.FROM_EMAIL,
    nuxtSessionPassword: process.env.NUXT_SESSION_PASSWORD,
    nuxtStripeSecretKey: process.env.NUXT_STRIPE_SECRET_KEY,
    nuxtStripeWebhookSecret: process.env.NUXT_STRIPE_WEBHOOK_SECRET,
    nuxtStripeTestSecretKey: process.env.NUXT_STRIPE_TEST_SECRET_KEY,
    nuxtStripeTestWebhookSecret: process.env.NUXT_STRIPE_TEST_WEBHOOK_SECRET,
    plaidSandboxSecret: process.env.PLAID_SANDBOX_SECRET,
    plaidEncKey: process.env.PLAID_ENC_KEY,
    postgresUrl: process.env.POSTGRES_URL,
    supabaseKey: process.env.SUPABASE_KEY,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
    elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
    elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID_NARRATOR,
    elevenLabsModelId: process.env.ELEVENLABS_MODEL_ID,
    openaiApiKey: process.env.OPENAI_API_KEY,
    public: {
      webauthn: getWebAuthnConfig(),
      yodleeFastlinkUrl: process.env.YODLEE_FASTLINK_URL,
      eodBase: process.env.EOD_BASE_URL,
      stripePublicKey: process.env.NUXT_STRIPE_TEST_PUBLISHABLE_KEY,
      environment: process.env.NODE_ENV,
      baseUrl: process.env.BASE_URL,
      appName: process.env.APP_NAME,
      appDescription: process.env.APP_DESCRIPTION,
      logoUrl: process.env.LOGO_URL,
      mockEmail: process.env.MOCK_EMAIL,
      emailProvider: process.env.EMAIL_PROVIDER,
      paymentProvider: process.env.PAYMENT_PROVIDER,
      plaidEnvironment: process.env.PLAID_ENVIRONMENT,
      plaidClientId: process.env.PLAID_CLIENT_ID,
      supabaseUrl: process.env.SUPABASE_URL,
      host: process.env.BASE_URL,
    },
    oauth: {
      google: {
        clientId: process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID,
        clientSecret: process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET,
      },
    },
    // @ts-expect-error - We're just extending the type
    session: {
      maxAge: 60 * 60 * 24 * 7, // Session expires after 7 days - change it accordingly
    },
  },
  future: { compatibilityVersion: 4 },
  compatibilityDate: '2024-07-30',
  auth: {
    webAuthn: true,
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    redirect: false,
  },
  middleware: ['~/server/middleware/rateLimit'],
  nitro: {
    prerender: {
      routes: ['/'],
    },
    routeRules: {
      '/': { ssr: false },
    },
    rollupConfig: {
      // @ts-expect-error - Rollup plugin type definitions are incomplete for vue plugin
      plugins: [vue()],
    },
    storage: {
      s3Storage: {
        driver: 'fs',
        base: './public',
        // accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
        // secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
        // bucket: process.env.S3_BUCKET as string,
        // region: process.env.S3_REGION as string,
        // endpoint: process.env.S3_ENDPOINT as string,
      },
    },
    experimental: {
      tasks: true,
    },
  },
  // devServer: {
  //   https: {
  //     key: 'localhost-key.pem',
  //     cert: 'localhost.pem',
  //   },
  // },
  eslint: {
    config: {
      standalone: true,
      typescript: {
        // Disables strict rules - recommended are still enabled
        strict: false,
        // Enables type-checking - this has a significant performance impact
        tsconfigPath: './tsconfig.json',
      },
      stylistic: {
        indent: 2,
        semi: false,
        quotes: 'single',
        commaDangle: 'always-multiline',
      },
    },
  },
})

function getWebAuthnConfig() {
  const buildEnv = process.env.BUILD_ENV

  switch (buildEnv) {
    case 'production':
      return {
        rpID: 'striiveai.com',
        origin: 'https://app.striiveai.com',
      }
    case 'staging':
      return {
        rpID: 'striive-staging--striive-8eb17.europe-west4.hosted.app',
        origin:
          'https://striive-staging--striive-8eb17.europe-west4.hosted.app',
      }
    default: // Handles development or any other case
      return {
        rpID: 'localhost',
        origin: 'http://localhost:3000',
      }
  }
}
