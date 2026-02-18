/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // Static export for serving via Express
  trailingSlash: true,
  images: {
    unoptimized: true, // Required for static export
  },

};

module.exports = nextConfig;
