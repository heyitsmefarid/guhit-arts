import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SearchX } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import Avatar from '../../components/ui/Avatar';
import { useAdmin } from '../../context/AdminContext';
import { findHardcodedById } from '../../data/credentials';
import { formatPeso, timeAgo } from '../../utils/format';

export default function AdminCustomers() {
  const { customers, loading } = useAdmin();
  const [q, setQ] = useState('');

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return customers.filter((c) => !term || `${c.fullName} ${c.email} ${c.contactNumber} ${c.address}`.toLowerCase().includes(term));
  }, [customers, q]);

  return (
    <div className="page">
      <PageHeader title="Customers" description={`${customers.length} customers with an online account. Sorted by most recent activity.`} />

      <div className="admin-filters">
        <div className="input-wrap admin-filters__search">
          <Search size={18} aria-hidden="true" />
          <input className="input" type="search" placeholder="Search by name, email, phone, or barangay" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search customers" />
        </div>
      </div>

      {loading ? (
        <div className="table-card sk-block" style={{ height: 320 }} aria-busy="true" />
      ) : shown.length ? (
        <div className="table-card">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Customer</th>
                <th scope="col">Contact</th>
                <th scope="col" className="t-right">
                  Orders
                </th>
                <th scope="col" className="t-right">
                  Digital
                </th>
                <th scope="col" className="t-right">
                  Total spent
                </th>
                <th scope="col">Last activity</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.id}>
                  <td data-label="Customer">
                    <Link to={`/admin/customers/${c.id}`} className="admin-person">
                      <Avatar user={c} size={36} />
                      <span>
                        <span className="t-title">
                          {c.fullName}
                          {findHardcodedById(c.id) && <span className="tag tag--login">Demo login</span>}
                        </span>
                        <span className="t-sub">{c.email}</span>
                      </span>
                    </Link>
                  </td>
                  <td data-label="Contact">
                    <span className="num">{c.contactNumber}</span>
                    <span className="t-sub">{c.address || 'No address yet'}</span>
                  </td>
                  <td data-label="Orders" className="t-right num">
                    {c.orderCount}
                  </td>
                  <td data-label="Digital" className="t-right num">
                    {c.projectCount}
                  </td>
                  <td data-label="Total spent" className="t-right num t-strong">
                    {formatPeso(c.spent)}
                  </td>
                  <td data-label="Last activity">{timeAgo(c.lastActivity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={SearchX} title="No customers match" body="Try a different name, email, or phone number." />
      )}
    </div>
  );
}
