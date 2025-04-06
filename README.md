# Anime Tracker for MyAnimeList

A Chrome extension that automatically tracks anime you watch on streaming platforms (Crunchyroll, Netflix, Anicrush) and updates your MyAnimeList account.

## Features

- Automatically detects anime and episode being watched
- Updates MyAnimeList when episodes are completed
- Works with Crunchyroll, Netflix, and Anicrush
- Manual update option if automatic detection fails
- Toggle for automatic updates

## Setup

### Installation

1. Clone this repository or download as ZIP
2. Go to `chrome://extensions/` in your Chrome browser
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked" and select the extension folder

### MyAnimeList API Setup

To use this extension, you need to register an app with MyAnimeList:

1. Go to [MyAnimeList API](https://myanimelist.net/apiconfig)
2. Create a new app
3. For redirect URL, use: `https://YOUR_CHROME_EXTENSION_ID.chromiumapp.org/`
4. Get your Client ID
5. Replace `YOUR_CLIENT_ID` in `background.js` with your actual Client ID

## How to Use

1. Click the extension icon in your browser toolbar
2. Connect your MyAnimeList account by clicking the "Connect" button
3. Watch anime on supported streaming sites
4. The extension will automatically detect and update your MAL account

## Development

This is an MVP (Minimum Viable Product) with basic functionality. Future improvements could include:

- Better anime detection algorithms
- Support for more streaming platforms
- Improved UI with history of tracked episodes
- Sync with offline viewing
- Settings for update timing (e.g., after watching 80% of episode)

## Privacy

This extension only accesses data on supported anime streaming sites. Your MyAnimeList credentials are handled securely through OAuth. No data is sent to any third-party servers.

## License

MIT