const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig = {
  accountAssociation: {
    header: "eyJmaWQiOjEzOTQ4NzYsInR5cGUiOiJhdXRoIiwia2V5IjoiMHhhMjBFQTlDOUM5NDczMjA0ODlkNjVlMjExRmI4Mjg1MTJGODgzZDExIn0",
    payload: "eyJkb21haW4iOiJnb3QtYmFzZS15ZXQudmVyY2VsLmFwcCJ9",
    signature: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABDlIWx2kyppkBJ6aMG05JZlXy9eTihWZ4nd0uHNUzyVBjKTmhuTocRV_JA8nGBSCv19wMMB0xQufvurUjq-U40wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAl8ZgIay2xclZzG8RWZzuWvO8j9R0fus3XxDee9lRlVy8dAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACKeyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiUzNfSDd4eFFTLVR1U0I2VExTc01VVi1sRjZCYmZWbXhBb3JxX2drZklZSSIsIm9yaWdpbiI6Imh0dHBzOi8va2V5cy5jb2luYmFzZS5jb20iLCJjcm9zc09yaWdpbiI6ZmFsc2V9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
  },
  miniapp: {
    version: "1",
    name: "Got $BASE Yet?", 
    subtitle: "Daily onchain check-in tracker", 
    description: "Track your daily Base journey with onchain check-ins. Build streaks, earn medals, and prove your commitment to the Base ecosystem. Every check-in is recorded on Base network.",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    iconUrl: `${ROOT_URL}/blue-icon.png`,
    splashImageUrl: `${ROOT_URL}/blue-hero.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "social",
    tags: ["base", "checkin", "streak", "onchain", "tracker"],
    heroImageUrl: `${ROOT_URL}/blue-hero.png`, 
    tagline: "Daily onchain check-ins on Base",
    ogTitle: "Got $BASE Yet?",
    ogDescription: "Daily onchain check-in tracker. Build streaks and earn medals on Base.",
    ogImageUrl: `${ROOT_URL}/blue-hero.png`,
  },
} as const;
