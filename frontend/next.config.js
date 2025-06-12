/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['localhost', 'images.unsplash.com'],
  },
  experimental: {
    optimizeCss: true,
  },
  // Configuração para suporte adequado a UTF-8 e caracteres portugueses
  compress: true,
  poweredByHeader: false,
  // Configurar headers de resposta para UTF-8
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/html; charset=utf-8',
          },
          {
            key: 'Accept-Charset',
            value: 'utf-8',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json; charset=utf-8',
          },
        ],
      },
    ]
  },
  // Configuração do webpack para UTF-8
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Configurar loader para arquivos .md com UTF-8
    config.module.rules.push({
      test: /\.md$/,
      use: [
        {
          loader: 'raw-loader',
          options: {
            esModule: false,
          },
        },
      ],
    });
    
    return config;
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'ainovar.com',
          },
        ],
        destination: 'https://ainovar.tech/:path*',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig 