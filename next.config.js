/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  webpack(config) {
    config.module.rules.push({
      test: /\.(vert|frag)$/,
      use: "raw-loader",
    });
    return config;
  },
};
