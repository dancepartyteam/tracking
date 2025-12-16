module.exports = {
  apps: [
    {
      name: "dp-tracking",
      script: "src/server.ts",
      watch: ["src"],
      interpreter: "npx",
      interpreter_args: "tsx"
    }
  ]
};