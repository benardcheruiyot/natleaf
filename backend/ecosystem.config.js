module.exports = {
  apps: [
    {
      name: 'natuleaf-storefront',
      script: 'index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 4101,
      },
    },
  ],
}
