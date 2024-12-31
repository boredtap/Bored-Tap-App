// src/services/authService.js
export const getStoredAuth = () => {
    const token = localStorage.getItem('accessToken');
    const tokenType = localStorage.getItem('tokenType');
    return token && tokenType ? `${tokenType} ${token}` : null;
  };
  
  export const setAuthData = (authResponse, userData) => {
    localStorage.setItem('accessToken', authResponse.access_token);
    localStorage.setItem('tokenType', authResponse.token_type);
    localStorage.setItem('telegramUser', JSON.stringify(userData));
  };
  
  export const clearAuthData = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('tokenType');
    localStorage.removeItem('telegramUser');
  };
  
  export const isAuthenticated = () => {
    return !!getStoredAuth();
  };
  
  export const getTelegramUser = () => {
    const userStr = localStorage.getItem('telegramUser');
    return userStr ? JSON.parse(userStr) : null;
  };
  
  // Authentication API calls
  export const signIn = async (username, password) => {
    const response = await fetch("https://bored-tap-api.onrender.com/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "accept": "application/json"
      },
      body: new URLSearchParams({
        grant_type: "password",
        username,
        password,
        scope: "",
        client_id: "string",
        client_secret: "string"
      })
    });
  
    if (!response.ok) {
      throw new Error(`Sign in failed: ${response.statusText}`);
    }
  
    return response.json();
  };
  
  export const signUp = async (userData) => {
    const response = await fetch("https://bored-tap-api.onrender.com/sign-up", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "accept": "application/json"
      },
      body: JSON.stringify(userData)
    });
  
    if (!response.ok) {
      throw new Error(`Registration failed: ${response.statusText}`);
    }
  
    return response.json();
  };