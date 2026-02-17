'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (pin.length !== 4) {
      setError('PIN must be 4 digits');
      setLoading(false);
      return;
    }

    const success = await login(pin);
    if (success) {
      router.push('/');
    } else {
      setError('Invalid PIN');
      setPin('');
    }
    setLoading(false);
  };

  const handlePinChange = (value: string) => {
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setPin(value);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1e293b',
        padding: '40px',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '360px',
        textAlign: 'center'
      }}>
        {/* Logo */}
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚗</div>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
          Car Manager
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '32px' }}>
          Enter your PIN to continue
        </p>

        {/* PIN Display */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '24px'
        }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: '56px',
                height: '64px',
                backgroundColor: '#334155',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: 'bold',
                color: pin[i] ? '#22c55e' : '#475569',
                border: pin[i] ? '2px solid #22c55e' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {pin[i] || '•'}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '16px' }}>{error}</p>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || pin.length !== 4}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: pin.length === 4 ? '#2563eb' : '#475569',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: pin.length === 4 ? 'pointer' : 'not-allowed',
            opacity: loading ? 0.7 : 1,
            transition: 'background-color 0.2s'
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        {/* Keypad */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginTop: '32px'
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((key, i) => (
            <button
              key={i}
              onClick={() => {
                if (key === 'del') {
                  setPin(pin.slice(0, -1));
                } else if (key !== null && pin.length < 4) {
                  setPin(pin + key);
                }
              }}
              disabled={key === null}
              style={{
                height: '56px',
                backgroundColor: key === null ? 'transparent' : '#334155',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '20px',
                fontWeight: '600',
                cursor: key === null ? 'default' : 'pointer',
                visibility: key === null ? 'hidden' : 'visible'
              }}
            >
              {key === 'del' ? '⌫' : key}
            </button>
          ))}
        </div>

        {/* Demo PIN hint */}
        <p style={{ color: '#64748b', fontSize: '12px', marginTop: '24px' }}>
          Demo PIN: 0000
        </p>
      </div>
    </div>
  );
}
