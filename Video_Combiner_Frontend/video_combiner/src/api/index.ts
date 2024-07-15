import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const uploadFiles = async (file1: File, file2: File, file3: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file1', file1);
    formData.append('file2', file2);
    formData.append('file3', file3);

    try {
        const response = await axios.post<{ job_id: string }>(`${API_BASE_URL}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.job_id;
    } catch (error) {
        console.error('Upload failed:', error);
        throw error;
    }
};

export const getJobStatus = async (jobId: string): Promise<{ status: string, download_url?: string }> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/jobs/${jobId}`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch job status:', error);
        throw error;
    }
};