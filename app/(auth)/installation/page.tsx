'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ReservationItem {
  id: number;
  product_id: number;
  product_name?: string;
  product_code?: string;
  quantity: number;
  status: 'RESERVED' | 'ISSUED' | 'RELEASED';
  brand?: string;
  model?: string;
}

interface Installation {
  id: number;
  project_id: string | number;
  customer_name: string;
  status: string;
  installation_date?: string;
  installed_capacity?: number;
  created_by_name: string;
  reservations?: ReservationItem[];
}

export default function InstallationPage() {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  // track which cards have expanded reservations panel
  const [expandedReservations, setExpandedReservations] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchInstallations();
  }, [filter]);

  const fetchInstallations = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const [instRes, resRes] = await Promise.all([
        fetch(`/api/installation${params}`),
        fetch('/api/reservations'),
      ]);

      if (!instRes.ok) return;
      const instData = await instRes.json();
      const instList: Installation[] = instData.installations || [];

      // Build a map of project numeric ID -> reservations
      let reservationsByProject: Record<number, ReservationItem[]> = {};
      if (resRes.ok) {
        const resData = await resRes.json();
        // resData is an array of grouped objects: { project_id, items: [...] }
        const grouped: any[] = Array.isArray(resData) ? resData : (resData.reservations || []);
        for (const group of grouped) {
          const pid = group.project_id as number;
          if (pid) {
            reservationsByProject[pid] = (group.items || []).map((item: any) => ({
              id: item.id,
              product_id: item.product_id,
              product_name: item.product_name,
              product_code: item.product_code,
              quantity: item.requested_quantity ?? item.quantity,
              status: item.status,
              brand: item.brand,
              model: item.model,
            }));
          }
        }
      }

      // Attach reservations to each installation using the numeric project_id
      const enriched = instList.map(inst => ({
        ...inst,
        reservations: reservationsByProject[inst.project_id as number] || [],
      }));

      setInstallations(enriched);
    } catch (error) {
      console.error('Failed to fetch installations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: number, approved: boolean) => {
    const reason = approved ? '' : prompt('Rejection reason:');
    if (approved === false && reason === null) return;

    try {
      const response = await fetch(`/api/installation/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved, reason }),
      });

      if (response.ok) {
        fetchInstallations();
      } else {
        alert('Failed to verify installation');
      }
    } catch (error) {
      alert('Failed to verify installation');
    }
  };

  const toggleReservations = (id: number) => {
    setExpandedReservations(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getReservationBadge = (status: string) => {
    if (status === 'ISSUED') return 'bg-tertiary-container text-on-tertiary-container';
    if (status === 'RELEASED') return 'bg-surface-container text-on-surface-variant';
    return 'bg-primary-container/30 text-primary'; // RESERVED
  };

  const getReservationIcon = (status: string) => {
    if (status === 'ISSUED') return 'check_circle';
    if (status === 'RELEASED') return 'cancel';
    return 'inventory_2';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-headline-md font-bold text-on-surface">Installations</h1>
        <p className="text-body-md text-on-surface-variant mt-1">Manage and verify solar installations</p>
      </div>

      <div className="flex gap-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input-base cursor-pointer"
        >
          <option value="all">All Installations</option>
          <option value="SUBMITTED">Pending Verification</option>
          <option value="VERIFIED">Verified</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="card-base p-6"><div className="text-center py-8">Loading...</div></div>
      ) : installations.length === 0 ? (
        <div className="card-base p-6"><div className="text-center py-8">No installations found</div></div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {installations.map((inst) => {
            const hasReservations = (inst.reservations?.length ?? 0) > 0;
            const isExpanded = expandedReservations.has(inst.id);
            const allIssued = hasReservations && inst.reservations!.every(r => r.status === 'ISSUED');

            return (
              <div
                key={inst.id}
                className={`card-base p-6 ${
                  inst.status === 'SUBMITTED' ? 'border-l-4 border-l-primary-container' :
                  inst.status === 'VERIFIED' ? 'border-l-4 border-l-tertiary' : ''
                }`}
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between pb-4 border-b border-outline-variant">
                    <div>
                      <h3 className="text-headline-sm font-semibold text-on-surface">{inst.project_id}</h3>
                      <p className="text-body-md text-on-surface-variant">{inst.customer_name}</p>
                    </div>
                    <span className={`status-badge ${
                      inst.status === 'SUBMITTED' ? 'status-badge-warning' :
                      inst.status === 'VERIFIED' ? 'status-badge-success' :
                      inst.status === 'REJECTED' ? 'status-badge-error' :
                      'status-badge-info'
                    }`}>
                      {inst.status.toLowerCase()}
                    </span>
                  </div>

                  {inst.installation_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="material-symbols-outlined text-on-surface-variant">calendar_today</span>
                      <span>{new Date(inst.installation_date).toLocaleDateString('en-IN')}</span>
                    </div>
                  )}

                  {inst.installed_capacity && (
                    <div className="text-sm">
                      <span className="text-on-surface-variant">Installed: </span>
                      <span className="font-medium">{inst.installed_capacity} kW</span>
                    </div>
                  )}

                  <div className="text-label-sm text-on-surface-variant">
                    Installed by: {inst.created_by_name}
                  </div>

                  {/* Reserved Inventory Section */}
                  {hasReservations && (
                    <div className="border border-outline-variant rounded overflow-hidden">
                      <button
                        onClick={() => toggleReservations(inst.id)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-surface-container-low hover:bg-surface-container transition-colors text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">inventory_2</span>
                          <span className="font-medium text-on-surface">
                            Reserved Items ({inst.reservations!.length})
                          </span>
                          {allIssued ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container font-medium">
                              ✓ Sold
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary-container/30 text-primary font-medium">
                              Reserved
                            </span>
                          )}
                        </div>
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="divide-y divide-outline-variant/50">
                          {inst.reservations!.map((res) => (
                            <div key={res.id} className="px-3 py-2 flex items-center gap-3">
                              <span className={`material-symbols-outlined text-[18px] ${
                                res.status === 'ISSUED' ? 'text-tertiary' :
                                res.status === 'RELEASED' ? 'text-on-surface-variant' :
                                'text-primary-container'
                              }`}>
                                {getReservationIcon(res.status)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-on-surface truncate">
                                  {res.product_name || `Product #${res.product_id}`}
                                </p>
                                {(res.brand || res.model) && (
                                  <p className="text-xs text-on-surface-variant truncate">
                                    {[res.brand, res.model].filter(Boolean).join(' · ')}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-sm font-bold text-on-surface">×{res.quantity}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getReservationBadge(res.status)}`}>
                                  {res.status === 'ISSUED' ? 'Sold' : res.status === 'RELEASED' ? 'Released' : 'Reserved'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Link href={`/installation/${inst.id}`} className="flex-1">
                      <button className="btn-outline w-full flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        View
                      </button>
                    </Link>

                    {inst.status === 'SUBMITTED' && (
                      <>
                        <button
                          onClick={() => handleVerify(inst.id, true)}
                          className="bg-tertiary text-on-tertiary px-3 py-2 rounded font-label-bold hover:opacity-90 transition-opacity"
                          title="Approve — will also mark reserved items as sold"
                        >
                          <span className="material-symbols-outlined text-sm">check</span>
                        </button>
                        <button
                          onClick={() => handleVerify(inst.id, false)}
                          className="bg-error text-on-error px-3 py-2 rounded font-label-bold hover:opacity-90 transition-opacity"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


