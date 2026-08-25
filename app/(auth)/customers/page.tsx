'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Customer {
  id: number;
  name: string;
  mobile: string;
  email?: string;
  address: string;
  city: string;
  district: string;
  state: string;
  project_count?: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 9;

  useEffect(() => {
    fetchCustomers();
  }, [search, page]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
        ...(search && { search }),
      });

      const response = await fetch(`/api/customers?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      const response = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchCustomers();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete customer');
      }
    } catch (error) {
      console.error('Failed to delete customer:', error);
      alert('Failed to delete customer');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-headline-md font-bold text-on-surface">Customers</h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Manage customer information and details
          </p>
        </div>
        <Link href="/customers/new">
          <button className="btn-primary flex items-center gap-2">
            <span className="material-symbols-outlined">person_add</span>
            Add Customer
          </button>
        </Link>
      </div>

      {/* Search Card */}
      <div className="card-base p-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none select-none">search</span>
          <input
            placeholder="Search customers by name, mobile, or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input-base pl-10"
          />
        </div>
      </div>

      {/* Customers Grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card-base p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-surface-container rounded w-3/4"></div>
                <div className="h-3 bg-surface-container rounded w-1/2"></div>
                <div className="h-3 bg-surface-container rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="card-base p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">badge</span>
            </div>
            <h3 className="text-headline-sm font-semibold text-on-surface mb-2">No customers found</h3>
            <p className="text-body-md text-on-surface-variant mb-6">Get started by adding your first customer</p>
            <Link href="/customers/new">
              <button className="btn-primary flex items-center gap-2 mx-auto">
                <span className="material-symbols-outlined">person_add</span>
                Add Customer
              </button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="card-base p-6 group hover:border-primary-container transition-colors"
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between pb-4 border-b border-outline-variant">
                    <div className="flex-1">
                      <h3 className="text-headline-sm font-semibold text-on-surface">{customer.name}</h3>
                      <p className="text-body-md text-on-surface-variant flex items-center gap-1.5 mt-1">
                        <span className="material-symbols-outlined text-sm">call</span>
                        {customer.mobile}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {customer.email && (
                      <div className="flex items-start gap-3 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-on-surface-variant">email</span>
                        </div>
                        <span className="text-on-surface-variant break-all">{customer.email}</span>
                      </div>
                    )}

                    <div className="flex items-start gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-on-surface-variant">location_on</span>
                      </div>
                      <div className="text-on-surface-variant">
                        {customer.address ? (
                          <p className="font-medium text-on-surface">{customer.address}</p>
                        ) : null}
                        {(customer.city && customer.city !== 'N/A') || (customer.district && customer.district !== 'N/A') ? (
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            {[customer.city, customer.district, customer.state].filter(x => x && x !== 'N/A').join(', ')}
                          </p>
                        ) : (
                          !customer.address && <p>N/A</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {customer.project_count !== undefined && customer.project_count > 0 && (
                    <div className="pt-4 border-t border-outline-variant">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary-container">folder_special</span>
                          <span className="text-sm font-medium text-on-surface">
                            {customer.project_count} {customer.project_count === 1 ? 'project' : 'projects'}
                          </span>
                        </div>
                        <Link href={`/projects?search=${customer.id}`} className="text-sm text-primary-container hover:underline font-medium">
                          View →
                        </Link>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Link href={`/customers/${customer.id}/edit`} className="flex-1">
                      <button className="btn-outline w-full flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-sm">edit</span>
                        Edit
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(customer.id)}
                      className="btn-outline text-error hover:bg-error-container flex items-center justify-center px-4"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <p className="text-body-md text-on-surface-variant">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} customers
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="btn-outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    const isCurrentPage = pageNum === page;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-1.5 rounded font-label-bold ${
                          isCurrentPage
                            ? 'bg-primary-container text-on-primary-container'
                            : 'btn-outline'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  className="btn-outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
