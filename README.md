# Tracking

The Tracking Server is designed for use with supported games to monitor user activity. It collects parameters sent by the game, allowing developers to identify bugs, issues, and other anomalies.

Additionally, the server handles the activation of keys (redeem codes) to unlock special in-game content.

## Installation

1. Clone the repository:

   ```bash
   git clone [repository_url]
   ```
2. Install dependencies:

   ```bash
   npm install
   ```
3. Copy the example environment file and update it with your configuration:

   ```bash
   cp .env.example .env
   ```
4. Start the server in development mode:

   ```bash
   npm run dev
   ```

## Creating a New Product

1. Open your browser and navigate to `http://localhost:5800`.
2. Access the `/admin` panel and go to **Products**.
3. Create a new product and note the credentials, which must be used in the game.

## Creating a New Activation Key

1. Open your browser and navigate to `http://localhost:5800`.
2. Access the `/admin` panel and go to **Keys**.
3. Create a new key.
4. Assign the key code in the game for activation.
5. The **privilege list** is an integer used by the game to determine which content to unlock.
   * Privileges are determined by the game. Unlocking custom content via the server is not supported.
   * You need to reverse engineer the game to determine the privileges.

## Important Notes

- The server is designed to be used with a NAS server.
- The NAS server must be configured to use the NAS token for authentication.
- You MUST restrict `/admin` to be only accessible from your server IP address or set up the credentials in the `.env` file.
- The server & the game will not function without any product and key configurations.

## License

This project is governed by the terms outlined in [LICENSE.md](LICENSE.md).