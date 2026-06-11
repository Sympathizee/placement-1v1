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
    redirect: false // We will handle our own auth/redirects for the admin dashboard
  },
  devtools: { enabled: false }
})
