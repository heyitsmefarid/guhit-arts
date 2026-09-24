import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { safeNext } from '../../components/layout/RouteGuards';
import { firstName } from '../../utils/format';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PH_MOBILE_RE = /^(09|\+639)\d{9}$/;

function validate(f) {
  const e = {};
  if (f.fullName.trim().split(/\s+/).length < 2) e.fullName = 'Enter your first and last name.';
  if (!EMAIL_RE.test(f.email.trim())) e.email = 'Enter an email like name@email.com.';
  if (!PH_MOBILE_RE.test(f.contactNumber.replace(/[\s-]/g, ''))) e.contactNumber = 'Enter an 11-digit mobile number starting with 09.';
  if (f.password.length < 8) e.password = 'Use at least 8 characters.';
  if (f.confirm !== f.password) e.confirm = "The passwords don't match.";
  return e;
}

export default function SignUp() {
  const { signup } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ fullName: '', email: '', contactNumber: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => {
    const next = { ...form, [k]: e.target.value };
    setForm(next);
    if (touched) setErrors(validate(next));
  };

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setError('');
    try {
      const user = await signup(form);
      toast(`Account created. Welcome to Guhit, ${firstName(user.fullName)}!`);
      navigate(safeNext(params.get('next'), user.role), { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const field = (id, label, props = {}, hint) => (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className="input"
        value={form[id]}
        onChange={set(id)}
        aria-invalid={!!errors[id]}
        aria-describedby={errors[id] ? `${id}-err` : hint ? `${id}-hint` : undefined}
        {...props}
      />
      {errors[id] ? (
        <p id={`${id}-err`} className="error">
          {errors[id]}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="hint">
            {hint}
          </p>
        )
      )}
    </div>
  );

  return (
    <AuthLayout
      title="Create an account"
      subtitle="It takes a minute. You can shop and send requests right after."
      footer={
        <p>
          Already have an account? <Link to={`/login${params.get('next') ? `?next=${encodeURIComponent(params.get('next'))}` : ''}`}>Log in</Link>
        </p>
      }
    >
      <form className="form-grid auth__form" onSubmit={submit} noValidate>
        {error && (
          <div className="alert alert--error" role="alert">
            <TriangleAlert size={18} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
        {field('fullName', 'Full name', { autoComplete: 'name', placeholder: 'Juan dela Cruz' })}
        {field('email', 'Email', { type: 'email', autoComplete: 'email', placeholder: 'you@email.com' })}
        {field(
          'contactNumber',
          'Contact number',
          { type: 'tel', autoComplete: 'tel', inputMode: 'tel', placeholder: '0917 123 4567' },
          'We text you when an order is ready for pickup.'
        )}
        <div className="form-grid form-grid--2">
          {field('password', 'Password', { type: 'password', autoComplete: 'new-password' }, 'At least 8 characters.')}
          {field('confirm', 'Confirm password', { type: 'password', autoComplete: 'new-password' })}
        </div>
        <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={busy}>
          {busy ? <span className="spinner" aria-label="Creating account" /> : 'Create Account'}
        </button>
        <p className="tiny muted">
          This is a prototype. Your details stay in this browser and are not sent anywhere.
        </p>
      </form>
    </AuthLayout>
  );
}
