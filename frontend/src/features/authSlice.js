
import { createSlice, current } from '@reduxjs/toolkit'

const getInitialState = () => {
    try {
        const token = localStorage.getItem('token')
        const userName = localStorage.getItem('userName')
        if (token && userName){
            return {
                currentUser: JSON.parse(userName),
                isAuthenticated: true,
                token: token,
                loading: false,
                error: null
            }
        }
    } catch (error) {
        console.error('Error loading auth state from localStorage:', error)
    }
    return {
        currentUser: null,
        isAuthenticated: false,
        token: null,
        loading: true,
        error: null
    }
}

const initialState = getInitialState()

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginStart: (state) => {
            state.loading = true
            state.error = null
        },
        loginSuccess: (state, action) => {
            state.loading = false
            state.isAuthenticated = true
            state.currentUser = action.payload.userName
            state.token = action.payload.token
            state.error = null

            localStorage.setItem('token', action.payload.token)
            localStorage.setItem('userName', JSON.stringify(action.payload.userName))
        },
        loginFailed: (state, action) =>{
            state.loading = false
            state.isAuthenticated = false
            state.currentUser = null
            state.token = null
            state.error = action.payload
        },
        logout: (state) => {
            state.currentUser = null
            state.isAuthenticated = false
            state.token = null
            state.error = null
            state.loading = false
            
            localStorage.removeItem('token')
            localStorage.removeItem('userName')
        },
        updateUser: (state, action) => {
            const prev = state.currentUser
            let base = {}
            if (prev && typeof prev === 'object') {
                base = prev
            } else if (typeof prev === 'string') {
                base = { userName: prev }
            }

            let payload = action.payload
            if (payload && typeof payload !== 'object') {
                payload = { userName: String(payload) }
            }

            state.currentUser = { ...base, ...payload }
            
            // Update localStorage
            localStorage.setItem('userName', JSON.stringify(state.currentUser))
        },
        clearError: (state) => {
            state.error = null
        },
        setToken: (state, action) => {
            state.token = action.payload
            localStorage.setItem('token', action.payload)
        }
    }
})

export const {
    loginStart,
    loginSuccess,
    loginFailure,
    logout,
    updateUser,
    clearError,
    setToken
} = authSlice.actions
export default authSlice.reducer