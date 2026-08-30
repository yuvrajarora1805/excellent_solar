'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const [projectRes, reservationsRes, ordersRes] = await Promise.all([
          fetch(`/api/projects/${id}`),
          fetch(`/api/reservations?project_id=${id}`),
          fetch(`/api/orders?limit=50`)
        ]);
        
        if (!projectRes.ok) {
          throw new Error('Project not found');
        }
        
        const projectData = await projectRes.json();
        setProject(projectData);
        
        if (reservationsRes.ok) {
          const resData = await reservationsRes.json();
          setReservations(resData);
        }

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          const list = ordersData.orders || [];
          // Filter matching orders for this customer / project
          const matching = list.filter((o: any) =>
            o.customer_id === projectData.customer_id ||
            (o.customer_name && projectData.customer_name && o.customer_name.toLowerCase().includes(projectData.customer_name.toLowerCase())) ||
            (o.order_number && projectData.project_id && o.order_number.includes(projectData.id))
          );
          
          // Fetch full items & scanned serials for matching orders
          const detailedOrders = await Promise.all(
            matching.map(async (ord: any) => {
              try {
                const r = await fetch(`/api/orders/${ord.id}`);
                if (r.ok) {
                  const d = await r.json();
                  return d.order;
                }
              } catch {}
              return ord;
            })
          );

          setOrders(detailedOrders);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-container"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-8 text-center bg-error-container text-on-error-container rounded">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error || 'Project not found'}</p>
        <Link href="/projects" className="mt-4 inline-block text-primary hover:underline">
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Project #{project.id}</h1>
          <p className="text-on-surface-variant mt-1">Status: <span className="font-bold text-primary">{project.status}</span></p>
        </div>
        <Link href="/projects">
          <button className="px-4 py-2 border border-outline-variant bg-surface-container-lowest text-on-surface font-label-bold rounded hover:bg-surface-container-low transition-colors industrial-shadow flex items-center gap-2">
            <span className="material-symbols-outlined">arrow_back</span>
            Back
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Details */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded p-6 industrial-shadow">
          <h3 className="text-lg font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant">Customer Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Name:</span>
              <span className="font-medium text-on-surface">{project.customer_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Mobile:</span>
              <span className="font-medium text-on-surface">{project.customer_mobile || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Site Address:</span>
              <span className="font-medium text-on-surface text-right max-w-[200px]">{project.site_address || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded p-6 industrial-shadow">
          <h3 className="text-lg font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant">Technical Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Capacity:</span>
              <span className="font-medium text-on-surface">{project.capacity ? `${project.capacity} kW` : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">DISCOM:</span>
              <span className="font-medium text-on-surface">{project.discom || 'PSPCL'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Consumer No:</span>
              <span className="font-medium text-on-surface">{project.consumer_number || project.account_number || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Sanctioned Load:</span>
              <span className="font-medium text-on-surface">{project.sanctioned_load ? `${project.sanctioned_load} kW` : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Location & Geo Tag */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded p-6 industrial-shadow">
          <h3 className="text-lg font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant">Location & Site Photo</h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Geo Location:</span>
              <span className="font-medium text-on-surface">{project.geotag_location || (project.latitude ? `${project.latitude}, ${project.longitude}` : 'N/A')}</span>
            </div>
            
            {project.site_photo_path && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-on-surface-variant font-medium">Geotagged Site Photo:</p>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    👤 Uploaded by: {project.created_by_name || 'Field Representative'}
                  </span>
                </div>
                <div className="rounded-lg overflow-hidden border border-outline-variant">
                  <img src={project.site_photo_path} alt="Site Geotag" className="w-full object-cover max-h-64" />
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900 text-xs border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <span className="font-semibold">👤 {project.created_by_name || 'Field Representative'}</span>
                    {project.geotag_location && <span className="font-mono text-[11px] text-slate-500">{project.geotag_location}</span>}
                  </div>
                </div>
              </div>
            )}

            {(project.latitude || project.geotag_location) && (
              <div className="pt-4 border-t border-outline-variant/50">
                <a 
                  href={`https://www.google.com/maps?q=${project.latitude ? `${project.latitude},${project.longitude}` : project.geotag_location?.replace('Lat: ', '').replace(', Lng: ', ',')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-surface-container-low hover:bg-surface-container transition-colors rounded text-primary font-medium"
                >
                  <span className="material-symbols-outlined text-sm">map</span>
                  View on Google Maps
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Dispatched Materials & Delivery Challans */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded p-6 industrial-shadow lg:col-span-2">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant">
            <h3 className="text-lg font-bold text-on-surface">Dispatched Materials & Delivery Challans</h3>
            <Link href="/orders/new">
              <span className="text-xs bg-primary text-white font-bold px-3 py-1.5 rounded hover:bg-primary/90 transition">
                + Create New Dispatch Order
              </span>
            </Link>
          </div>

          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((ord: any) => (
                <div key={ord.id} className="p-4 border rounded-lg bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <div>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                        Challan #{ord.order_number}
                      </span>
                      <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                        {ord.status}
                      </span>
                    </div>
                    <Link href={`/orders/${ord.id}`}>
                      <span className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                        📄 View / Print Delivery Challan →
                      </span>
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-600 dark:text-slate-400 border-y py-2">
                    <div>
                      <span className="block font-bold text-slate-900 dark:text-white">Vehicle No:</span>
                      {ord.vehicle_number || 'N/A'}
                    </div>
                    <div>
                      <span className="block font-bold text-slate-900 dark:text-white">Driver:</span>
                      {ord.driver_name || 'N/A'}
                    </div>
                    <div>
                      <span className="block font-bold text-slate-900 dark:text-white">Dispatch Date:</span>
                      {ord.dispatched_at ? new Date(ord.dispatched_at).toLocaleDateString('en-IN') : new Date(ord.created_at).toLocaleDateString('en-IN')}
                    </div>
                    <div>
                      <span className="block font-bold text-slate-900 dark:text-white">Total Amount:</span>
                      ₹{ord.total_amount?.toLocaleString('en-IN')}
                    </div>
                  </div>

                  {/* Items List */}
                  {ord.items && ord.items.length > 0 && (
                    <div className="text-xs">
                      <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Dispatched Items:</p>
                      <div className="flex flex-wrap gap-2">
                        {ord.items.map((it: any, idx: number) => (
                          <span key={idx} className="px-2.5 py-1 bg-white dark:bg-slate-800 border rounded font-medium text-slate-800 dark:text-slate-200">
                            {it.product_name || `Product #${it.product_id}`}: <strong>{it.quantity} Pcs</strong> @ ₹{it.unit_price}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scanned Solar Panel Barcodes List */}
                  {ord.serials && ord.serials.length > 0 && (
                    <div className="text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
                      <p className="font-bold text-blue-700 dark:text-blue-400 mb-1.5">
                        Scanned Solar Panel Barcode Serial Numbers ({ord.serials.length}):
                      </p>
                      <div className="flex flex-wrap gap-1.5 font-mono">
                        {ord.serials.map((s: any, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800 rounded text-[11px] font-bold">
                            #{idx + 1}: {s.serial_number}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant italic">No dispatched store orders or challans created yet for this project.</p>
          )}
        </div>

        {/* Reserved Items */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded p-6 industrial-shadow">
          <h3 className="text-lg font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant">Reserved Inventory</h3>
          {reservations.length > 0 ? (
            <div className="space-y-3">
              {reservations.map((res: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-surface-container-low rounded text-sm">
                  <div>
                    <span className="font-medium text-on-surface">{res.product_name || `Product ID: ${res.product_id}`}</span>
                    <p className="text-xs text-on-surface-variant mt-1">Status: {res.status}</p>
                  </div>
                  <span className="font-bold bg-primary-container text-on-primary-container px-2 py-1 rounded">Qty: {res.quantity}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant italic">No reserved items for this project.</p>
          )}
        </div>
      </div>
    </div>
  );
}
