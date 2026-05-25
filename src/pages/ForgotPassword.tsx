import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/api';
import { ArrowLeft, Mail, KeyRound, Lock } from 'lucide-react';
import logo from '../assets/logo.png';

type Step = 'email' | 'otp' | 'newPassword' | 'done';

const RESEND_COOLDOWN = 60; // seconds before allow resend

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const sendOtp = useCallback(async (targetEmail: string) => {
    const res = await adminApi.auth.forgotPassword(targetEmail);
    if (res.success) {
      setInfo(`OTP sent to recovery inbox — check your inbox (and spam folder).`);
      setCountdown(RESEND_COOLDOWN);
      setError('');
    } else {
      setError(res.message || 'Failed to send OTP. Please try again.');
    }
    return res.success;
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const ok = await sendOtp(email);
    setLoading(false);
    if (ok) setStep('otp');
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setError('');
    setOtp('');
    await sendOtp(email);
    setResending(false);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) {
      setError('Please enter the full 6-digit OTP.');
      return;
    }
    setStep('newPassword');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const res = await adminApi.auth.resetPassword(email, otp, newPassword);
    setLoading(false);
    if (res.success) {
      setStep('done');
    } else {
      setError(res.message || 'Invalid or expired OTP. Request a new one.');
      setStep('otp');
    }
  };

  const bg: React.CSSProperties = {
    background: 'linear-gradient(135deg, #08192E 0%, #0D2847 50%, #050F1C 100%)',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  };

  const btn = (disabled = false): React.CSSProperties => ({
    width: '100%', padding: '12px', borderRadius: '10px', fontWeight: 600,
    fontSize: '14px', color: '#fff', border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled ? '#ccc' : 'linear-gradient(135deg, #F5820A 0%, #e06900 100%)',
    boxShadow: disabled ? 'none' : '0 4px 16px rgba(245,130,10,0.35)',
  });

  const outlineBtn = (disabled = false): React.CSSProperties => ({
    width: '100%', padding: '10px', borderRadius: '10px', fontWeight: 500,
    fontSize: '13px', color: disabled ? '#aaa' : '#374151',
    border: `1px solid ${disabled ? '#e5e7eb' : '#d1d5db'}`,
    background: '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
  });

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', border: '1px solid #d1d5db',
    borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none',
  };

  const errorBox = (msg: string) => (
    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{msg}</div>
  );

  const infoBox = (msg: string) => (
    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{msg}</div>
  );

  const iconCircle = (Icon: React.ElementType) => (
    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(245,130,10,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={18} style={{ color: '#F5820A' }} />
    </div>
  );

  return (
    <div style={bg}>
      <div style={{ width: '100%', maxWidth: '440px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <img src={logo} alt="Selebration" style={{ height: '56px', width: 'auto', objectFit: 'contain' }} />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Admin Password Recovery</p>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>

          {/* Step indicator */}
          {step !== 'done' && (
            <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
              {(['email', 'otp', 'newPassword'] as Step[]).map((s, i) => (
                <div key={s} style={{ flex: 1, height: '4px', borderRadius: '2px', background: ['email', 'otp', 'newPassword'].indexOf(step) >= i ? '#F5820A' : '#e5e7eb' }} />
              ))}
            </div>
          )}

          {/* ── Step 1: Email ── */}
          {step === 'email' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                {iconCircle(Mail)}
                <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111', margin: 0 }}>Forgot Password</h1>
              </div>
              <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '24px' }}>Enter your admin email. An OTP will be sent to the recovery inbox.</p>

              {error && errorBox(error)}

              <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Admin Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@example.com" style={inputStyle} />
                </div>
                <button type="submit" disabled={loading} style={btn(loading)}>
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            </>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 'otp' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                {iconCircle(KeyRound)}
                <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111', margin: 0 }}>Enter OTP</h1>
              </div>

              {info && infoBox(info)}
              {error && errorBox(error)}

              <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>6-Digit OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    placeholder="123456"
                    maxLength={6}
                    autoFocus
                    style={{ ...inputStyle, fontSize: '28px', letterSpacing: '10px', textAlign: 'center', fontWeight: 700 }}
                  />
                  <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>OTP expires in 10 minutes. Check spam if not in inbox.</p>
                </div>

                <button type="submit" disabled={otp.length !== 6} style={btn(otp.length !== 6)}>
                  Verify OTP
                </button>

                {/* Resend — actually calls the API */}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={countdown > 0 || resending}
                  style={outlineBtn(countdown > 0 || resending)}
                >
                  {resending ? 'Sending...' : countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                </button>
              </form>
            </>
          )}

          {/* ── Step 3: New Password ── */}
          {step === 'newPassword' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                {iconCircle(Lock)}
                <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111', margin: 0 }}>Set New Password</h1>
              </div>
              <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '24px' }}>Choose a strong new password for your admin account.</p>

              {error && errorBox(error)}

              <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>New Password</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="••••••••" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Confirm Password</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="••••••••" style={inputStyle} />
                </div>
                <button type="submit" disabled={loading} style={btn(loading)}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}

          {/* ── Step 4: Done ── */}
          {step === 'done' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f0fdf4', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <span style={{ fontSize: '28px', color: '#16a34a' }}>✓</span>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111', marginBottom: '8px' }}>Password Reset!</h2>
              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>Your password has been updated. You can now log in with your new password.</p>
              <button onClick={() => navigate('/login')} style={btn()}>Back to Login</button>
            </div>
          )}

          {/* Back to login */}
          {step !== 'done' && (
            <button
              onClick={() => navigate('/login')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '20px auto 0', background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer' }}
            >
              <ArrowLeft size={14} /> Back to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
