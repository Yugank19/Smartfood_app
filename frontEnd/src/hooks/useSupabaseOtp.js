import { API_BASE_URL } from '../config';
import axios from 'axios';

/**
 * useSupabaseOtp — Hybrid OTP hook
 *
 * sendOtp returns: { ok: bool, devOtp: string|null, supabaseSent: bool }
 * verifyOtp returns: bool
 */
const useSupabaseOtp = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const toE164 = (phone) => {
        const digits = phone.replace(/\D/g, '');
        if (phone.trim().startsWith('+')) return phone.trim();
        if (digits.length === 10) return '+91' + digits;
        if (digits.length === 12 && digits.startsWith('91')) return '+' + digits;
        return '+' + digits;
    };

    const normalize = (phone) => {
        const digits = phone.replace(/\D/g, '');
        return digits.length > 10 ? digits.slice(-10) : digits;
    };

    /**
     * Send OTP.
     * Returns { ok, devOtp, supabaseSent } — devOtp is the code to show in UI.
     */
    const sendOtp = async (phone) => {
        setLoading(true);
        setError('');
        try {
            const normalizedPhone = normalize(phone);
            const res = await axios.post(`${API_BASE_URL}/api/auth/supabase/send-otp`, {
                phone: normalizedPhone
            });
            const data = res.data;
            return {
                ok: true,
                devOtp: data.devOtp || null,
                supabaseSent: data.supabaseSent === true
            };
        } catch (e) {
            console.error('[OTP] Send error:', e);
            setError('Failed to send OTP. Please check your connection and try again.');
            return { ok: false, devOtp: null, supabaseSent: false };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Verify OTP — tries Supabase JS SDK first, then backend fallback.
     */
    const verifyOtp = async (phone, token, supabaseSent) => {
        setLoading(true);
        setError('');
        try {
            const normalizedPhone = normalize(phone);
            // Skip Supabase JS SDK verification entirely as the connection is cut.
            // We now use pure backend-managed simulated OTPs.


            // Backend OTP verification (works for ALL numbers)
            const res = await axios.post(`${API_BASE_URL}/api/auth/supabase/verify-otp`, {
                phone: normalizedPhone,
                token: token.trim()
            });

            if (res.data?.verified) {
                return true;
            }

            setError('Invalid OTP. Please try again.');
            return false;
        } catch (e) {
            const msg = e.response?.data?.message || 'Invalid OTP. Please try again.';
            setError(msg);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const reset = () => setError('');

    return { sendOtp, verifyOtp, loading, error, normalize, toE164, reset };
};

export default useSupabaseOtp;
