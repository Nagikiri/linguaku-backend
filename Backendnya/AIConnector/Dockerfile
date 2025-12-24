# ============================================
# LinguaKu AI Microservice - Production Dockerfile
# For deployment on Render.com
# ============================================
#
# Why Docker is required:
# - Whisper needs ffmpeg for audio processing
# - Render.com needs consistent environment
# - Ensures all dependencies work together
#
# Why ffmpeg is installed:
# - Whisper uses ffmpeg to decode audio files
# - Without it, transcription will fail
#
# How Render runs this service:
# 1. Render builds this Dockerfile
# 2. Exposes port 3000 publicly
# 3. Runs uvicorn to start FastAPI
# ============================================

# Use Python 3.10 slim (smaller image, faster builds)
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies (ffmpeg is critical for Whisper)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (better Docker caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY ai_service.py .

# Expose port 3000 (Render.com requirement)
EXPOSE 3000

# Health check (optional but recommended)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:3000/health')" || exit 1

# Start FastAPI with uvicorn
# - host 0.0.0.0: Accept connections from anywhere (required for Render)
# - port 3000: Render.com standard port
# - workers 1: Single worker (free tier limitation)
CMD ["uvicorn", "ai_service:app", "--host", "0.0.0.0", "--port", "3000", "--workers", "1"]
