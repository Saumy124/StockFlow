import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import {
  Package, Users, ShoppingCart, AlertTriangle,
  ArrowRight, DollarSign, TrendingUp, Zap, Activity
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { dashboardApi } from '../lib/api';
import { Card, Badge, Skeleton } from '../components/ui';
import { useCountUp } from '../hooks/useCountUp';
import { useCurrency } from '../hooks/useCurrency';
import './Dashboard.css';

function StatCard({ icon: Icon, label, value, color, loading, isCurrency = false, delay }) {
  const { currency, symbol } = useCurrency();
  // For currency cards, animate the converted amount; otherwise the raw count.
  const rate = isCurrency && currency === 'INR' ? 95 : 1;
  const animated = useCountUp(loading ? 0 : value * rate);
  const rounded = Math.round(animated);
  const display = isCurrency
    ? symbol + rounded.toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US')
    : rounded.toLocaleString();

  return (
    <Card className={`stat-card stat-card-${color} stagger-${delay}`}>
      <div className="stat-top">
        <div className="stat-icon"><Icon size={20} /></div>
        <div className="stat-spark"><Activity size={14} /></div>
      </div>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        {loading ? (
          <Skeleton className="stat-value-skeleton" />
        ) : (
          <div className="stat-value">{display}</div>
        )}
      </div>
      <div className="stat-glow" />
    </Card>
  );
}

const ORDER_STATUS_VARIANT = {
  confirmed: 'success', pending: 'warning', cancelled: 'danger',
};

export default function DashboardPage() {
  const { data, isLoading } = useQuery('dashboard', () =>
    dashboardApi.getStats().then((r) => r.data)
  );

  const { format: formatCurrency } = useCurrency();

  const recentOrders = data?.recent_orders || [];
  const lowStock = data?.low_stock_products || [];

  // Build a small revenue-by-order series for the chart (reverse for chronological)
  const chartData = [...recentOrders].reverse().map((o, i) => ({
    name: `#${o.id}`,
    value: o.total_amount,
  }));
  // Pad so the chart always has shape even with few orders
  while (chartData.length > 0 && chartData.length < 3) {
    chartData.unshift({ name: '', value: 0 });
  }

  return (
    <div className="dashboard">
      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard icon={Package} label="Total Products" value={data?.total_products ?? 0} color="amber" loading={isLoading} delay={1} />
        <StatCard icon={Users} label="Customers" value={data?.total_customers ?? 0} color="cyan" loading={isLoading} delay={2} />
        <StatCard icon={ShoppingCart} label="Orders" value={data?.total_orders ?? 0} color="green" loading={isLoading} delay={3} />
        <StatCard icon={DollarSign} label="Total Revenue" value={data?.total_revenue ?? 0} color="purple" loading={isLoading} isCurrency delay={4} />
      </div>

      {/* Revenue chart band */}
      <Card className="chart-card stagger-2">
        <div className="card-header">
          <h3 className="card-title"><TrendingUp size={16} /> Revenue Trend</h3>
          <Badge variant="primary">Recent Orders</Badge>
        </div>
        {isLoading ? (
          <Skeleton style={{ height: 180, borderRadius: 'var(--radius-md)' }} />
        ) : chartData.length === 0 ? (
          <div className="chart-empty">
            <Zap size={22} />
            <span>No revenue data yet — create an order to see trends.</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--bg-border)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
                formatter={(v) => [formatCurrency(v), 'Total']}
                cursor={{ stroke: 'var(--accent-primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--accent-primary)"
                strokeWidth={2.5}
                fill="url(#revGradient)"
                animationDuration={900}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="dashboard-grid">
        {/* Recent Orders */}
        <Card className="recent-orders-card stagger-3">
          <div className="card-header">
            <h3 className="card-title">Recent Orders</h3>
            <Link to="/orders" className="card-link">View all <ArrowRight size={14} /></Link>
          </div>
          {isLoading ? (
            <div className="loading-rows">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="row-skeleton" />)}
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="empty-text">No orders yet.</p>
          ) : (
            <div className="orders-list">
              {recentOrders.map((order) => (
                <Link to={`/orders/${order.id}`} key={order.id} className="order-row">
                  <div className="order-row-left">
                    <div className="order-id">#{order.id}</div>
                    <div className="order-customer">{order.customer.full_name}</div>
                  </div>
                  <div className="order-row-right">
                    <div className="order-amount">{formatCurrency(order.total_amount)}</div>
                    <Badge variant={ORDER_STATUS_VARIANT[order.status] || 'default'}>{order.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Low Stock with progress bars */}
        <Card className="low-stock-card stagger-4">
          <div className="card-header">
            <h3 className="card-title">
              <AlertTriangle size={16} className="warning-icon" /> Low Stock Alerts
            </h3>
            <Link to="/products" className="card-link">Manage <ArrowRight size={14} /></Link>
          </div>
          {isLoading ? (
            <div className="loading-rows">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="row-skeleton" />)}
            </div>
          ) : lowStock.length === 0 ? (
            <p className="empty-text">All products are well-stocked. 🎉</p>
          ) : (
            <div className="low-stock-list">
              {lowStock.map((p) => {
                const pct = Math.min((p.quantity / 10) * 100, 100);
                const barColor = p.quantity === 0 ? 'var(--danger)'
                  : p.quantity <= 5 ? 'var(--warning)' : 'var(--success)';
                return (
                  <div key={p.id} className="low-stock-row">
                    <div className="stock-info">
                      <div className="stock-name">{p.name}</div>
                      <div className="stock-sku">{p.sku}</div>
                    </div>
                    <div className="stock-bar-wrap">
                      <div className="stock-bar-track">
                        <div className="stock-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
                      </div>
                      <Badge variant={p.quantity === 0 ? 'danger' : 'warning'}>{p.quantity} left</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
