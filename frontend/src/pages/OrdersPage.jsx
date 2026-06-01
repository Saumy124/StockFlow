import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Trash2, ShoppingCart, Eye, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ordersApi, customersApi, productsApi } from '../lib/api';
import {
  Button, Card, Modal, FormField, Select,
  Badge, EmptyState, ConfirmDialog, Skeleton, Input
} from '../components/ui';
import './Page.css';
import { useCurrency } from '../hooks/useCurrency';

const STATUS_VARIANT = {
  confirmed: 'success',
  pending: 'warning',
  cancelled: 'danger',
};

function CreateOrderForm({ customers, products, onSubmit, loading }) {
  const { format: formatCurrency } = useCurrency();
  const { register, handleSubmit, control, watch, formState: { errors } } = useForm({
    defaultValues: { customer_id: '', items: [{ product_id: '', quantity: 1 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');

  const getProductPrice = (productId) => {
    const p = products.find((x) => x.id === Number(productId));
    return p ? p.price : 0;
  };

  const subtotal = watchedItems.reduce((sum, item) => {
    return sum + (item.quantity || 0) * getProductPrice(item.product_id);
  }, 0);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="order-form">
      <FormField label="Customer" error={errors.customer_id?.message} required>
        <Select
          {...register('customer_id', { required: 'Select a customer', valueAsNumber: true })}
        >
          <option value="">— Select customer —</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
          ))}
        </Select>
      </FormField>

      <div className="order-items-section">
        <div className="order-items-header">
          <h4 className="section-label">Order Items</h4>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={() => append({ product_id: '', quantity: 1 })}
          >
            Add Item
          </Button>
        </div>

        {fields.map((field, index) => {
          const price = getProductPrice(watchedItems[index]?.product_id);
          const lineTotal = (watchedItems[index]?.quantity || 0) * price;
          return (
            <div key={field.id} className="order-item-row">
              <div className="order-item-product">
                <Select
                  {...register(`items.${index}.product_id`, {
                    required: 'Select a product',
                    valueAsNumber: true,
                  })}
                >
                  <option value="">— Product —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                      {p.name} ({p.quantity} in stock) — {formatCurrency(p.price)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="order-item-qty">
                <Input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  {...register(`items.${index}.quantity`, {
                    required: true,
                    min: 1,
                    valueAsNumber: true,
                  })}
                />
              </div>
              <div className="order-item-total">
                {lineTotal > 0 ? formatCurrency(lineTotal) : '—'}
              </div>
              {fields.length > 1 && (
                <button
                  type="button"
                  className="item-remove"
                  onClick={() => remove(index)}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="order-summary">
        <span>Estimated Total</span>
        <span className="order-total-value">{formatCurrency(subtotal)}</span>
      </div>

      <div className="form-actions">
        <Button type="submit" loading={loading}>Place Order</Button>
      </div>
    </form>
  );
}

export default function OrdersPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const { data: orders = [], isLoading } = useQuery('orders', () =>
    ordersApi.getAll().then((r) => r.data)
  );
  const { data: customers = [] } = useQuery('customers', () =>
    customersApi.getAll().then((r) => r.data)
  );
  const { data: products = [] } = useQuery('products', () =>
    productsApi.getAll().then((r) => r.data)
  );

  const createMutation = useMutation(ordersApi.create, {
    onSuccess: () => {
      qc.invalidateQueries('orders');
      qc.invalidateQueries('products');
      qc.invalidateQueries('dashboard');
      setCreateOpen(false);
      toast.success('Order placed successfully!');
    },
    onError: (e) => toast.error(e.userMessage),
  });

  const deleteMutation = useMutation(ordersApi.delete, {
    onSuccess: () => {
      qc.invalidateQueries('orders');
      qc.invalidateQueries('products');
      qc.invalidateQueries('dashboard');
      setDeleteId(null);
      toast.success('Order cancelled and stock restored.');
    },
    onError: (e) => toast.error(e.userMessage),
  });

  const { format: formatCurrency } = useCurrency();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Orders</h2>
          <p className="page-subtitle">{orders.length} total orders</p>
        </div>
        <Button icon={Plus} onClick={() => setCreateOpen(true)}>
          New Order
        </Button>
      </div>

      <Card style={{ padding: 0 }}>
        {isLoading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(5)].map((_, i) => <Skeleton key={i} style={{ height: 56 }} />)}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No orders yet"
            description="Create your first order to get started."
            action={<Button icon={Plus} onClick={() => setCreateOpen(true)}>New Order</Button>}
          />
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <span className="order-id-cell">#{order.id}</span>
                    </td>
                    <td>
                      <div className="text-primary">{order.customer.full_name}</div>
                      <div className="text-muted small">{order.customer.email}</div>
                    </td>
                    <td>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
                    <td><span className="text-primary">{formatCurrency(order.total_amount)}</span></td>
                    <td>
                      <Badge variant={STATUS_VARIANT[order.status] || 'default'}>
                        {order.status}
                      </Badge>
                    </td>
                    <td>{format(new Date(order.created_at), 'MMM d, yyyy')}</td>
                    <td>
                      <div className="action-buttons">
                        <Link to={`/orders/${order.id}`}>
                          <Button variant="ghost" size="sm" icon={Eye}>View</Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => setDeleteId(order.id)}
                          style={{ color: 'var(--danger)' }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create New Order"
        size="lg"
      >
        <CreateOrderForm
          customers={customers}
          products={products}
          onSubmit={(data) => createMutation.mutate(data)}
          loading={createMutation.isLoading}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isLoading}
        title="Cancel Order"
        description="Are you sure you want to cancel this order? Stock will be restored automatically."
      />
    </div>
  );
}
