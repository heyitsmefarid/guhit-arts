import { useState } from 'react';
import { Check, Minus, UserPlus } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import { useAdmin } from '../../context/AdminContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { findHardcodedById } from '../../data/credentials';
import { ROLE_LABELS } from '../../utils/permissions';
import { timeAgo } from '../../utils/format';

// What each role can do, shown as a reference table on the page.
const ACCESS = [
  { task: 'Approve orders, send proofs, mark orders done', admin: true, staff: true },
  { task: 'Move digital requests along and send files', admin: true, staff: true },
  { task: 'Adjust stock counts', admin: true, staff: true },
  { task: 'Set product prices and digital quotations', admin: true, staff: false },
  { task: 'Add products, or hide them from the shop', admin: true, staff: false },
  { task: 'See revenue and sales reports', admin: true, staff: false },
  { task: 'See customers and their spending', admin: true, staff: false },
  { task: 'Add team members and change roles', admin: true, staff: false },
];

const EMPTY = { fullName: '', email: '', title: '', role: 'staff', password: '' };

export default function AdminTeam() {
  const { user } = useAuth();
  const { team, addTeamMember, updateTeamMember } = useAdmin();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  const sorted = [...team].sort((a, b) => Number(b.active !== false) - Number(a.active !== false) || (a.role === 'admin' ? -1 : 1));

  const change = async (member, patch, message) => {
    try {
      await updateTeamMember(member.id, patch);
      toast(message);
    } catch (err) {
      toast(err.message, { tone: 'error' });
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (form.fullName.trim().split(/\s+/).length < 2) found.fullName = 'Enter their first and last name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) found.email = 'Enter an email like name@email.com.';
    if (form.password.length < 8) found.password = 'Use at least 8 characters.';
    setErrors(found);
    if (Object.keys(found).length) return;
    try {
      const member = await addTeamMember(form);
      toast(`${member.fullName} can now log in at /admin/login as ${ROLE_LABELS[member.role].toLowerCase()}.`);
      setAdding(false);
      setForm(EMPTY);
      setFormError('');
    } catch (err) {
      setFormError(err.message);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Team"
        description="Who can use the admin panel, and what they can do. Only administrators see this page."
        actions={
          <button type="button" className="btn btn--primary" onClick={() => setAdding(true)}>
            <UserPlus size={18} aria-hidden="true" /> Add team member
          </button>
        }
      />

      <div className="table-card">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Role</th>
              <th scope="col">Last sign-in</th>
              <th scope="col">Status</th>
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((m) => {
              const me = m.id === user.id;
              const active = m.active !== false;
              return (
                <tr key={m.id} className={active ? '' : 'is-hidden'}>
                  <td data-label="Name">
                    <span className="admin-person">
                      <Avatar user={m} size={36} />
                      <span>
                        <span className="t-title">
                          {m.fullName}
                          {me && <span className="tag tag--login">You</span>}
                          {!me && findHardcodedById(m.id) && <span className="tag tag--login">Demo login</span>}
                        </span>
                        <span className="t-sub">
                          {m.title}, {m.email}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td data-label="Role">
                    <label className="sr-only" htmlFor={`role-${m.id}`}>
                      Role for {m.fullName}
                    </label>
                    <select
                      id={`role-${m.id}`}
                      className="select select--sm"
                      value={m.role}
                      disabled={me}
                      onChange={(e) => change(m, { role: e.target.value }, `${m.fullName} is now ${ROLE_LABELS[e.target.value].toLowerCase()}.`)}
                    >
                      <option value="admin">Administrator</option>
                      <option value="staff">Staff</option>
                    </select>
                  </td>
                  <td data-label="Last sign-in">{m.lastLoginAt ? timeAgo(m.lastLoginAt) : 'Never'}</td>
                  <td data-label="Status">
                    <span className={`stock ${active ? 'stock--ok' : 'stock--made'}`}>{active ? 'Active' : 'Deactivated'}</span>
                  </td>
                  <td className="t-action">
                    {!me && (
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() =>
                          change(
                            m,
                            { active: !active },
                            active ? `${m.fullName} can no longer log in.` : `${m.fullName} can log in again.`
                          )
                        }
                      >
                        {active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="panel" aria-labelledby="access-h">
        <h2 id="access-h" className="h3 panel__title">
          What each role can do
        </h2>
        <table className="access-table">
          <thead>
            <tr>
              <th scope="col">Task</th>
              <th scope="col">Administrator</th>
              <th scope="col">Staff</th>
            </tr>
          </thead>
          <tbody>
            {ACCESS.map((row) => (
              <tr key={row.task}>
                <th scope="row">{row.task}</th>
                {['admin', 'staff'].map((r) => (
                  <td key={r}>
                    {row[r] ? (
                      <span className="access-yes">
                        <Check size={16} aria-hidden="true" />
                        <span className="sr-only">Yes</span>
                      </span>
                    ) : (
                      <span className="access-no">
                        <Minus size={16} aria-hidden="true" />
                        <span className="sr-only">No</span>
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Modal
        open={adding}
        title="Add a team member"
        onClose={() => setAdding(false)}
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setAdding(false)}>
              Cancel
            </button>
            <button type="submit" form="add-member" className="btn btn--primary">
              Add team member
            </button>
          </>
        }
      >
        <form id="add-member" className="form-grid" onSubmit={submit} noValidate>
          {formError && <p className="alert alert--error">{formError}</p>}
          <div className="field">
            <label htmlFor="tm-name">Full name</label>
            <input id="tm-name" className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} aria-invalid={!!errors.fullName} />
            {errors.fullName && <p className="error">{errors.fullName}</p>}
          </div>
          <div className="form-grid form-grid--2">
            <div className="field">
              <label htmlFor="tm-email">Email</label>
              <input id="tm-email" className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-invalid={!!errors.email} />
              {errors.email && <p className="error">{errors.email}</p>}
            </div>
            <div className="field">
              <label htmlFor="tm-role">Role</label>
              <select id="tm-role" className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="staff">Staff</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="tm-title">
              Job title <span className="muted">(optional)</span>
            </label>
            <input id="tm-title" className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Example: Tarpaulin printing" />
          </div>
          <div className="field">
            <label htmlFor="tm-pw">Temporary password</label>
            <input id="tm-pw" className="input" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} aria-invalid={!!errors.password} />
            {errors.password ? <p className="error">{errors.password}</p> : <p className="hint">Share it with them in person. At least 8 characters.</p>}
          </div>
        </form>
      </Modal>
    </div>
  );
}
