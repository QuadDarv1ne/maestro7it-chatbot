import type { MetadataRoute } from 'next'

/**
 * manifest.webmanifest — PWA манифест.
 * Позволяет установить сайт как приложение на мобильных устройствах.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Maestro7IT — Курсы программирования',
    short_name: 'Maestro7IT',
    description:
      '23 курса по программированию, DevOps, базам данных, AI и мультимедиа на платформе Stepik.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#f59e0b',
    orientation: 'portrait-primary',
    categories: ['education', 'productivity'],
    lang: 'ru',
    dir: 'ltr',
    icons: [
      {
        src: '/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  }
}
