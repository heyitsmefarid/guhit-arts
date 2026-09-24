import { Link } from 'react-router-dom';
import Panel from '../../../components/admin/Panel';
import ReportKpi from '../../../components/admin/ReportKpi';
import Findings from '../../../components/admin/Findings';
import StackedColumns from '../../../components/admin/StackedColumns';
import HBars from '../../../components/admin/HBars';
import ShareBar from '../../../components/admin/ShareBar';
import { SERIES } from '../../../utils/admin';
import { pct } from '../../../utils/reports';
import { formatDate, formatPeso } from '../../../utils/format';

const UNIT_TITLE = { day: 'Customers each day', week: 'Customers each week', month: 'Customers each month' };

export default function CustomersReport({ report: r, period }) {
  const t = r.totals;
  const p = r.prev;
  const share = (a, b) => (b ? a / b : 0);
  const maxSpent = Math.max(1, ...r.top.map((c) => c.spent));

  return (
    <>
      <Findings items={r.findings} />

      <section className="stats stats--six" aria-label="Summary">
        <ReportKpi ink="magenta" label="Customers who bought" value={t.buyers} prev={p.buyers} against={period.against} />
        <ReportKpi ink="cyan" label="First-time buyers" value={t.newBuyers} prev={p.newBuyers} against={period.against} hint={period.against ? undefined : 'Everyone is new in the first year'} />
        {period.against ? (
          <ReportKpi ink="cyan" label="Returning customers" value={share(t.returning, t.buyers)} prev={p.buyers ? share(p.returning, p.buyers) : null} format={pct} against={period.against} />
        ) : (
          <ReportKpi ink="cyan" label="Came back in a later month" value={share(t.cameBack, t.buyers)} format={pct} hint="Bought in 2 or more months" />
        )}
        <ReportKpi ink="yellow" label="Bought more than once" value={share(t.repeat, t.buyers)} prev={p.buyers ? share(p.repeat, p.buyers) : null} format={pct} against={period.against} />
        <ReportKpi ink="magenta" label="Average spend" value={t.avgSpend} prev={p.avgSpend} peso against={period.against} />
        <ReportKpi ink="ink" label="New sign-ups" value={t.signups} prev={p.signups} against={period.against} />
      </section>

      <div className="admin-grid">
        <Panel id="cust-h" className="admin-grid__wide" title={UNIT_TITLE[period.unit]} sub="Customers who bought something, split into first-time and returning buyers.">
          <StackedColumns
            ariaLabel={`${UNIT_TITLE[period.unit]}, ${period.title}`}
            series={[
              { key: 'returning', label: 'Returning', color: SERIES.digital },
              { key: 'newBuyers', label: 'First time', color: SERIES.shop },
            ]}
            rows={r.series}
            height={280}
            integer
            labelEvery={period.unit === 'day' ? undefined : 1}
          />
        </Panel>

        <Panel id="where-h" title="Where customers are from" sub="Customers who bought in this period">
          <ShareBar label="Calapan City or elsewhere" parts={r.cityShare} format={(v) => `${v} customers`} />
          <p className="share__title">Top places</p>
          <HBars label="Customers by barangay or town" rows={r.places.slice(0, 7)} format={(v) => `${v}`} />
        </Panel>

        <Panel
          id="topc-h"
          className="admin-grid__full"
          title="Top customers"
          sub="By amount spent in this period. The CSV download lists every customer who bought."
          link={
            <Link to="/admin/customers" className="small panel__link">
              All customers
            </Link>
          }
        >
          {r.top.length ? (
            <div className="table-card table-card--flat">
              <table className="table report-table">
                <thead>
                  <tr>
                    <th scope="col" className="report-table__rank">
                      <span className="sr-only">Rank</span>
                    </th>
                    <th scope="col">Customer</th>
                    <th scope="col">From</th>
                    <th scope="col" className="t-right">
                      Orders
                    </th>
                    <th scope="col" className="t-right">
                      Requests
                    </th>
                    <th scope="col" className="report-table__bar-col">
                      Spent
                    </th>
                    <th scope="col" className="t-right">
                      Share
                    </th>
                    <th scope="col">Customer since</th>
                  </tr>
                </thead>
                <tbody>
                  {r.top.map((c, i) => (
                    <tr key={c.id}>
                      <td className="report-table__rank num">{i + 1}</td>
                      <th scope="row" data-label="Customer">
                        <Link to={`/admin/customers/${c.id}`}>{c.name}</Link>
                      </th>
                      <td data-label="From">{c.place}</td>
                      <td data-label="Orders" className="t-right num">
                        {c.orders}
                      </td>
                      <td data-label="Requests" className="t-right num">
                        {c.projects}
                      </td>
                      <td data-label="Spent">
                        <span className="cellbar">
                          <span className="cellbar__bar" style={{ width: `${(c.spent / maxSpent) * 100}%` }} aria-hidden="true" />
                          <span className="num t-strong">{formatPeso(c.spent)}</span>
                        </span>
                      </td>
                      <td data-label="Share" className="t-right num">
                        {pct(c.share)}
                      </td>
                      <td data-label="Customer since" className="num">
                        {formatDate(c.since, { month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted small">No customers bought anything in this period.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
