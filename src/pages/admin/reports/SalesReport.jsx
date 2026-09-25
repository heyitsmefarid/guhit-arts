import Panel from '../../../components/admin/Panel';
import ReportKpi from '../../../components/admin/ReportKpi';
import Findings from '../../../components/admin/Findings';
import Delta from '../../../components/admin/Delta';
import StackedColumns from '../../../components/admin/StackedColumns';
import ShareBar from '../../../components/admin/ShareBar';
import { SERIES, shortPeso } from '../../../utils/admin';
import { pct } from '../../../utils/reports';
import { formatPeso } from '../../../utils/format';

const UNIT_TITLE = { day: 'Daily revenue', week: 'Weekly revenue', month: 'Monthly revenue' };

export default function SalesReport({ report: r, period, show }) {
  const t = r.totals;
  const p = r.prev;
  const maxCat = Math.max(1, ...r.categories.map((c) => c.value));
  const maxProduct = Math.max(1, ...r.topProducts.map((x) => x.revenue));
  const compare = Boolean(period.against);

  return (
    <>
      {show('findings') && <Findings items={r.findings} />}

      {show('kpis') && (
        <section className="stats stats--six" aria-label="Summary">
          <ReportKpi ink="magenta" label="Revenue" value={t.revenue} prev={p.revenue} peso against={period.against} />
          <ReportKpi ink="magenta" label="Shop sales" value={t.shop} prev={p.shop} peso against={period.against} />
          <ReportKpi ink="cyan" label="Digital services" value={t.digital} prev={p.digital} peso against={period.against} />
          <ReportKpi ink="cyan" label="Orders" value={t.orders} prev={p.orders} against={period.against} />
          <ReportKpi ink="yellow" label="Average order" value={t.avgOrder} prev={p.avgOrder} peso against={period.against} />
          <ReportKpi ink="ink" label="Items sold" value={t.units} prev={p.units} against={period.against} />
        </section>
      )}

      <div className="admin-grid">
        {show('trend') && (
          <Panel id="rev-h" className="admin-grid__wide" title={UNIT_TITLE[period.unit]} sub="Shop orders and confirmed digital work. Hover a column for details.">
            <StackedColumns
              ariaLabel={`${UNIT_TITLE[period.unit]}, ${period.title}`}
              series={[
                { key: 'shop', label: 'Shop orders', color: SERIES.shop },
                { key: 'digital', label: 'Digital services', color: SERIES.digital },
              ]}
              rows={r.series}
              format={formatPeso}
              tickFormat={shortPeso}
              height={300}
              labelEvery={period.unit === 'day' ? undefined : 1}
            />
          </Panel>
        )}

        {show('paid') && (
          <Panel id="pay-h" title="How customers paid" sub="Shop orders in this period">
            <p className="share__title">Payment method</p>
            <ShareBar label="Payment method" parts={r.payment} format={(v) => `${v} orders`} />
            <p className="share__title">Pickup or delivery</p>
            <ShareBar label="Pickup or delivery" parts={r.handoff} format={(v) => `${v} orders`} />
            <p className="tiny muted panel__foot">
              Delivery fees added {formatPeso(t.deliveryFees)} to revenue.
            </p>
          </Panel>
        )}

        {show('categories') && (
          <Panel id="cat-h" className="admin-grid__full" title="Revenue by category" sub={compare ? `Each category's share of revenue, and how it changed from ${period.against}.` : "Each category's share of revenue."}>
            <div className="table-card table-card--flat">
              <table className="table report-table">
                <thead>
                  <tr>
                    <th scope="col">Category</th>
                    <th scope="col" className="report-table__bar-col">
                      Sales
                    </th>
                    <th scope="col" className="t-right">
                      Share
                    </th>
                    {compare && (
                      <>
                        <th scope="col">Change</th>
                        <th scope="col" className="t-right">
                          Before
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {r.categories.map((c) => (
                    <tr key={c.id} className={c.muted ? 'is-muted' : ''}>
                      <th scope="row" data-label="Category">
                        {c.label}
                      </th>
                      <td data-label="Sales">
                        <span className="cellbar">
                          <span className="cellbar__bar" style={{ width: `${(c.value / maxCat) * 100}%` }} aria-hidden="true" />
                          <span className="num t-strong">{formatPeso(c.value)}</span>
                        </span>
                      </td>
                      <td data-label="Share" className="t-right num">
                        {pct(c.share)}
                      </td>
                      {compare && (
                        <>
                          <td data-label="Change">
                            <Delta cur={c.value} prev={c.prev} against={period.against} />
                          </td>
                          <td data-label="Before" className="t-right num muted">
                            {formatPeso(c.prev)}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row">Total</th>
                    <td className="num t-strong">{formatPeso(t.revenue)}</td>
                    <td className="t-right num">100%</td>
                    {compare && (
                      <>
                        <td>
                          <Delta cur={t.revenue} prev={p.revenue} against={period.against} />
                        </td>
                        <td className="t-right num muted">{formatPeso(p.revenue)}</td>
                      </>
                    )}
                  </tr>
                </tfoot>
              </table>
            </div>
          </Panel>
        )}

        {show('products') && (
          <Panel id="top-h" className="admin-grid__full" title="Best-selling products" sub="Top 10 by sales. Share is of product sales, before delivery fees.">
            {r.topProducts.length ? (
              <div className="table-card table-card--flat">
                <table className="table report-table">
                  <thead>
                    <tr>
                      <th scope="col" className="report-table__rank">
                        <span className="sr-only">Rank</span>
                      </th>
                      <th scope="col">Product</th>
                      <th scope="col" className="t-right">
                        Units
                      </th>
                      <th scope="col" className="report-table__bar-col">
                        Sales
                      </th>
                      <th scope="col" className="t-right">
                        Share
                      </th>
                      <th scope="col" className="t-right">
                        Orders
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.topProducts.map((x, i) => (
                      <tr key={x.id}>
                        <td className="report-table__rank num">{i + 1}</td>
                        <th scope="row" data-label="Product">
                          {x.label}
                        </th>
                        <td data-label="Units" className="t-right num">
                          {x.units.toLocaleString('en-PH')}
                        </td>
                        <td data-label="Sales">
                          <span className="cellbar">
                            <span className="cellbar__bar" style={{ width: `${(x.revenue / maxProduct) * 100}%` }} aria-hidden="true" />
                            <span className="num t-strong">{formatPeso(x.revenue)}</span>
                          </span>
                        </td>
                        <td data-label="Share" className="t-right num">
                          {pct(x.share)}
                        </td>
                        <td data-label="Orders" className="t-right num">
                          {x.orders}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted small">No products sold in this period.</p>
            )}
          </Panel>
        )}
      </div>
    </>
  );
}
