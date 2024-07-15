import React, { useState } from 'react';
import { uploadFiles } from '../../api/index'
import { UploadFileProps } from './UploadFile.types';

const UploadFile: React.FC<UploadFileProps> = ({ onUploadSuccess }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
    setError(null);
  };
  

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (files.length !== 3) {
      setError('Please select exactly 3 files.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const jobId = await uploadFiles(files[0], files[1], files[2]);
      onUploadSuccess(jobId);
    } catch (error) {
      setError('Upload failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
    <div className="mb-4">
      <p className="text-gray-700 text-sm font-bold mb-2" aria-label="file-upload">Please select 3 video files</p>
      <input
        id="file-upload"
        type="file"
        onChange={handleFileChange}
        multiple
        required
        accept="video/*"
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      />
    </div>
    {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
    <button
      type="submit"
      disabled={isLoading || files.length !== 3}
      className={`w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
        isLoading || files.length !== 3 ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {isLoading ? 'Uploading...' : 'Upload'}
    </button>
  </form>
);
};

export default UploadFile;