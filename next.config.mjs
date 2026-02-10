/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignore build errors for pages with useSearchParams not wrapped in Suspense
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

export default nextConfig;
