import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Package, Search } from 'lucide-react';
import { productsApi } from '../lib/api';
import {
  Button, Card, Modal, FormField, Input, Textarea,
  Badge, EmptyState, ConfirmDialog, Skeleton
} from '../components/ui';
import './Page.css';
import { useCurrency } from '../hooks/useCurrency';

function ProductForm({ defaultValues, onSubmit, loading }) {
  const {
    register, handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
      <FormField label="Product Name" error={errors.name?.message} required>
        <Input
          placeholder="e.g. Wireless Keyboard"
          {...register('name', { required: 'Name is required' })}
        />
      </FormField>
      <FormField label="SKU / Code" error={errors.sku?.message} required>
        <Input
          placeholder="e.g. WK-001"
          {...register('sku', { required: 'SKU is required' })}
        />
      </FormField>
      <FormField label="Price (USD)" error={errors.price?.message} required>
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          {...register('price', {
            required: 'Price is required',
            min: { value: 0, message: 'Price cannot be negative' },
            valueAsNumber: true,
          })}
        />
      </FormField>
      <FormField label="Quantity in Stock" error={errors.quantity?.message} required>
        <Input
          type="number"
          min="0"
          placeholder="0"
          {...register('quantity', {
            required: 'Quantity is required',
            min: { value: 0, message: 'Quantity cannot be negative' },
            valueAsNumber: true,
          })}
        />
      </FormField>
      <FormField label="Description" className="span-2">
        <Textarea
          placeholder="Optional product description..."
          {...register('description')}
        />
      </FormField>
      <div className="form-actions span-2">
        <Button type="submit" loading={loading}>
          {defaultValues ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
}

export default function ProductsPage() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');

  const { data: products = [], isLoading } = useQuery('products', () =>
    productsApi.getAll().then((r) => r.data)
  );

  const createMutation = useMutation(productsApi.create, {
    onSuccess: () => {
      qc.invalidateQueries('products');
      qc.invalidateQueries('dashboard');
      setAddOpen(false);
      toast.success('Product created successfully!');
    },
    onError: (e) => toast.error(e.userMessage),
  });

  const updateMutation = useMutation(
    ({ id, data }) => productsApi.update(id, data),
    {
      onSuccess: () => {
        qc.invalidateQueries('products');
        qc.invalidateQueries('dashboard');
        setEditProduct(null);
        toast.success('Product updated!');
      },
      onError: (e) => toast.error(e.userMessage),
    }
  );

  const deleteMutation = useMutation(productsApi.delete, {
    onSuccess: () => {
      qc.invalidateQueries('products');
      qc.invalidateQueries('dashboard');
      setDeleteId(null);
      toast.success('Product deleted.');
    },
    onError: (e) => toast.error(e.userMessage),
  });

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const { format: formatCurrency } = useCurrency();

  const getStockBadge = (qty) => {
    if (qty === 0) return <Badge variant="danger">Out of Stock</Badge>;
    if (qty <= 10) return <Badge variant="warning">Low Stock</Badge>;
    return <Badge variant="success">In Stock</Badge>;
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Products</h2>
          <p className="page-subtitle">{products.length} products in catalog</p>
        </div>
        <div className="page-actions">
          <div className="search-box">
            <Search size={15} className="search-icon" />
            <input
              className="search-input"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button icon={Plus} onClick={() => setAddOpen(true)}>
            Add Product
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
            icon={Package}
            title="No products found"
            description={search ? 'Try a different search term.' : 'Add your first product to get started.'}
            action={!search && <Button icon={Plus} onClick={() => setAddOpen(true)}>Add Product</Button>}
          />
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="text-primary">{product.name}</div>
                      {product.description && (
                        <div className="text-muted small">{product.description.slice(0, 60)}...</div>
                      )}
                    </td>
                    <td><code className="sku-code">{product.sku}</code></td>
                    <td><span className="text-primary">{formatCurrency(product.price)}</span></td>
                    <td><span className="text-primary">{product.quantity}</span></td>
                    <td>{getStockBadge(product.quantity)}</td>
                    <td>
                      <div className="action-buttons">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Pencil}
                          onClick={() => setEditProduct(product)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => setDeleteId(product.id)}
                          style={{ color: 'var(--danger)' }}
                        >
                          Delete
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

      {/* Add Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add New Product">
        <ProductForm
          onSubmit={(data) => createMutation.mutate(data)}
          loading={createMutation.isLoading}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editProduct}
        onClose={() => setEditProduct(null)}
        title="Edit Product"
      >
        {editProduct && (
          <ProductForm
            defaultValues={editProduct}
            onSubmit={(data) => updateMutation.mutate({ id: editProduct.id, data })}
            loading={updateMutation.isLoading}
          />
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isLoading}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
      />
    </div>
  );
}
