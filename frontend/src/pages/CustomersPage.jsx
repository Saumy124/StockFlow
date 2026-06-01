import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Trash2, Users, Search, Mail, Phone } from 'lucide-react';
import { customersApi } from '../lib/api';
import {
  Button, Card, Modal, FormField, Input,
  Badge, EmptyState, ConfirmDialog, Skeleton
} from '../components/ui';
import { format } from 'date-fns';
import './Page.css';

function CustomerForm({ onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
      <FormField label="Full Name" error={errors.full_name?.message} required>
        <Input
          placeholder="Jane Doe"
          {...register('full_name', { required: 'Name is required' })}
        />
      </FormField>
      <FormField label="Email Address" error={errors.email?.message} required>
        <Input
          type="email"
          placeholder="jane@example.com"
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
          })}
        />
      </FormField>
      <FormField label="Phone Number" error={errors.phone?.message}>
        <Input
          type="tel"
          placeholder="+1 (555) 000-0000"
          {...register('phone')}
        />
      </FormField>
      <div className="form-actions span-2">
        <Button type="submit" loading={loading}>Add Customer</Button>
      </div>
    </form>
  );
}

export default function CustomersPage() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');

  const { data: customers = [], isLoading } = useQuery('customers', () =>
    customersApi.getAll().then((r) => r.data)
  );

  const createMutation = useMutation(customersApi.create, {
    onSuccess: () => {
      qc.invalidateQueries('customers');
      qc.invalidateQueries('dashboard');
      setAddOpen(false);
      toast.success('Customer added!');
    },
    onError: (e) => toast.error(e.userMessage),
  });

  const deleteMutation = useMutation(customersApi.delete, {
    onSuccess: () => {
      qc.invalidateQueries('customers');
      qc.invalidateQueries('dashboard');
      setDeleteId(null);
      toast.success('Customer deleted.');
    },
    onError: (e) => toast.error(e.userMessage),
  });

  const filtered = customers.filter(
    (c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name) =>
    name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Customers</h2>
          <p className="page-subtitle">{customers.length} registered customers</p>
        </div>
        <div className="page-actions">
          <div className="search-box">
            <Search size={15} className="search-icon" />
            <input
              className="search-input"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button icon={Plus} onClick={() => setAddOpen(true)}>
            Add Customer
          </Button>
        </div>
      </div>

      <Card style={{ padding: 0 }}>
        {isLoading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(5)].map((_, i) => <Skeleton key={i} style={{ height: 50 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers found"
            description={search ? 'Try a different search term.' : 'Add your first customer to get started.'}
            action={!search && <Button icon={Plus} onClick={() => setAddOpen(true)}>Add Customer</Button>}
          />
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="customer-cell">
                        <div className="customer-avatar">{getInitials(customer.full_name)}</div>
                        <span className="text-primary">{customer.full_name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="icon-cell">
                        <Mail size={13} className="cell-icon" />
                        {customer.email}
                      </div>
                    </td>
                    <td>
                      {customer.phone ? (
                        <div className="icon-cell">
                          <Phone size={13} className="cell-icon" />
                          {customer.phone}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>{format(new Date(customer.created_at), 'MMM d, yyyy')}</td>
                    <td>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={() => setDeleteId(customer.id)}
                        style={{ color: 'var(--danger)' }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add New Customer">
        <CustomerForm
          onSubmit={(data) => createMutation.mutate(data)}
          loading={createMutation.isLoading}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isLoading}
        title="Delete Customer"
        description="Are you sure you want to delete this customer? Their orders will also be removed."
      />
    </div>
  );
}
