module.exports = {
  apps: [
    {
      name: "spider-integration-api",
      script: "./src/index.js",
      watch: false,
      env: {
        PORT: 3002,
      },
    },
    {
      name: "curlec-payment-history-scheduler",
      script: "dist/cron.module.js",
      watch: false,
      interpreter: "node",
      interpreter_args: "-r reflect-metadata -r source-map-support/register",
    },
  ],
};
