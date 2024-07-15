from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from celery import Celery
from pydantic import BaseModel
import uuid
import os
from typing import List
import logging
import os
import time

from tasks import combine_videos

app = FastAPI()

# CORS middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

celery = Celery('tasks', broker='redis://redis:6379/0', backend='redis://redis:6379/0')

# Store job statuses
job_statuses = {}
CHUNK_SIZE = 8 * 1024 * 1024  # 1 MB chunks
class JobResponse(BaseModel):
    job_id: str

class JobStatus(BaseModel):
    status: str
    download_url: str = None

@app.post("/upload", response_model=JobResponse)
async def upload_files(file1: UploadFile = File(...), file2: UploadFile = File(...), file3: UploadFile = File(...)):
    job_id = str(uuid.uuid4())
    start_time = time.time()
    
    try:
        # Ensure upload directory exists
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)

        # Save uploaded files
        file_paths = []
        for index, file in enumerate([file1, file2, file3], start=1):
            file_path = os.path.join(upload_dir, f"{job_id}_{file.filename}")
            file_size = 0
            chunk_count = 0

            with open(file_path, "wb") as buffer:
                while True:
                    chunk = await file.read(CHUNK_SIZE)
                    if not chunk:
                        break
                    buffer.write(chunk)
                    file_size += len(chunk)
                    chunk_count += 1

            file_paths.append(file_path)
            logging.info(f"File {index} uploaded: {file.filename}, Size: {file_size} bytes, Chunks: {chunk_count}")

        # Log total upload time
        upload_time = time.time() - start_time
        logging.info(f"Total upload time for job {job_id}: {upload_time:.2f} seconds")

        # Start Celery task
        combine_videos.delay(job_id, file_paths)
        
        # Update job status (assuming job_statuses is a global or shared data structure)
        job_statuses[job_id] = "Processing"
        
        return JSONResponse(content={"job_id": job_id, "message": "Files uploaded successfully"}, status_code=200)
    
    except Exception as e:
        logging.error(f"Error uploading files for job {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload files: {str(e)}")

@app.get("/jobs/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str):
    status = job_statuses.get(job_id)
    if not status:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if status == "Complete":
        return JobStatus(status=status, download_url=f"/download/{job_id}")
    return JobStatus(status=status)

@app.get("/download/{job_id}")
async def download_video(job_id: str):
    file_path = f"output/{job_id}_combined.mp4"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, filename=f"{job_id}_combined.mp4")
