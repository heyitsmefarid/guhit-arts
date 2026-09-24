import { Link } from 'react-router-dom';
import Panel from '../../../components/admin/Panel';
import ReportKpi from '../../../components/admin/ReportKpi';
import Findings from '../../../components/admin/Findings';
import StackedColumns from '../../../components/admin/StackedColumns';
import HBars from '../../../components/admin/HBars';
import ShareBar from '../../../components/admin/ShareBar';
import { SERIES } from '../../../utils/admin';
import { pct } from '../../../utils/reports';
import { formatPeso } from '../../../utils/format';
import { HUB_OPENED_DAYS_AGO } from '../../../data/history';

const UNIT_TITLE = { day: 'Requests per day', week: 'Requests per week', month: 'Requests per month' };
const days = (v) => `${v.toFixed(1)} days`;

export default function DigitalReport({ report: r, period }) {
  const t = r.totals;
  const p = r.prev;
  const opened = new Date(Date.now() - HUB_OPENED_DAYS_AGO * 864e5);
  const showsLaunch = opened > period.start;
  const maxValue = Math.max(1, ...r.services.map((s) => s.value));

  return (
    <>
      <Findings items={r.findings} />

      <section className="stats stats--six" aria-label="Summary">
        <ReportKpi ink="magenta" label="Requests" value={t.requests} prev={p.requests} against={period.against} />
        <ReportKpi ink="cyan" label="Jobs finished" value={t.completed} prev={p.completed} against={period.against} />
        <ReportKpi ink="magenta" label="Confirmed value" value={t.value} prev={p.value} peso against={period.against} />
        <ReportKpi ink="yellow" label="Average price" value={t.avgPrice} prev={p.avgPrice} peso against={period.against} />
        <ReportKpi ink="cyan" label="Delivered on time" value={t.onTime ?? 0} prev={p.onTime} format={pct} against={period.against} />
        <ReportKpi
          ink="ink"
          label="Average turnaround"
          value={t.turnaround ?? 0}
          prev={p.turnaround}
          format={days}
          goodWhen="down"
          against={period.against}
        />
      </section>

      <div className="admin-grid">
        <Panel
          id="req-h"
          className="admin-grid__wide"
          title={UNIT_TITLE[period.unit]}
          sub={
            showsLaunch
              ? `The Hub opened as a pilot on ${opened.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}, so earlier columns are empty.`
              : 'New requests from the Student Digital Help Hub. Hover a column for details.'
          }
        >
          <StackedColumns
            ariaLabel={`${UNIT_TITLE[period.unit]}, ${period.title}`}
            series={[{ key: 'requests', label: 'Requests', color: SERIES.digital }]}
            rows={r.series}
            height={280}
            integer
            labelEvery={period.unit === 'day' ? undefined : 1}
          />
        </Panel>

        <Panel
          id="stage-h"
          title="Open requests right now"
          sub="Unfinished work by stage, today"
          link={
            <Link to="/admin/projects?status=open" className="small panel__link">
              Open list
            </Link>
          }
        >
          <HBars label="Open digital requests by stage" rows={r.pipeline} />
        </Panel>

        <Panel id="svc-h" className="admin-grid__full" title="By service" sub="Requests that came in, and jobs finished, in this period.">
          {r.services.length ? (
            <div className="table-card table-card--flat">
              <table className="table report-table">
                <thead>
                  <tr>
                    <th scope="col">Service</th>
                    <th scope="col" className="t-right">
                      Requests
                    </th>
                    <th scope="col" className="t-right">
                      Finished
                    </th>
                    <th scope="col" className="t-right">
                      Average price
                    </th>
                    <th scope="col" className="report-table__bar-col">
                      Confirmed value
                    </th>
                    <th scope="col" className="t-right">
                      Turnaround
                    </th>
                    <th scope="col" className="t-right">
                      On time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {r.services.map((s) => (
                    <tr key={s.id}>
                      <th scope="row" data-label="Service">
                        {s.name}
                      </th>
                      <td data-label="Requests" className="t-right num">
                        {s.requests}
                      </td>
                      <td data-label="Finished" className="t-right num">
                        {s.completed}
                      </td>
                      <td data-label="Average price" className="t-right num">
                        {s.avgPrice ? formatPeso(s.avgPrice) : '–'}
                      </td>
                      <td data-label="Confirmed value">
                        <span className="cellbar">
                          <span className="cellbar__bar cellbar__bar--digital" style={{ width: `${(s.value / maxValue) * 100}%` }} aria-hidden="true" />
                          <span className="num t-strong">{formatPeso(s.value)}</span>
                        </span>
                      </td>
                      <td data-label="Turnaround" className="t-right num">
                        {s.turnaround !== null ? days(s.turnaround) : '–'}
                      </td>
                      <td data-label="On time" className="t-right num">
                        {s.onTime !== null ? pct(s.onTime) : '–'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted small">No digital requests in this period.</p>
          )}
        </Panel>

        <Panel id="rounds-h" title="Rounds of changes" sub="Finished jobs, by how many drafts the customer asked to change">
          {r.rounds.some((x) => x.value) ? (
            <ShareBar label="Rounds of changes" parts={r.rounds} format={(v) => `${v} ${v === 1 ? 'job' : 'jobs'}`} />
          ) : (
            <p className="muted small">No finished jobs in this period.</p>
          )}
        </Panel>

        <Panel id="quote-h" title="Quotes and rush jobs" sub="Requests that came in during this period">
          <dl className="facts">
            <div>
              <dt>Quotes within the customer's budget</dt>
              <dd className="num">{t.withinBudget !== null ? pct(t.withinBudget) : '–'}</dd>
            </div>
            <div>
              <dt>Rush requests</dt>
              <dd className="num">
                {t.rush}
                {t.requests ? <span className="facts__sub"> ({pct(t.rush / t.requests)} of requests)</span> : null}
              </dd>
            </div>
            <div>
              <dt>Average confirmed price</dt>
              <dd className="num">{formatPeso(t.avgPrice)}</dd>
            </div>
          </dl>
        </Panel>

        <Panel id="price-h" title="Average price by service" sub="Confirmed prices only">
          <HBars
            label="Average price by service"
            rows={r.services.filter((s) => s.avgPrice).map((s) => ({ id: s.id, label: s.label, value: s.avgPrice })).sort((a, b) => b.value - a.value)}
            format={formatPeso}
          />
        </Panel>
      </div>
    </>
  );
}
