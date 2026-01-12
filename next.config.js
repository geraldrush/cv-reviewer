/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove 'export' to allow API routes and dynamic behavior on Vercel
  trailingSlash: false,
  images: {
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
  },
}

module.exports = nextConfig
