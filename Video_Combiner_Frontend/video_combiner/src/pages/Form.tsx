import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UploadFile from '../Components/UploadFile';

const Form: React.FC = () => {
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (jobId) {
      const interval = setInterval(async () => {
        try {
          const response = await axios.get(`http://localhost:8000/jobs/${jobId}`);
          setStatus(response.data.status);
          if (response.data.status === 'Complete') {
            setDownloadUrl(response.data.download_url);
            clearInterval(interval);
          }
        } catch (error) {
          console.error('Error fetching job status:', error);
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [jobId]);

  const handleUploadSuccess = (newJobId: string) => {
    setJobId(newJobId);
  };

  return (
    <div className='flex justify-center'>
    <div className="container mx-auto p-4">
      <h1 className="text-base text-center font-bold mb-4">Video Combiner</h1>
      <UploadFile onUploadSuccess={handleUploadSuccess} />
      {jobId && <p className=" text-base mt-4">Job ID: {jobId}</p>}
      {status && <p className=" text-base mt-2">Status: {status}</p>}
      {downloadUrl && (
        <a
          href={`http://localhost:8000${downloadUrl}`}
          download
          className="mt-4 inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
        >
          Download Combined Video
        </a>
      )}
    </div>
    </div>
  );
};

export default Form;
