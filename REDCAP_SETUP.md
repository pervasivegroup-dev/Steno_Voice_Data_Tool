# RedCAP Integration Setup

This online version of Steno Voice integrates directly with RedCAP for data collection without requiring the desktop driver.

## Environment Configuration

Create a `.env.local` file in the root directory with the following variables:

```bash
# RedCAP API Configuration
REDCAP_API_URL=https://your-redcap-instance.com/api/
REDCAP_API_TOKEN=your_redcap_api_token_here
```

## Getting Your RedCAP API Token

1. Log into your RedCAP project
2. Go to **Project Setup** → **API**
3. Enable the API if not already enabled
4. Generate a new API token
5. Copy the token to your `.env.local` file

## RedCAP Project Configuration

Ensure your RedCAP project has the following fields configured:

- `record_id` - Unique identifier for each participant
- `audio_text_reading` - File upload field for text reading recording
- `audio_a_phonation` - File upload field for A phonation recording
- `audio_counting` - File upload field for counting recording
- `audio_pataka` - File upload field for PaTaKa recording
- `audio_diabetes_life` - File upload field for diabetes life description
- `submission_date` - Date/time of submission
- `total_recordings` - Number of recordings submitted
- `timestamp` - Additional timestamp field

## File Upload Fields

The audio recordings are converted to base64 and sent as text fields to RedCAP. Make sure your RedCAP project has sufficient storage capacity for the audio data.

## Testing

1. Start the development server: `npm run dev`
2. Navigate to the application
3. Record audio samples
4. Submit recordings - they will be sent to your RedCAP instance

## Troubleshooting

- Check browser console for error messages
- Verify RedCAP API token is correct
- Ensure RedCAP API is enabled in your project
- Check that all required fields exist in your RedCAP project
