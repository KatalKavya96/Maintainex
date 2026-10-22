/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    // Temporarily withdraw unfinished frontend features, including bookmarked URLs.
    return [
      { source: "/leaderboard/:path*", destination: "/dashboard", permanent: false },
      { source: "/reports/:path*", destination: "/dashboard", permanent: false },
      ...["repositories", "quests", "recommended", "saved"].map((feature) => ({
        source: `/explore/${feature}/:path*`,
        destination: "/explore/organizations",
        permanent: false
      }))
    ];
  }
};

export default nextConfig;
