import { useState, useRef } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../firebase';

/**
 * useFirebaseOtp — handles Firebase Phone Auth OTP flow.
 *
 * Usage:
 *   const { sendOtp, verifyOtp, loading, error, otpSent } = useFirebaseOtp();
 *
 *   // Step 1: send OTP
 *   await sendOtp('+919876543210', 'recaptcha-container');
 *
 *   // Step 2: verify OTP → returns Firebase ID token
 *   const idToken = await verifyOtp('123456');
 */
const useFirebaseOtp = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const confirmationResultRef = useRef(null);
    const recaptchaVerifierRef = useRef(null);

    const clearError = () => setError('');

    /**
     * Sends OTP to the given phone number via Firebase.
     * @param {string} phone - Phone number with country code, e.g. "+919876543210"
     * @param {string} recaptchaContainerId - DOM element ID for invisible reCAPTCHA
     */
    const sendOtp = async (phone, recaptchaContainerId = 'recaptcha-container') => {
        setLoading(true);
        setError('');
        try {
            // Format phone: ensure it has country code
            let formattedPhone = phone.trim();
            if (!formattedPhone.startsWith('+')) {
                // Default to India (+91) if no country code
                const digits = formattedPhone.replace(/\D/g, '');
                if (digits.length === 10) {
                    formattedPhone = '+91' + digits;
                } else if (digits.length === 12 && digits.startsWith('91')) {
                    formattedPhone = '+' + digits;
                } else {
                    formattedPhone = '+91' + digits;
                }
            }
            console.log('Firebase: sending OTP to', formattedPhone);

            // Clear previous reCAPTCHA if exists
            if (recaptchaVerifierRef.current) {
                try { recaptchaVerifierRef.current.clear(); } catch (e) {}
                recaptchaVerifierRef.current = null;
            }

            // Create invisible reCAPTCHA
            recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaContainerId, {
                size: 'invisible',
                callback: () => {},
                'expired-callback': () => {
                    setError('reCAPTCHA expired. Please try again.');
                }
            });

            const confirmationResult = await signInWithPhoneNumber(
                auth,
                formattedPhone,
                recaptchaVerifierRef.current
            );
            confirmationResultRef.current = confirmationResult;
            setOtpSent(true);
            return true;
        } catch (err) {
            console.error('Firebase sendOtp error:', err);
            let msg = 'Failed to send OTP. ';
            if (err.code === 'auth/invalid-phone-number') msg = 'Invalid phone number. Use format: +919876543210';
            else if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Try again in a few minutes.';
            else if (err.code === 'auth/quota-exceeded') msg = 'SMS quota exceeded.';
            else if (err.code === 'auth/billing-not-enabled') msg = 'Firebase billing not enabled. Use a test phone number from Firebase Console.';
            else if (err.code === 'auth/captcha-check-failed') msg = 'reCAPTCHA failed. Please refresh and try again.';
            else msg += err.message || 'Please try again.';
            setError(msg);
            return false;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Verifies the OTP entered by the user.
     * @param {string} otp - 6-digit OTP
     * @returns {string|null} Firebase ID token on success, null on failure
     */
    const verifyOtp = async (otp) => {
        if (!confirmationResultRef.current) {
            setError('Please send OTP first.');
            return null;
        }
        setLoading(true);
        setError('');
        try {
            const result = await confirmationResultRef.current.confirm(otp);
            const idToken = await result.user.getIdToken();
            return idToken;
        } catch (err) {
            console.error('Firebase verifyOtp error:', err);
            let msg = 'Invalid OTP. ';
            if (err.code === 'auth/invalid-verification-code') msg = 'Incorrect OTP. Please check and try again.';
            else if (err.code === 'auth/code-expired') msg = 'OTP has expired. Please request a new one.';
            else msg += err.message || '';
            setError(msg);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setOtpSent(false);
        setError('');
        confirmationResultRef.current = null;
    };

    return { sendOtp, verifyOtp, loading, error, otpSent, clearError, reset };
};

export default useFirebaseOtp;
