# Steno Voice Online

A browser-based voice recording application for clinical voice research. Participants complete structured voice exercises directly in their browser, and recordings are submitted to [REDCap](https://www.project-redcap.org/) for data collection — no desktop software or driver installation required.

## Features

- **Browser-based recording** — uses the Web Audio API for high-quality PCM audio capture
- **Structured voice exercises** — text reading, sustained phonation, counting, PaTaKa repetition, and free speech
- **Example audio playback** — participants can listen to example recordings before each exercise
- **Direct REDCap integration** — recordings are uploaded as WAV files to REDCap record fields via API
- **Works on any device** — desktop, tablet, or mobile with a microphone
- **Parameter-based access** — participants access the app via a tokenized URL from REDCap surveys
- **Responsive design** — optimized for all screen sizes

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- A REDCap project with API access enabled

### 1. Clone and install

```bash
git clone https://github.com/your-username/steno-voice-online.git
cd steno-voice-online
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your REDCap credentials:

```bash
REDCAP_API_URL=https://your-redcap-instance.com/api/
REDCAP_API_TOKEN=your_redcap_api_token_here
```

See [REDCAP_SETUP.md](./REDCAP_SETUP.md) for detailed REDCap project configuration.

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Test with parameters

The app requires URL parameters to identify participants. For testing, use:

```
http://localhost:3000/?record_id=1&diabetes_life=Ja
```

Or use the token-based URL format:

```
http://localhost:3000/?token=eyJyIjoiMSIsImQiOiJKYSJ9
```

## Production Deployment

### Build

```bash
npm run build
```

This creates a standalone build in `.next/standalone/`.

### Run in production

```bash
NODE_ENV=production node production-server.js
```

The production server includes:
- Access control (requires valid URL parameters)
- Blocked access to sensitive files (`.env`, `package.json`, source files)
- Static file serving with caching

### Docker

```bash
docker build -t steno-voice-online .
docker run -p 3000:3000 \
  -e REDCAP_API_URL=https://your-redcap-instance.com/api/ \
  -e REDCAP_API_TOKEN=your_token \
  steno-voice-online
```

### Deploy script

A deploy script is included for server deployments:

```bash
APP_DIR=/var/www/html ./deploy.sh
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `REDCAP_API_URL` | Yes | Your REDCap instance API endpoint |
| `REDCAP_API_TOKEN` | Yes | API token for your REDCap project |
| `PORT` | No | Server port (default: `3000`) |
| `HOSTNAME` | No | Server hostname (default: `0.0.0.0`) |
| `NEXT_PUBLIC_BASE_URL` | No | Base URL for redirects (defaults to request origin) |
| `NEXT_PUBLIC_CONTACT_NAME` | No | Support contact name shown to participants |
| `NEXT_PUBLIC_CONTACT_PHONE` | No | Support contact phone number |

## How It Works

1. **Participant receives a link** from a REDCap survey with their `record_id` encoded in the URL
2. **The `/redirect` endpoint** converts plain parameters into an obfuscated token and redirects
3. **The app loads** with the participant's record ID and shows voice exercises one at a time
4. **For each exercise**, the participant records audio using their microphone (PCM/WAV format)
5. **Recordings can be replayed** before moving to the next exercise
6. **On submission**, all recordings are uploaded directly to the participant's REDCap record as file attachments

### Voice Exercises

| Exercise | Description |
|----------|-------------|
| A Phonation | Sustain the "a" sound as long as possible |
| PaTaKa | Repeat syllables rapidly for 10 seconds (auto-timed) |
| Counting | Count from 1 to 20 at normal pace |
| Text Reading | Read a provided text passage aloud |
| Diabetes Life | Describe life with diabetes (conditional, based on survey response) |

## Project Structure

```
steno-voice-online/
├── app/
│   ├── page.tsx                    # Main voice exercise interface
│   ├── layout.tsx                  # Root layout
│   └── api/
│       ├── submit-recordings/      # REDCap file upload endpoint
│       └── device-info/            # Device telemetry endpoint
├── components/ui/                  # UI components (recording controls, audio player, etc.)
├── lib/
│   ├── audio-questions.ts          # Exercise definitions
│   ├── device-detection.ts         # Browser/OS detection
│   ├── param-obfuscation.js        # URL parameter encoding
│   └── webaudio-recorder.ts        # PCM audio recording via AudioWorklet
├── public/
│   ├── pcm-processor.js            # AudioWorklet processor
│   └── recording_examples/         # Example audio files
├── production-server.js            # Production server with security
├── deploy.sh                       # Deployment script
└── Dockerfile                      # Container build
```

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 15 (App Router)
- **UI**: [React](https://react.dev/) 19, [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/)
- **Audio**: Web Audio API with AudioWorklet for PCM recording
- **Data**: REDCap API for storage

## Browser Support

| Browser | Minimum Version |
|---------|----------------|
| Chrome | 66+ |
| Firefox | 60+ |
| Safari | 14.1+ |
| Edge | 79+ |

## License

This project is provided as-is for research purposes.
