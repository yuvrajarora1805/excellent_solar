'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-layout';
import { DataTable, StatusBadge } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Package, Check, X, AlertCircle } from 'lucide-react';

interface InventoryReservation {
  id: number;
  reservation_number: string;
  project_id: number;
  project_id_str: string;
  reservation_date: string;
  status: string;
  items: Array<{
    product_name: string;
    requested_quantity: number;
    reserved_quantity: number;
    shortage_quantity: number;
  }>;
}

export default function InventoryReservationsPage() {
  const [reservations, setReservations] = useState<InventoryReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<InventoryReservation | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/reservations');
      const data = await response.json();
      setReservations(data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReserve = async (id: number) => {
    try {
      await fetch(`/api/reservations/${id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reserve' }),
      });
      await fetchReservations();
      setIsDetailsOpen(false);
    } catch (error) {
      console.error('Error reserving items:', error);
    }
  };

  const handleRelease = async (id: number) => {
    if (!confirm('Are you sure you want to release this reservation? Stock will become available again.')) return;

    try {
      await fetch(`/api/reservations/${id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'release' }),
      });
      await fetchReservations();
      setIsDetailsOpen(false);
    } catch (error) {
      console.error('Error releasing reservation:', error);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'FULLY_RESERVED': return 'success';
      case 'PARTIAL': return 'warning';
      case 'REQUESTED': return 'info';
      case 'ISSUED': return 'success';
      case 'RELEASED': return 'default';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const columns = [
    {
      key: 'reservation_number',
      title: 'Reservation #',
      render: (value: string) => (
        <span className="font-mono text-sm font-medium">{value}</span>
      ),
    },
    {
      key: 'project_id',
      title: 'Project',
      render: (value: number) => (
        <span className="font-mono text-sm">ES-2026-{String(value).padStart(4, '0')}</span>
      ),
    },
    {
      key: 'reservation_date',
      title: 'Date',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'items_summary',
      title: 'Items',
      render: (_: any, row: InventoryReservation) => (
        <span className="text-sm">{row.items?.length || 0} items</span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: string) => <StatusBadge status={value} variant={getStatusVariant(value)} />,
    },
    {
      key: 'shortage',
      title: 'Shortage',
      render: (_: any, row: InventoryReservation) => {
        const shortage = row.items?.reduce((sum, item) => sum + (item.shortage_quantity || 0), 0) || 0;
        if (shortage === 0) return null;
        return (
          <span className="flex items-center gap-1 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            {shortage} items
          </span>
        );
      },
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, row: InventoryReservation) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedReservation(row);
              setIsDetailsOpen(true);
            }}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            View Details
          </button>
          {row.status === 'REQUESTED' && (
            <button
              onClick={() => handleReserve(row.id)}
              className="p-1 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
              title="Reserve Items"
            >
              <Check className="w-4 h-4 text-green-600" />
            </button>
          )}
          {['FULLY_RESERVED', 'PARTIAL'].includes(row.status) && (
            <button
              onClick={() => handleRelease(row.id)}
              className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Release Reservation"
            >
              <X className="w-4 h-4 text-red-600" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Inventory Reservations"
        description="Manage inventory reservations for projects - check availability and reserve stock"
        breadcrumbs={[
          { name: 'Inventory', href: '/inventory' },
          { name: 'Reservations', href: '/inventory/reservations' },
        ]}
      />

      <div className="card-professional">
        <DataTable
          columns={columns}
          data={reservations}
          isLoading={isLoading}
          emptyMessage="No inventory reservations found"
        />
      </div>

      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={`Reservation ${selectedReservation?.reservation_number}`}
        size="lg"
      >
        {selectedReservation && (
          <ReservationDetails
            reservation={selectedReservation}
            onReserve={() => handleReserve(selectedReservation.id)}
            onRelease={() => handleRelease(selectedReservation.id)}
            onClose={() => setIsDetailsOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
}

function ReservationDetails({ reservation, onReserve, onRelease, onClose }: any) {
  const totalRequested = reservation.items?.reduce((sum: number, item: any) => sum + item.requested_quantity, 0) || 0;
  const totalReserved = reservation.items?.reduce((sum: number, item: any) => sum + item.reserved_quantity, 0) || 0;
  const totalShortage = reservation.items?.reduce((sum: number, item: any) => sum + item.shortage_quantity, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalRequested}</div>
          <div className="text-sm text-slate-500">Requested</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{totalReserved}</div>
          <div className="text-sm text-slate-500">Reserved</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{totalShortage}</div>
          <div className="text-sm text-slate-500">Shortage</div>
        </div>
      </div>

      {/* Items */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Reserved Items</h3>
        <div className="space-y-2">
          {reservation.items?.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
              <div>
                <div className="font-medium text-slate-900 dark:text-white">{item.product_name}</div>
                <div className="text-sm text-slate-500">
                  Requested: {item.requested_quantity} | Reserved: {item.reserved_quantity}
                </div>
              </div>
              {item.shortage_quantity > 0 && (
                <span className="text-sm text-red-600 font-medium">
                  -{item.shortage_quantity} shortage
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          Close
        </button>
        <div className="flex gap-3">
          {reservation.status === 'REQUESTED' && (
            <button
              onClick={onReserve}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Reserve Available Stock
            </button>
          )}
          {['FULLY_RESERVED', 'PARTIAL'].includes(reservation.status) && (
            <button
              onClick={onRelease}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Release Reservation
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
