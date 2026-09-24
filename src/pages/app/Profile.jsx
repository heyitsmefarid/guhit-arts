import { useRef, useState } from 'react';
import { Camera, RotateCcw, Trash2, TriangleAlert } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Avatar from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { resetDemoData } from '../../services/authService';
import { formatDate } from '../../utils/format';

// Shrinks the chosen photo to a 256px square so it fits in localStorage.
function resizeImage(file, size = 256) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file could not be opened as an image. Try a JPG or PNG.'));
    };
    img.src = url;
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    fullName: user.fullName,
    email: user.email,
    contactNumber: user.contactNumber ?? '',
    address: user.address ?? '',
  });
  const [avatar, setAvatar] = useState(user.avatar);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const dirty =
    avatar !== user.avatar ||
    form.fullName !== user.fullName ||
    form.email !== user.email ||
    form.contactNumber !== (user.contactNumber ?? '') ||
    form.address !== (user.address ?? '');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setAvatar(await resizeImage(file));
    } catch (err) {
      toast(err.message, { tone: 'error' });
    }
  };

  const save = async (e) => {
    e.preventDefault();
    const found = {};
    if (form.fullName.trim().split(/\s+/).length < 2) found.fullName = 'Enter your first and last name.';
    if (!EMAIL_RE.test(form.email.trim())) found.email = 'Enter an email like name@email.com.';
    if (form.contactNumber && !/^(09|\+639)\d{9}$/.test(form.contactNumber.replace(/[\s-]/g, ''))) found.contactNumber = 'Enter an 11-digit mobile number starting with 09.';
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setFormError('');
    try {
      await updateProfile({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        contactNumber: form.contactNumber.trim(),
        address: form.address.trim(),
        avatar,
      });
      toast('Profile saved.');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const onReset = () => {
    if (!window.confirm('Reset the prototype? This signs you out and restores the original demo data and accounts.')) return;
    resetDemoData();
    window.location.assign('/');
  };

  const preview = { ...user, fullName: form.fullName || user.fullName, avatar };

  return (
    <div className="page">
      <PageHeader title="Profile" description={`Member since ${formatDate(user.createdAt, { month: 'long', year: 'numeric' })}`} />

      <form className="profile" onSubmit={save} noValidate>
        <section className="panel profile__photo" aria-labelledby="photo-h">
          <h2 id="photo-h" className="h4">
            Profile picture
          </h2>
          <Avatar user={preview} size={132} />
          <div className="profile__photo-actions">
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => fileRef.current?.click()}>
              <Camera size={16} aria-hidden="true" /> {avatar ? 'Change photo' : 'Upload photo'}
            </button>
            {avatar && (
              <button type="button" className="btn btn--text btn--sm btn--danger-text" onClick={() => setAvatar(null)}>
                <Trash2 size={16} aria-hidden="true" /> Remove
              </button>
            )}
          </div>
          <p className="tiny muted">JPG or PNG. We crop it to a square.</p>
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={onPhoto} aria-label="Upload profile picture" />
        </section>

        <section className="panel profile__fields" aria-labelledby="details-h">
          <h2 id="details-h" className="h4">
            Your details
          </h2>
          {formError && (
            <div className="alert alert--error" role="alert">
              <TriangleAlert size={18} aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}
          <div className="form-grid form-grid--2">
            <div className="field">
              <label htmlFor="p-name">Full name</label>
              <input id="p-name" className="input" value={form.fullName} onChange={set('fullName')} aria-invalid={!!errors.fullName} autoComplete="name" />
              {errors.fullName && <p className="error">{errors.fullName}</p>}
            </div>
            <div className="field">
              <label htmlFor="p-email">Email</label>
              <input id="p-email" className="input" type="email" value={form.email} onChange={set('email')} aria-invalid={!!errors.email} autoComplete="email" />
              {errors.email && <p className="error">{errors.email}</p>}
            </div>
            <div className="field">
              <label htmlFor="p-phone">Contact number</label>
              <input id="p-phone" className="input" type="tel" value={form.contactNumber} onChange={set('contactNumber')} aria-invalid={!!errors.contactNumber} autoComplete="tel" />
              {errors.contactNumber ? <p className="error">{errors.contactNumber}</p> : <p className="hint">For pickup and delivery updates.</p>}
            </div>
            <div className="field">
              <label htmlFor="p-address">Address</label>
              <input id="p-address" className="input" value={form.address} onChange={set('address')} placeholder="Barangay, city, province" autoComplete="street-address" />
              <p className="hint">Used as the default delivery address.</p>
            </div>
          </div>
          <div className="profile__save">
            <button type="submit" className="btn btn--primary" disabled={!dirty || busy}>
              {busy ? <span className="spinner" aria-label="Saving" /> : 'Save changes'}
            </button>
            {!dirty && <span className="small muted">No unsaved changes</span>}
          </div>
        </section>
      </form>

      <section className="demo-control profile__reset" aria-labelledby="reset-h">
        <div>
          <h2 id="reset-h" className="h4">
            Reset the prototype
          </h2>
          <p className="small">Clears every account, order, and project stored in this browser and restores the demo data. Handy before a presentation.</p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={onReset}>
          <RotateCcw size={18} aria-hidden="true" /> Reset demo data
        </button>
      </section>
    </div>
  );
}
