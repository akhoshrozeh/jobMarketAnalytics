module.exports = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'upload.wikimedia.org',
          port: '',
          pathname: '/wikipedia/**',
          search: '',
        },
        {
            protocol: 'https',
            hostname: 'images.unsplash.com',
            pathname: '/**',
        },
        {
            protocol: 'https',
            hostname: 'tailwindui.com',
            pathname: '/**',
        },
    ],
    },
  }