import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { useAuth } from '../../context/AuthContext';

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter the email you used to sign up.');
      return;
    }
    setBusy(true);
    setError('');
    const res = await requestPasswordReset(email);
    setSentTo(res.email);
    setBusy(false);
  };

  if (sentTo) {
    return (
      <AuthLayout title="Check your email" footer={<Link to="/login">Back to log in</Link>}>
        <div className="alert alert--success">
          <MailCheck size={20} aria-hidden="true" />
          <p>
            If an account uses <strong>{sentTo}</strong>, a reset link is on its way. It expires in 30 minutes.
          </p>
        </div>
        <p className="tiny muted" style={{ marginTop: 16 }}>
          Prototype note: no email is actually sent. Use the demo account on the login page.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your account email and we'll send you a link to set a new password."
      footer={
        <p>
          Remembered it? <Link to="/login">Log in</Link>
        </p>
      }
    >
      <form className="form-grid auth__form" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="reset-email">Email</label>
          <input
            id="reset-email"
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? 'reset-err' : undefined}
          />
          {error && (
            <p id="reset-err" className="error">
              {error}
            </p>
          )}
        </div>
        <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={busy}>
          {busy ? <span className="spinner" aria-label="Sending" /> : 'Send reset link'}
        </button>
      </form>
    </AuthLayout>
  );
}
