import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAPI, forgotPasswordAPI, resetPasswordAPI } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { Shield, X, Lock, Mail, ChevronRight, AlertCircle, BookOpen } from "lucide-react";
import loginBg from "../assets/login.jpg";
import appLogo from "../assets/smartshelf_logo.png";

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    // Theme initialization
    useState(() => {
        const savedTheme = localStorage.getItem("theme") || "smartshelf";
        const themeClass = savedTheme === 'original' ? 'smartshelf-theme' : `${savedTheme}-theme`;
        document.body.classList.remove("light-theme", "lightblue-theme", "original-theme", "smartshelf-theme", "dark-theme", "blue-theme");
        document.body.classList.add(themeClass);
    }, []);
    const [authMode, setAuthMode] = useState('login');
    const [form, setForm] = useState({ email: "", password: "", otp: "", newPassword: "" });
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(form.email)) {
            setError("Identification malformed. Please enter a complete email address.");
            return;
        }

        setLoading(true);
        try {
            const res = await loginAPI(form.email, form.password);
            const { token, user } = res.data.data;
            if (user.role !== "admin") {
                setError("Access denied. Restricted to system administrators.");
                setLoading(false);
                return;
            }
            login(token, user);
            navigate("/admin");
        } catch (err) {
            setError(err.response?.data?.message || "Authentication failed. Check credentials.");
        } finally {
            setLoading(false);
        }
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!form.email || !emailRegex.test(form.email)) {
            setError("Identification required. Please enter a valid email address.");
            return;
        }

        setLoading(true);
        try {
            const res = await forgotPasswordAPI(form.email);
            setMessage(res.data?.message || "Security OTP transmitted to your inbox.");
            setAuthMode('reset');
        } catch (err) {
            setError(err.response?.data?.message || "Failed to process request.");
        } finally {
            setLoading(false);
        }
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        if (!form.otp || !form.newPassword) {
            setError("Validation incomplete. Fields missing.");
            return;
        }
        setLoading(true);
        try {
            const res = await resetPasswordAPI(form.otp, form.newPassword);
            setMessage(res.data?.message || "Credential reset successful. Identity verified.");
            setAuthMode('login');
            setForm({ ...form, password: "", otp: "", newPassword: "" });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to reset password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundImage: `url(${loginBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: '20px',
            position: 'relative'
        }}>
            {/* Darken/Green tint overlay to match image */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(85, 107, 47, 0.65)',
                zIndex: 1
            }}></div>

            <div className="auth-card" style={{
                maxWidth: '440px',
                width: '100%',
                background: 'var(--surface)',
                borderRadius: '16px',
                padding: '50px 48px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                zIndex: 2,
                textAlign: 'center',
                animation: 'fadeIn 0.8s ease-out',
                border: '1px solid var(--border)'
            }}>
                {/* Brand Header */}
                <div style={{ marginBottom: '40px' }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        background: 'transparent',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                        overflow: 'hidden',
                        padding: '0'
                    }}>
                        <img src={appLogo} alt="SmartShelf Logo" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
                    </div>
                    <h1 style={{
                        fontFamily: "'Playfair Display', 'Georgia', serif",
                        fontSize: '2.5rem',
                        fontStyle: 'italic',
                        fontWeight: 800,
                        color: 'var(--primary)',
                        margin: 0,
                        letterSpacing: '-1px'
                    }}>SmartShelf</h1>
                    <p style={{ color: 'var(--muted)', fontSize: '1rem', marginTop: '4px', fontWeight: 500 }}>Welcome Back, Curator</p>
                </div>

                {error && (
                    <div style={{
                        padding: '10px 14px',
                        background: '#FEE2E2',
                        borderRadius: '8px',
                        color: '#B91C1C',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        marginBottom: '20px',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                {message && (
                    <div style={{
                        padding: '10px 14px',
                        background: '#DCFCE7',
                        borderRadius: '8px',
                        color: '#15803D',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        marginBottom: '20px',
                        textAlign: 'left'
                    }}>
                        {message}
                    </div>
                )}

                {authMode === 'login' && (
                    <form onSubmit={handleLoginSubmit}>
                        <div className="field" style={{ textAlign: 'left', marginBottom: '24px' }}>
                            <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '0.1em', marginBottom: '8px', display: 'block' }}>EMAIL ADDRESS</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                placeholder="curator@smartshelf.com"
                                style={{ width: '100%', padding: '14px 16px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text)' }}
                            />
                        </div>

                        <div className="field" style={{ textAlign: 'left', marginBottom: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '0.1em', margin: 0 }}>PASSWORD</label>
                                <span
                                    style={{ fontSize: '0.7rem', color: 'var(--muted)', cursor: 'pointer', fontWeight: 700 }}
                                    onClick={() => { setAuthMode('forgot'); setError(''); setMessage(''); }}
                                >
                                    Forgot Password?
                                </span>
                            </div>
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                required
                                placeholder="••••••••"
                                style={{ width: '100%', padding: '14px 16px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text)' }}
                            />
                        </div>

                        <button
                            className="btn"
                            type="submit"
                            disabled={loading}
                            style={{
                                height: '54px',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                fontWeight: 800,
                                background: 'var(--primary)',
                                color: 'var(--on-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                border: 'none',
                                cursor: 'pointer',
                                width: '100%',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            {loading ? "AUTHENTICATING..." : <>SIGN IN <ChevronRight size={18} /></>}
                        </button>
                    </form>
                )}

                {authMode === 'forgot' && (
                    <form onSubmit={handleForgotSubmit}>
                        <div className="field" style={{ textAlign: 'left', marginBottom: '24px' }}>
                            <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '0.1em', marginBottom: '8px', display: 'block' }}>RECOVERY EMAIL</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                placeholder="curator@smartshelf.com"
                                style={{ width: '100%', padding: '14px 16px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text)' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button className="btn" type="submit" disabled={loading} style={{ height: '54px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 800, background: 'var(--primary)', color: 'var(--on-primary)', border: 'none', cursor: 'pointer' }}>
                                {loading ? "SENDING..." : "SEND RECOVERY CODE"}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setAuthMode('login'); setError(''); setMessage(''); }}
                                style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: '10px' }}
                            >
                                Back to Sign In
                            </button>
                        </div>
                    </form>
                )}

                {authMode === 'reset' && (
                    <form onSubmit={handleResetSubmit}>
                        <div className="field" style={{ textAlign: 'left', marginBottom: '24px' }}>
                            <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '0.1em', marginBottom: '8px', display: 'block' }}>SECURITY OTP</label>
                            <input
                                type="text"
                                name="otp"
                                value={form.otp}
                                onChange={handleChange}
                                required
                                placeholder="Enter 6-digit code"
                                style={{ width: '100%', padding: '14px 16px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text)' }}
                            />
                        </div>
                        <div className="field" style={{ textAlign: 'left', marginBottom: '24px' }}>
                            <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '0.1em', marginBottom: '8px', display: 'block' }}>NEW SECURE PASSWORD</label>
                            <input
                                type="password"
                                name="newPassword"
                                value={form.newPassword}
                                onChange={handleChange}
                                required
                                placeholder="Min 8 characters"
                                style={{ width: '100%', padding: '14px 16px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text)' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button className="btn" type="submit" disabled={loading} style={{ height: '54px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 800, background: 'var(--primary)', color: 'var(--on-primary)', border: 'none', cursor: 'pointer' }}>
                                {loading ? "UPDATING..." : "UPDATE CREDENTIALS"}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setAuthMode('login'); setError(''); setMessage(''); }}
                                style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: '10px' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {/* Secure Access Footer */}
                <div style={{ marginTop: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#9CA3AF', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Lock size={12} /> SECURE ADMINISTRATIVE ACCESS
                </div>

                {/* Bottom Site Footer */}
                <div style={{ position: 'absolute', bottom: '-80px', left: 0, right: 0, textAlign: 'center', zIndex: 1 }}>
                    <p style={{ color: '#E5E7EB', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', maxWidth: '400px', margin: '0 auto 15px', lineHeight: '1.4' }}>
                        © 2024 SMARTSHELF. CURATING KNOWLEDGE WITH ORGANIC PRECISION.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', color: '#E5E7EB', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase' }}>
                        <span style={{ cursor: 'pointer' }}>Documentation</span>
                        <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
                        <span style={{ cursor: 'pointer' }}>Library Standards</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
