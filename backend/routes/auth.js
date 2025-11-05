import express from 'express'
import { register, generateOtp, verifyOtp, login, requestPasswordReset, resetPassword, updateProfile, changePassword, getProfile } from '../controller/auth.js'

const router = express.Router()

router.post('/register', register)
router.post('/generate-otp', generateOtp)
router.post('/verify-otp', verifyOtp)
router.post('/login', login)

// forgot-password
router.post('/forgot-password-request', requestPasswordReset)
router.post('/reset-password', resetPassword)

router.post('/profile', getProfile)
router.post('/update-profile', updateProfile)
router.post('/change-password', changePassword)

export default router