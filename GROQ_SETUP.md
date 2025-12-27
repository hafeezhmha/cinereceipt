# 🤖 AI Taste Profile Setup

This feature uses Groq + Llama 3.3 to generate personalized taste profiles based on your Letterboxd reviews!

## Setup Instructions

### 1. Get a Free Groq API Key
1. Go to https://console.groq.com/
2. Sign up for a free account
3. Navigate to "API Keys" section
4. Click "Create API Key"
5. Copy your API key

### 2. Add the API Key

**Option A: Create a .env file (Recommended)**
```bash
# In your project root
echo "GROQ_API_KEY=your_actual_api_key_here" > .env
```

**Option B: Set environment variable temporarily**
```bash
export GROQ_API_KEY=your_actual_api_key_here
```

**Option C: Set permanently in your shell**
Add to your `~/.bashrc` or `~/.zshrc`:
```bash
export GROQ_API_KEY=your_actual_api_key_here
```

### 3. Restart the Dev Server
```bash
npm run dev
```

## What It Does

The AI analyzes:
- ✅ Your watched films & ratings
- ✅ Your top directors & actors
- ✅ Your written reviews (up to 10)
- ✅ Your viewing patterns

Then generates a **2-3 sentence personalized taste profile** that appears on your receipt!

## Example Output

> "You're drawn to character-driven narratives with strong performances, favoring intimate dramas over spectacle. Your appreciation for both Scorsese's crime epics and Linklater's conversational pieces suggests a taste for films that prioritize dialogue and human complexity. The high rating for 'Past Lives' shows your affinity for emotionally resonant, quietly powerful storytelling."

## Cost

- **FREE** on Groq (generous free tier)
- Uses ~200 tokens per receipt
- Much faster than OpenAI/Claude APIs

## Without API Key

If no API key is provided, the app works perfectly fine - you just won't get the AI taste profile section on receipts!
