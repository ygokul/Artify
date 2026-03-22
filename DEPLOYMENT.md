# Deployment Guide for Render

## Configuration Setup

This application uses hardcoded API keys stored in `src/config/api-keys.json`. Follow these steps to deploy:

### Step 1: Create the Configuration File

1. Copy the template file:
   ```bash
   cp src/config/api-keys.template.json src/config/api-keys.json
   ```

2. Update `src/config/api-keys.json` with your actual API keys:
   ```json
   {
     "stability": {
       "apiKey": "your-stability-api-key"
     },
     "mongodb": {
       "uri": "your-mongodb-connection-string"
     },
     "google": {
       "genaiApiKey": "your-google-genai-api-key"
     }
   }
   ```

### Step 2: For Production MongoDB

Replace the local MongoDB URI with your MongoDB Atlas connection string:
```
mongodb+srv://username:password@cluster.mongodb.net/artify?retryWrites=true&w=majority
```

### Step 3: Deployment Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

### Step 4: Deploy to Render

1. Push your code to GitHub
2. Connect your repo to Render
3. Set environment if using `.env` (optional - config is now hardcoded)
4. Deploy

## Important Security Notes

⚠️ **Security Warning**: This approach hardcodes sensitive API keys in the codebase. For production:

- ✅ **Better approach**: Use Render's environment variables instead:
  - Remove hardcoding
  - Set `STABILITY_API_KEY`, `MONGODB_URI`, `GOOGLE_GENAI_API_KEY` in Render dashboard
  - Update code to read from `process.env`

- ✅ **Keep `src/config/api-keys.json` in `.gitignore`** (already configured)

## File Locations

- Template: `src/config/api-keys.template.json`
- Configuration: `src/config/api-keys.json` (gitignored)
- Updated code:
  - `src/lib/mongodb.ts` - Now imports from config
  - `src/ai/flows/generate-image-from-prompt.ts` - Now imports from config
