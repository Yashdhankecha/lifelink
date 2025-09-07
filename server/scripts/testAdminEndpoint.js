const axios = require('axios');

const testAdminEndpoint = async () => {
  try {
    // Create axios instance to handle cookies
    const client = axios.create({
      baseURL: 'http://localhost:5000',
      withCredentials: true
    });

    // First, login as admin to get token
    console.log('Logging in as admin...');
    const loginResponse = await client.post('/api/auth/admin/login', {
      email: 'admin@lifelink.com',
      password: 'admin123456'
    });

    console.log('Login successful');
    console.log('Response:', loginResponse.data);
    
    // Now test the admin requests endpoint
    console.log('Testing admin requests endpoint...');
    const requestsResponse = await client.get('/api/admin/requests');

    console.log('Admin requests endpoint working!');
    console.log('Response:', {
      success: requestsResponse.data.success,
      dataLength: requestsResponse.data.data?.requests?.length || 0,
      pagination: requestsResponse.data.data?.pagination
    });

  } catch (error) {
    console.error('Error testing admin endpoint:', error.response?.data || error.message);
  }
};

// Run the test
testAdminEndpoint();
