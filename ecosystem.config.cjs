/**
 * PM2 process file for running rocky-web in production on EC2, next to rocky-api.
 *
 * Comparable to a systemd unit for a Spring Boot `java -jar` app: it says what to run,
 * from which directory, how many copies, and how to stop and restart it.
 *
 * Usage on the server (deploy/redeploy.sh does this for you):
 *   pm2 start ecosystem.config.cjs                  first start
 *   pm2 reload ecosystem.config.cjs --update-env    after a new build
 *   pm2 startup && pm2 save                         once, so PM2 restores the app after a reboot
 *
 * `.cjs` because PM2 loads this file with require(); the extension keeps it CommonJS
 * even if package.json ever switches to "type": "module".
 */
module.exports = {
  apps: [
    {
      name: "rocky-web",

      // Runs the Next.js CLI directly rather than `npm run start`: with npm in between,
      // PM2's stop signal goes to npm instead of the server, which can leave Next running
      // or cut its graceful shutdown short.
      script: "node_modules/next/dist/bin/next",

      // Bind to 127.0.0.1 so only Nginx on this host can reach the app; `next start`
      // otherwise listens on 0.0.0.0. Nginx proxies / here and /api to rocky-api on 4000.
      // Keep in sync with the `start` script in package.json.
      args: "start --hostname 127.0.0.1 --port 3000",

      // Repository root. Next.js reads `.next/` and the `.env*` files (including
      // `.env.local` with FIREBASE_STORAGE_BUCKET) from the current working directory.
      cwd: __dirname,

      // One process: the Next.js cache lives on local disk and in memory, which stays
      // coherent only for a single instance. More instances would need a shared cache
      // handler (Next.js self-hosting guide). With one fork instance, `pm2 reload` is a
      // quick restart, not a zero-downtime reload.
      exec_mode: "fork",
      instances: 1,

      // Restart automatically when the process crashes.
      autorestart: true,

      // On SIGINT Next.js stops accepting connections and finishes in-flight requests.
      // PM2's default (1.6 s) can cut that short with SIGKILL; the Next.js docs recommend
      // a 10–30 s drain period.
      kill_timeout: 15000,

      // `next start` already runs in production mode; setting it explicitly keeps any
      // NODE_ENV from the shell or `.env` from changing that.
      env: {
        NODE_ENV: "production",
      },

      // Prefix every line in ~/.pm2/logs/rocky-web-{out,error}.log with a timestamp, so
      // restarts and errors can be correlated with rocky-api's logs.
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
