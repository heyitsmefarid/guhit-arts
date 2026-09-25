import Panel from '../../../components/admin/Panel';
import ReportKpi from '../../../components/admin/ReportKpi';
import Findings from '../../../components/admin/Findings';
import Heatmap from '../../../components/admin/Heatmap';
import StackedColumns from '../../../components/admin/StackedColumns';
import { SERIES } from '../../../utils/admin';
import { HOUR_BLOCKS, WEEKDAYS } from '../../../utils/reports';

const hours = (v) => (v === null ? '–' : v < 1 ? `${Math.round(v * 60)} min` : `${v.toFixed(1)} hr`);
const days = (v) => (v === null ? '–' : `${v.toFixed(1)} days`);

export default function OperationsReport({ report: r, period, data, show }) {
  const s = r.speed;
  const maxUpdates = Math.max(1, ...r.team.map((m) => m.updates));
  const openOrders = data.orders.filter((o) => o.status !== 'completed').length;
  const openProjects = data.projects.filter((p) => p.status !== 'completed').length;

  return (
    <>
      {show('findings') && <Findings items={r.findings} />}

      {show('kpis') && (
        <section className="stats stats--six" aria-label="Summary">
          <ReportKpi ink="cyan" label="Time to approve an order" value={s.approve ?? 0} prev={s.prevApprove} format={hours} goodWhen="down" against={period.against} />
          <ReportKpi ink="magenta" label="Time to confirm a request" value={s.quoteHours ?? 0} prev={s.prevQuoteHours} format={hours} goodWhen="down" against={period.against} />
          <ReportKpi ink="cyan" label="Shelf orders finished in" value={s.stockDays ?? 0} format={days} hint="Median, order to handoff" />
          <ReportKpi ink="yellow" label="Custom orders finished in" value={s.customDays ?? 0} format={days} hint="Median, includes proof approval" />
          <ReportKpi ink="ink" label="Open orders now" value={openOrders} hint="Not yet completed" />
          <ReportKpi ink="magenta" label="Open requests now" value={openProjects} hint="Not yet completed" />
        </section>
      )}

      <div className="admin-grid">
        {show('heat') && (
          <Panel
            id="heat-h"
            className="admin-grid__wide"
            title="When orders and requests come in"
            sub="By day of the week and time of day. Darker means busier. Plan counter staff around the dark cells."
          >
            <Heatmap
              rows={WEEKDAYS}
              cols={HOUR_BLOCKS.map((b) => b.label)}
              grid={r.grid}
              caption={`Orders and requests by day and time, ${period.title}`}
              cellText={(ri, ci) => `${WEEKDAYS[ri]}, ${r.blockText(ci)}`}
            />
          </Panel>
        )}

        {show('age') && (
          <Panel id="age-h" title="Open work by age" sub="How long unfinished orders and requests have waited">
            <StackedColumns
              ariaLabel="Open work by age"
              series={[
                { key: 'orders', label: 'Orders', color: SERIES.shop },
                { key: 'projects', label: 'Digital requests', color: SERIES.digital },
              ]}
              rows={r.aging}
              height={250}
              labelEvery={1}
              integer
            />
          </Panel>
        )}

        {show('team') && (
          <Panel id="team-h" className="admin-grid__full" title="Team workload" sub="Status updates each team member made in this period. An order counts once, however many times it moved.">
            {r.team.length ? (
              <div className="table-card table-card--flat">
                <table className="table report-table">
                  <thead>
                    <tr>
                      <th scope="col">Team member</th>
                      <th scope="col" className="t-right">
                        Orders handled
                      </th>
                      <th scope="col" className="t-right">
                        Digital requests handled
                      </th>
                      <th scope="col" className="report-table__bar-col">
                        Status updates
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.team.map((m) => (
                      <tr key={m.name}>
                        <th scope="row" data-label="Team member">
                          {m.name}
                          <span className="t-sub">
                            {m.title}
                            {m.active ? '' : ' (no longer on the team)'}
                          </span>
                        </th>
                        <td data-label="Orders handled" className="t-right num">
                          {m.orders}
                        </td>
                        <td data-label="Digital requests handled" className="t-right num">
                          {m.projects}
                        </td>
                        <td data-label="Status updates">
                          <span className="cellbar">
                            <span className="cellbar__bar cellbar__bar--ink" style={{ width: `${(m.updates / maxUpdates) * 100}%` }} aria-hidden="true" />
                            <span className="num t-strong">{m.updates}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted small">No status updates in this period.</p>
            )}
          </Panel>
        )}
      </div>
    </>
  );
}
