import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BarChart3, ClipboardList, Eye, EyeOff, Info, Lock, Mail, Package, TriangleAlert } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { safeNext } from '../../components/layout/RouteGuards';
import { customerAccounts, staffAccounts } from '../../data/credentials';
import { firstName } from '../../utils/format';

const STAFF_PERKS = [
  { icon: ClipboardList, text: 'Approve orders and move them through the queue' },
  { icon: Package, text: 'Update prices, stock, and the product list' },
  { icon: BarChart3, text: 'See sales, open requests, and low-stock alerts' },
];

// One login form for both areas. `staff` switches the copy, the listed demo
// accounts, and where the user lands afterwards.
export default function Login({ staff = false }) {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password) {
      setError('Enter your email and password to log in.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const user = await login(form);
      toast(`Welcome back, ${firstName(user.fullName)}.`);
      navigate(safeNext(params.get('next'), user.role), { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const signupLink = `/signup${params.get('next') ? `?next=${encodeURIComponent(params.get('next'))}` : ''}`;
  const accounts = staff ? staffAccounts : customerAccounts;

  return (
    <AuthLayout
      title={staff ? 'Staff login' : 'Log in'}
      subtitle={
        staff ? 'Manage orders, digital requests, products, and customers.' : 'Shop, request digital services, and track your orders.'
      }
      artTitle={staff ? 'Run the counter from one screen.' : undefined}
      perks={staff ? STAFF_PERKS : undefined}
      footer={
        staff ? (
          <p>
            Not staff? <Link to="/login">Go to the customer login</Link>
          </p>
        ) : (
          <>
            <p>
              New to Guhit? <Link to={signupLink}>Create an account</Link>
            </p>
            <p className="auth__staff-link">
              Shop staff? <Link to="/admin/login">Log in to the admin panel</Link>
            </p>
          </>
        )
      }
    >
      <div className="alert alert--info demo-hint">
        <Info size={18} aria-hidden="true" />
        <div className="demo-hint__body">
          <p>
            <strong>{staff ? 'Demo staff accounts' : 'Demo accounts'}</strong>
          </p>
          <ul className="demo-accounts" role="list">
            {accounts.map((a) => (
              <li key={a.email}>
                <span>
                  <span className="demo-accounts__cred">
                    {a.email} / {a.password}
                  </span>
                  <span className="demo-accounts__label">{a.label}</span>
                </span>
                <button
                  type="button"
                  className="btn btn--sm btn--ghost demo-accounts__use"
                  onClick={() => {
                    setForm({ email: a.email, password: a.password });
                    setError('');
                  }}
                  aria-label={`Fill in ${a.email}`}
                >
                  Use
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <form className="form-grid auth__form" onSubmit={submit} noValidate>
        {error && (
          <div className="alert alert--error" role="alert">
            <TriangleAlert size={18} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
        <div className="field">
          <label htmlFor="email">Email</label>
          <div className="input-wrap">
            <Mail size={18} aria-hidden="true" />
            <input id="email" className="input" type="email" autoComplete="email" value={form.email} onChange={set('email')} placeholder="you@email.com" />
          </div>
        </div>
        <div className="field">
          <div className="field__row">
            <label htmlFor="password">Password</label>
            {!staff && (
              <Link to="/forgot-password" className="small">
                Forgot password?
              </Link>
            )}
          </div>
          <div className="input-wrap">
            <Lock size={18} aria-hidden="true" />
            <input
              id="password"
              className="input"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              value={form.password}
              onChange={set('password')}
            />
            <button
              type="button"
              className="icon-btn input-affix"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={busy}>
          {busy ? <span className="spinner" aria-label="Logging in" /> : 'Login'}
        </button>
        {!staff && (
          <Link to={signupLink} className="btn btn--ghost btn--lg btn--block">
            Create Account
          </Link>
        )}
      </form>
    </AuthLayout>
  );
}
