import axios from 'axios';

async function verify() {
    try {
        console.log('Sending request to /api/auth/google...');
        const response = await axios.post('http://localhost:3001/api/auth/google', {
            idToken: 'dummy-token'
        });
        console.log('Response:', response.data);
    } catch (error: any) {
        if (error.response) {
            console.log('Received expected error response:', error.response.status, error.response.data);
        } else {
            console.error('Connection failed:', error.message);
        }
    }
}

verify();
