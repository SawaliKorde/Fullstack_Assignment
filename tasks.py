from celery import Celery
import subprocess
import os
import logging

celery = Celery('tasks', broker='redis://localhost:6379/0', backend='redis://localhost:6379/0')

logger = logging.getLogger(__name__)

@celery.task(bind=True, max_retries=3)
def combine_videos(self, job_id, file_paths):
    output_path = f"output/{job_id}_combined.mp4"
    
    try:
        # Combine videos using FFmpeg
        ffmpeg_command = [
            "ffmpeg",
            "-i", file_paths[0],
            "-i", file_paths[1],
            "-i", file_paths[2],
            '-filter_complex','concat=inputs=3:v=1:a=1',
            output_path
        ]
        
        subprocess.run(ffmpeg_command, check=True)
        
        # Update job status
        from main import job_statuses
        job_statuses[job_id] = "Complete"
        
        # Clean up input files
        for file_path in file_paths:
            os.remove(file_path)
    
    except subprocess.CalledProcessError as e:
        logger.error(f"FFmpeg error for job {job_id}: {str(e)}")
        from main import job_statuses
        job_statuses[job_id] = "Failed"
        self.retry(exc=e)
    
    except Exception as e:
        logger.error(f"Unexpected error for job {job_id}: {str(e)}")
        from main import job_statuses
        job_statuses[job_id] = "Failed"
        raise