
import api from './api'

export const authService = {         // authService object to store the functions
    /**
     * Register
     * @param {string} userName
     * @param {string} email
     * @param {string} password
     */
    async register(userName, email, password){
        const response = await api.post('api/auth/register', {
            userName,
            email,
            password
        })
        return response.data
    },

    /**
     * Login
     * @param {string} userName
     * @param {string} password
     */
    async login(userName, password){
        const response = await api.post('api/auth/login',{
            userName,
            password
        })
        const { token, userName: returnedUserName } = response.data
        localStorage.setItem('token', token)
        localStorage.setItem('userName', JSON.stringify(returnedUserName))
    },

    async verifyOtp(email){
        const response = await api.post('api/auth/verify-otp',{email})
        return response.data
    },

    // Change password
    async changePassword(userName, currentPassword, newPassword){
        const response = await api.post('api/auth/change-password', {
            userName,
            currentPassword,
            newPassword
        })
        return response.data
    },

    // Update profile (supports avatar/base64, fullName, bio, email)
    async updateProfile(payload){
        const response = await api.post('api/auth/update-profile', payload)
        return response.data
    },

    // Get profile by userName
    async getProfile(userName){
        const response = await api.post('api/auth/profile', { userName })
        return response.data
    },

    // logout
    logout(){
        localStorage.removeItem('token')
        localStorage.removeItem('userName')
    },

    getCurrentUser(){
        return localStorage.getItem('userName')
    },

    getToken(){
        return localStorage.getItem('token')
    },

    isAuthenticated(){
        return !!this.getToken()
    }
}