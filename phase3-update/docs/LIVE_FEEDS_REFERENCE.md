# Live Feeds & CCTV Reference — Lebanon

## Embeddable Webcams

### SkylineWebcams Beirut (RECOMMENDED)
- Page: https://www.skylinewebcams.com/en/webcam/lebanon/beirut/beirut/beirut.html
- Embed: `<iframe src="https://www.skylinewebcams.com/en/webcam/lebanon/beirut/beirut/beirut.html" width="100%" height="300" frameborder="0" allow="autoplay"></iframe>`
- Quality: 1080p, with sound
- Status: Online, panoramic city view
- Notes: Free to embed with attribution

### IPLiveCams Beirut
- Page: https://www.iplivecams.com/live-cams/beirut-lebanon/
- Embed: iframe from page source
- Quality: HD, skyline view

## YouTube Live Streams

### LBCI Lebanon
- Search: "LBCI live stream Lebanon"
- Channel ID: find from youtube.com/@LBCI
- Embed: `<iframe src="https://www.youtube.com/embed/live_stream?channel=CHANNEL_ID" width="100%" height="300" frameborder="0" allowfullscreen></iframe>`
- Note: Live stream availability varies

### Al Jadeed TV
- Search: "Al Jadeed live Lebanon"
- Similar embed pattern

### MTV Lebanon
- Search: "MTV Lebanon live"

## Insecam (Public Unsecured Cameras)
- Lebanon page: http://www.insecam.org/en/bycountry/LB/
- These are PUBLICLY ACCESSIBLE cameras (not hacked)
- Embed: iframe with camera page URL
- Note: Cameras come and go, not reliable for production
- Use as curiosity/exploration feature, not core functionality

## Implementation Notes

1. SkylineWebcams is the most reliable and highest quality option
2. YouTube embeds require checking if a stream is currently live (YouTube Data API v3, free quota)
3. For the UI: show a thumbnail/preview, click to expand to full embed
4. Add a "Live" indicator (red dot + "LIVE" text) next to active feeds
5. Respect embed policies — check if the source allows iframe embedding
6. Never auto-play with sound — always muted by default
