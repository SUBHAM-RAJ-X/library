import { API_BASE_URL, API_ENDPOINTS } from '../config/api'

// Generic API request function
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`
  
  // Get auth token from localStorage if available
  const token = localStorage.getItem('authToken')
  
  // Build headers with proper typing
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string> || {}),
    },
  }

  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    
    return response
  } catch (error) {
    console.error('API Request failed:', error)
    throw error
  }
}

// Specific API methods
export const api = {
  // GET request
  get: (endpoint: string) => apiRequest(endpoint, { method: 'GET' }),
  
  // POST request
  post: (endpoint: string, data?: any) => 
    apiRequest(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  // PUT request
  put: (endpoint: string, data?: any) => 
    apiRequest(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  // DELETE request
  delete: (endpoint: string) => apiRequest(endpoint, { method: 'DELETE' }),
  
  // PATCH request
  patch: (endpoint: string, data?: any) => 
    apiRequest(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
}

export { API_ENDPOINTS }
