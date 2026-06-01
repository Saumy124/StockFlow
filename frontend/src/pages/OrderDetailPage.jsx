import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ArrowLeft, User, Package, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ordersApi } from '../lib/api';
import { Card, Badge, Skeleton } from '../components/ui';
import './OrderDetail.css';
import { useCurrency } from '../hooks/useCurrency';

const STATUS_VARIANT = {
  confirmed: 'success',
  pending: 'warning',
  cancelled: 'danger',
};

export default function OrderDetailPage() {
  const { id } = useParams();

  const { data: order, isLoading, isError } = useQuery(['order', id], () =>
    ordersApi.getById(id).then((r) => r.data)
  );

  const { format: formatCurrency } = useCurrency();

  if (isError) {
    return (
      <div className="order-detail">
        <p style={{ color: 'var(--danger)' }}>Order not found or failed to load.</p>
        <Link to="/orders">
          <button className="back-link">← Back to Orders</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="order-detail animate-in">
      <div className="detail-header">
        <Link to="/orders" className="back-link">
          <ArrowLeft size={16} /> Back to Orders
        </Link>
        {order && (
          <div className="detail-title-row">
            <h2 className="page-title">Order #{order.id}</h2>
            <Badge variant={STATUS_VARIANT[order.status] || 'default'} >
              {order.status}
            </Badge>
          </div>
        )}
        {order && (
          <p className="page-subtitle">
            Placed on {format(new Date(order.created_at), 'MMMM d, yyyy — h:mm a')}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="detail-grid">
          <Skeleton style={{ height: 120 }} />
          <Skeleton style={{ height: 120 }} />
          <Skeleton className="span-2" style={{ height: 200 }} />
        </div>
      ) : (
        <div className="detail-grid">
          {/* Customer */}
          <Card>
            <div className="detail-section-title">
              <User size={15} /> Customer
            </div>
            <div className="detail-info-name">{order.customer.full_name}</div>
            <div className="detail-info-sub">{order.customer.email}</div>
            {order.customer.phone && (
              <div className="detail-info-sub">{order.customer.phone}</div>
            )}
          </Card>

          {/* Summary */}
          <Card>
            <div className="detail-section-title">
              <DollarSign size={15} /> Order Summary
            </div>
            <div className="summary-rows">
              <div className="summary-row">
                <span>Items</span>
                <span>{order.items.length}</span>
              </div>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
              <div className="summary-row total-row">
                <span>Total</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </Card>

          {/* Items */}
          <Card className="span-2">
            <div className="detail-section-title">
              <Package size={15} /> Order Items
            </div>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Unit Price</th>
                    <th>Qty</th>
                    <th>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td><span className="text-primary">{item.product.name}</span></td>
                      <td><code className="sku-code">{item.product.sku}</code></td>
                      <td>{formatCurrency(item.unit_price)}</td>
                      <td>{item.quantity}</td>
                      <td><span className="text-primary">{formatCurrency(item.unit_price * item.quantity)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
