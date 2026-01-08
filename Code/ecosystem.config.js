module.exports = {
  apps: [
    {
      name: "kaffettino-api-server", // Nome del processo in PM2
      script: "server.ts", // Il file da avviare
      cwd: "./backend/api/src/", // La cartella dove si trova questo server
      interpreter: "/home/kirk/.bun/bin/bun", // Percorso assoluto di Bun (verifica con 'which bun')
      env: {
        PORT: 6969,
        DATABASE_URL: process.env.DATABASE_URL,
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
        BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
        API_KEY_SECRET: process.env.API_KEY_SECRET,
      },
    },
  ],
};
