import { useState } from 'react';
import { Link } from 'react-router-dom';
import Panel from '../../../components/admin/Panel';
import ReportKpi from '../../../components/admin/ReportKpi';
import Findings from '../../../components/admin/Findings';
import HBars from '../../../components/admin/HBars';
import ProductImage from '../../../components/shop/ProductImage';
import { formatDate, formatPeso } from '../../../utils/format';

const COVER_TARGET = 30; // days of stock the meter treats as "full"

function coverText(r) {
  if (r.stock === 0) return 'Out of stock';
  if (!Number.isFinite(r.daysLeft)) return 'No sales yet';
  const d = Math.round(r.daysLeft);
  if (d > 90) return 'Over 3 months';
  return `${Math.max(1, d)} ${d === 1 ? 'day' : 'days'}`;
}

export default function ProductsReport({ report: r, period }) {
  const [allCoverage, setAllCoverage] = useState(false);
  const t = r.totals;
  const coverage = allCoverage ? r.coverage : r.coverage.slice(0, 10);
  const maxMade = Math.max(1, ...r.madeToOrder.map((x) => x.revenue));

  return (
    <>
      <Findings items={r.findings} />

      <section className="stats stats--six" aria-label="Summary">
        <ReportKpi ink="cyan" label="Items sold" value={t.units} prev={t.prevUnits} against={period.against} />
        <ReportKpi ink="magenta" label="Products that sold" value={t.sold} hint={`Of ${t.active} in the shop`} />
        <ReportKpi ink="ink" label="Stock value" value={t.stockValue} peso hint={`${t.stockUnits.toLocaleString('en-PH')} pcs at selling price`} />
        <ReportKpi ink="yellow" label="Run out within 2 weeks" value={t.runningOut} hint="At this period's pace" />
        <ReportKpi ink="magenta" label="Low or out of stock" value={t.low + t.out} hint={`${t.out} out, ${t.low} low (${r.lowAt} or fewer)`} />
        <ReportKpi ink="ink" label="Did not sell" value={t.slow} hint="Products with no sales" />
      </section>

      <div className="admin-grid">
        <Panel id="ucat-h" title="Units sold by category" sub={`${period.label}, all products`}>
          <HBars label="Units sold by category" rows={r.byCategory} format={(v) => `${v.toLocaleString('en-PH')} pcs`} />
        </Panel>

        <Panel
          id="cover-h"
          className="admin-grid__wide"
          title="Stock coverage"
          sub={`How long shelf stock lasts at this period's pace. Suggested reorder covers the next ${COVER_TARGET} days.`}
          link={
            <Link to="/admin/products?stock=low" className="small panel__link">
              Restock
            </Link>
          }
        >
          <div className="table-card table-card--flat">
            <table className="table report-table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col" className="t-right">
                    On hand
                  </th>
                  <th scope="col" className="t-right">
                    Sold
                  </th>
                  <th scope="col" className="report-table__bar-col">
                    Lasts about
                  </th>
                  <th scope="col" className="t-right">
                    Reorder
                  </th>
                </tr>
              </thead>
              <tbody>
                {coverage.map((x) => {
                  const days = x.stock === 0 ? 0 : Math.min(x.daysLeft, COVER_TARGET);
                  const tone = x.stock === 0 || x.daysLeft <= 7 ? 'bad' : x.daysLeft <= 14 ? 'warn' : 'ok';
                  return (
                    <tr key={x.id}>
                      <th scope="row" data-label="Product">
                        <span className="report-product">
                          <span className="report-product__img">
                            <ProductImage product={x.product} />
                          </span>
                          <span>
                            {x.name}
                            <span className="t-sub">{x.categoryLabel}</span>
                          </span>
                        </span>
                      </th>
                      <td data-label="On hand" className="t-right num">
                        {x.stock}
                      </td>
                      <td data-label="Sold" className="t-right num">
                        {x.units}
                      </td>
                      <td data-label="Lasts about">
                        <span className={`cover cover--${tone}`}>
                          <span className="cover__track" aria-hidden="true">
                            <span className="cover__fill" style={{ width: `${(days / COVER_TARGET) * 100}%` }} />
                          </span>
                          <span className="cover__text">{coverText(x)}</span>
                        </span>
                      </td>
                      <td data-label="Reorder" className="t-right num t-strong">
                        {x.reorder ? `${x.reorder} pcs` : <span className="muted">None</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {r.coverage.length > 10 && (
            <p className="panel__foot">
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAllCoverage((v) => !v)} aria-expanded={allCoverage}>
                {allCoverage ? 'Show the 10 most urgent' : `Show all ${r.coverage.length} shelf items`}
              </button>
            </p>
          )}
        </Panel>

        <Panel id="made-h" className="admin-grid__wide" title="Made-to-order products" sub="Custom goods are printed per order, so they have no stock count.">
          {r.madeToOrder.length ? (
            <div className="table-card table-card--flat">
              <table className="table report-table">
                <thead>
                  <tr>
                    <th scope="col">Product</th>
                    <th scope="col" className="t-right">
                      Orders
                    </th>
                    <th scope="col" className="t-right">
                      Units
                    </th>
                    <th scope="col" className="report-table__bar-col">
                      Sales
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {r.madeToOrder.map((x) => (
                    <tr key={x.id}>
                      <th scope="row" data-label="Product">
                        {x.name}
                      </th>
                      <td data-label="Orders" className="t-right num">
                        {x.orders}
                      </td>
                      <td data-label="Units" className="t-right num">
                        {x.units.toLocaleString('en-PH')}
                      </td>
                      <td data-label="Sales">
                        <span className="cellbar">
                          <span className="cellbar__bar" style={{ width: `${(x.revenue / maxMade) * 100}%` }} aria-hidden="true" />
                          <span className="num t-strong">{formatPeso(x.revenue)}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted small">No custom orders in this period.</p>
          )}
        </Panel>

        <Panel id="slow-h" title="Slow movers" sub="In the shop but not sold in this period, oldest sale first">
          {r.slow.length ? (
            <ul className="slow-list" role="list">
              {r.slow.slice(0, 8).map((x) => (
                <li key={x.id}>
                  <span className="slow-list__name">{x.name}</span>
                  <span className="slow-list__meta">
                    {x.stocked ? `${x.stock} on hand. ` : 'Made to order. '}
                    {x.lastSold ? `Last sold ${formatDate(x.lastSold)}` : 'Never sold online'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small">Every product sold at least once in this period.</p>
          )}
          {r.slow.length > 8 && <p className="tiny muted panel__foot">{r.slow.length - 8} more in the CSV download.</p>}
        </Panel>
      </div>
    </>
  );
}
