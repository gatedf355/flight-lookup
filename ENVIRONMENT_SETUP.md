# Environment Setup Guide

## Required Environment Variables

To run the FlightLookup server, you need to set up the following environment variables:

### 1. Create a .env file

Create a `.env` file in the project root directory (same level as this file) with the following content:

```bash
# FlightRadar24 API Key (REQUIRED)
FR24_API_KEY=your_actual_api_key_here

# Server Configuration (optional)
PORT=3001
NODE_ENV=development

# Logging (optional)
LOG_LEVEL=info
```

### 2. Get Your FlightRadar24 API Key

1. Go to [FlightRadar24 API](https://www.flightradar24.com/api)
2. Sign up for an account
3. Generate an API key
4. Copy the API key to your `.env` file

### 3. File Structure

Your project should look like this:
```
FlightLookup/
├── .env                    ← Create this file here
├── server/
├── web/
├── frontend/
└── ...
```

### 4. Verify Setup

After creating the `.env` file, restart your server. You should see:
```
Environment variables loaded from: /path/to/your/project/.env
```

If you see a warning about no .env file found, check that:
- The file is named exactly `.env` (not `.env.txt` or similar)
- The file is in the project root directory
- There are no extra spaces or quotes around the values

### 5. Troubleshooting

If you get a "FR24_API_KEY environment variable is not set" error:
1. Verify your `.env` file exists and is in the correct location
2. Check that the file contains `FR24_API_KEY=your_key_here`
3. Restart the server after making changes
4. Ensure there are no spaces around the `=` sign

### Security Notes

- Never commit your `.env` file to version control
- Keep your API keys secure and don't share them
- The `.env` file is already in `.gitignore` to prevent accidental commits
