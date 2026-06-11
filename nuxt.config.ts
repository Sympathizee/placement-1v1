export default defineNuxtConfig({
  ssr: false,
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase'
  ],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      link: [
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&display=swap' }
      ]
    }
  },
  supabase: {
    url: process.env.SUPABASE_URL || 'https://jhfxsbirrrvdwuybjijb.supabase.co',
    key: process.env.SUPABASE_KEY || 'sb_publishable_IdBKLyp9bhbSPhDzqr9g_g_lPsuVCQE',
    redirect: false // We will handle our own auth/redirects for the admin dashboard
  },
  routeRules: {
    '/**': { prerender: false }
  },
  nitro: {
    prerender: {
      crawlLinks: false,
      failOnError: false
    }
  },
  devtools: { enabled: false }
})
