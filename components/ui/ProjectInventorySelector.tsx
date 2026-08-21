'use client';

import { useState, useEffect, useCallback } from 'react';

interface Product {
  id: number;
  product_code: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  unit: string;
  current_stock: number;
  reserved_stock: number;
  available_stock: number;
}

export interface ReservationItem {
  product_id: number;
  product_name: string;
  product_code: string;
  category: string;
  unit: string;
  quantity: number;
  available_stock: number;
}

interface ProjectInventorySelectorProps {
  value: ReservationItem[];
  onChange: (items: ReservationItem[]) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  'Solar Panels': 'solar_power',
  'Inverters': 'electrical_services',
  'Structure': 'hardware',
  'Wiring & Cable': 'cable',
  'Junction Box': 'inventory_2',
  'MC4 Connector': 'cable',
  'Earthing': 'electric_bolt',
  'Battery': 'battery_6_bar',
};

export default function ProjectInventorySelector({ value, onChange }: ProjectInventorySelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    fetch('/api/inventory/products')
      .then(r => r.json())
      .then(data => { setProducts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category))).sort()];

  const filtered = products.filter(p => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase()) ||
      p.product_code.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const getSelected = (productId: number) => value.find(v => v.product_id === productId);

  const handleQtyChange = useCallback((product: Product, qty: number) => {
    if (qty <= 0) {
      onChange(value.filter(v => v.product_id !== product.id));
    } else {
      const capped = Math.min(qty, product.available_stock);
      const existing = value.find(v => v.product_id === product.id);
      if (existing) {
        onChange(value.map(v => v.product_id === product.id ? { ...v, quantity: capped } : v));
      } else {
        onChange([...value, {
          product_id: product.id,
          product_name: product.name,
          product_code: product.product_code,
          category: product.category,
          unit: product.unit,
          quantity: capped,
          available_stock: product.available_stock,
        }]);
      }
    }
  }, [value, onChange]);

  const totalItems = value.reduce((s, v) => s + v.quantity, 0);

  return (
    <div className="space-y-4">
      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">search</span>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-base pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize ${
                activeCategory === cat
                  ? 'bg-primary-container text-on-primary-container'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Product List */}
        <div className="lg:col-span-2 space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {loading && (
            <div className="flex items-center justify-center py-12 text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
              Loading inventory...
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl block mb-2">inventory_2</span>
              No products found
            </div>
          )}

          {filtered.map(product => {
            const selected = getSelected(product.id);
            const isOutOfStock = product.available_stock <= 0;

            return (
              <div
                key={product.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  selected
                    ? 'border-primary-container bg-primary-container/10'
                    : isOutOfStock
                    ? 'border-outline-variant bg-surface-container opacity-60'
                    : 'border-outline-variant bg-surface-container hover:bg-surface-container-high'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary-container text-lg">
                    {CATEGORY_ICONS[product.category] || 'inventory_2'}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-on-surface text-sm truncate">{product.name}</div>
                  <div className="text-xs text-on-surface-variant flex items-center gap-2 mt-0.5">
                    <span>{product.brand} {product.model}</span>
                    <span>·</span>
                    <span className={`font-semibold ${isOutOfStock ? 'text-error' : product.available_stock < 5 ? 'text-primary-container' : 'text-tertiary'}`}>
                      {product.available_stock} {product.unit} available
                    </span>
                  </div>
                </div>

                {/* Quantity Control */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    disabled={!selected}
                    onClick={() => handleQtyChange(product, (selected?.quantity || 0) - 1)}
                    className="w-7 h-7 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center hover:bg-error-container hover:text-on-error-container disabled:opacity-30 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>

                  <input
                    type="number"
                    min={0}
                    max={product.available_stock}
                    value={selected?.quantity || ''}
                    disabled={isOutOfStock}
                    onChange={e => handleQtyChange(product, parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-12 text-center text-sm bg-surface border border-outline-variant rounded-lg py-1 focus:outline-none focus:border-primary-container disabled:opacity-50"
                  />

                  <button
                    type="button"
                    disabled={isOutOfStock || (selected?.quantity || 0) >= product.available_stock}
                    onClick={() => handleQtyChange(product, (selected?.quantity || 0) + 1)}
                    className="w-7 h-7 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center hover:bg-primary-container/20 disabled:opacity-30 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cart Summary */}
        <div className="bg-surface-container-low rounded-xl p-4 space-y-3 h-fit">
          <h4 className="text-label-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-lg">shopping_cart</span>
            Reservation Summary
            {value.length > 0 && (
              <span className="ml-auto text-xs bg-primary-container text-on-primary-container rounded-full px-2 py-0.5">
                {value.length} items
              </span>
            )}
          </h4>

          {value.length === 0 ? (
            <p className="text-xs text-on-surface-variant text-center py-6">
              No items selected yet. Pick products from the list.
            </p>
          ) : (
            <div className="space-y-2">
              {value.map(item => (
                <div key={item.product_id} className="flex items-start justify-between gap-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-on-surface text-xs truncate">{item.product_name}</div>
                    <div className="text-xs text-on-surface-variant">{item.category}</div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-xs font-semibold text-primary-container bg-primary-container/10 px-2 py-0.5 rounded">
                      {item.quantity} {item.unit}
                    </span>
                    <button
                      type="button"
                      onClick={() => onChange(value.filter(v => v.product_id !== item.product_id))}
                      className="text-on-surface-variant hover:text-error transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                </div>
              ))}

              <div className="border-t border-outline-variant pt-2 mt-2">
                <div className="text-xs text-on-surface-variant flex justify-between">
                  <span>Total items to reserve</span>
                  <span className="font-bold text-on-surface">{totalItems} units</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
