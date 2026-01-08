import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

class ApiClientCore {
    public client: AxiosInstance;
    public baseURL: string;

    constructor() {
        this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        this.setupInterceptors();
    }

    private setupInterceptors() {
        this.client.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                if (typeof window !== 'undefined') {
                    const token = localStorage.getItem('auth_token');
                    if (token) {
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        this.client.interceptors.response.use(
            (response: AxiosResponse) => response.data,
            (error) => {
                const message = error.response?.data?.error || error.message || 'An error occurred';
                const apiError = new Error(message) as any;
                apiError.status = error.response?.status;
                apiError.data = error.response?.data;
                return Promise.reject(apiError);
            }
        );
    }
}

export const apiClientCore = new ApiClientCore();
export const http = apiClientCore.client;
