"""
============================================
LinguaKu - Python AI Microservice
Whisper AI for Speech-to-Text Transcription
============================================

TUGAS:
- Menerima file audio dari Node.js backend
- Menjalankan model Whisper untuk transcription
- Mengembalikan teks hasil transcription
- TIDAK melakukan scoring atau penilaian
- TIDAK memberikan feedback

TEKNOLOGI:
- FastAPI (web framework)
- Faster-Whisper (optimized Whisper model)
- Port: Configurable via PORT env (default: 7000)

CARA KERJA:
1. Node.js kirim file audio via POST /transcribe
2. Python simpan temporary file
3. Whisper proses audio → text
4. Return JSON: {"success": true, "transcription": "..."}
5. Delete temporary file
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from faster_whisper import WhisperModel
import uvicorn
import tempfile
import os
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="LinguaKu AI Service",
    description="Whisper AI microservice for pronunciation practice",
    version="1.0.0"
)

# Load Whisper model (base.en for English only)
logger.info("🤖 Loading Whisper model...")
try:
    model = WhisperModel("base.en", device="cpu", compute_type="int8")
    logger.info("✅ Whisper model loaded successfully!")
except Exception as e:
    logger.error(f"❌ Failed to load Whisper model: {e}")
    model = None

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "LinguaKu AI Microservice",
        "status": "running",
        "model": "Whisper base.en",
        "port": int(os.getenv("PORT", 7000)),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """
    Health check endpoint for Render.com and monitoring
    Returns simple JSON status for uptime checks
    """
    return {
        "status": "UP",
        "service": "LinguaKu AI",
        "whisper_loaded": model is not None,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Transcribe audio file using Whisper AI
    
    Input:
    - file: Audio file (WAV, MP3, M4A, etc.)
    
    Output:
    - success: boolean
    - transcription: string (lowercase, trimmed)
    - duration: float (processing time in seconds)
    """
    
    if not model:
        raise HTTPException(
            status_code=503,
            detail="Whisper model not loaded. Please restart the service."
        )
    
    temp_path = None
    start_time = datetime.now()
    
    try:
        logger.info(f"📁 Received file: {file.filename} ({file.content_type})")
        
        # Read file content
        content = await file.read()
        file_size_mb = len(content) / (1024 * 1024)
        logger.info(f"📊 File size: {file_size_mb:.2f} MB")
        
        # Validate file size (max 10MB)
        if file_size_mb > 10:
            raise HTTPException(
                status_code=400,
                detail="File too large. Maximum size is 10MB."
            )
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(content)
            temp_path = tmp.name
        
        logger.info(f"💾 Saved to temp: {temp_path}")
        logger.info("🎤 Starting transcription...")
        
        # Transcribe with Whisper
        # Higher temperature (0.6) = more literal transcription, less auto-correction
        # Lower beam_size = faster, more phonetic-based transcription
        segments, info = model.transcribe(
            temp_path,
            language="en",
            beam_size=3,           # Reduced from 5 for more literal results
            best_of=3,             # Reduced from 5
            temperature=0.6,       # Increased from 0.0 to avoid aggressive correction
            vad_filter=True,       # Voice Activity Detection
            word_timestamps=False  # Disable word timestamps for speed
        )
        
        # Collect all segments
        transcription_parts = []
        for segment in segments:
            text = segment.text.strip()
            if text:
                transcription_parts.append(text)
                logger.info(f"  [{segment.start:.2f}s - {segment.end:.2f}s] {text}")
        
        # Join all parts
        full_transcription = " ".join(transcription_parts).strip().lower()
        
        # Calculate processing time
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        logger.info(f"✅ Transcription complete in {duration:.2f}s")
        logger.info(f"📝 Result: \"{full_transcription}\"")
        
        # Clean up temp file
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
            logger.info("🗑️ Temp file deleted")
        
        return {
            "success": True,
            "transcription": full_transcription,
            "duration": round(duration, 2),
            "language": info.language if hasattr(info, 'language') else "en",
            "segments_count": len(transcription_parts)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Transcription error: {str(e)}")
        
        # Clean up on error
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except:
                pass
        
        raise HTTPException(
            status_code=500,
            detail=f"Transcription failed: {str(e)}"
        )

if __name__ == "__main__":
    # Get port from environment variable (Render.com uses PORT=3000)
    port = int(os.getenv("PORT", 3000))
    
    logger.info("=" * 50)
    logger.info("🚀 Starting LinguaKu AI Microservice")
    logger.info("=" * 50)
    logger.info("📍 Host: 0.0.0.0")
    logger.info(f"📍 Port: {port}")
    logger.info(f"🔗 Health: http://localhost:{port}/health")
    logger.info(f"🔗 Transcribe: POST http://localhost:{port}/transcribe")
    logger.info("=" * 50)
    logger.info("")
    
    uvicorn.run(
        "ai_service:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info"
    )
