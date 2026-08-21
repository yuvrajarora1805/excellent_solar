'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, X, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface InstallationPhoto {
  id: number;
  category: string;
  file_path: string;
}

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

interface InstallationData {
  id: number;
  project_id: number | string;
  customer_name?: string;
  installation_date?: string;
  installed_capacity?: number;
  panel_quantity?: number;
  inverter_model?: string;
  structure_installed: boolean;
  earthing_completed: boolean;
  wiring_completed: boolean;
  testing_completed: boolean;
  remarks?: string;
  status: string;
  created_by_name?: string;
  photos?: InstallationPhoto[];
  reservations?: ReservationItem[];
}

export default function InstallationDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [installation, setInstallation] = useState<InstallationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstallation();
  }, [id]);

  const fetchInstallation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/installation/${id}`);
      if (response.ok) {
        const data = await response.json();
        setInstallation(data);
      }
    } catch (error) {
      console.error('Failed to fetch installation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (approved: boolean) => {
    const reason = approved ? '' : prompt('Rejection reason:');
    if (approved === false && reason === null) return;

    try {
      const response = await fetch(`/api/installation/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved, reason }),
      });

      if (response.ok) {
        fetchInstallation();
        alert(approved ? 'Installation approved!' : 'Installation rejected!');
      } else {
        alert('Failed to update installation status');
      }
    } catch (error) {
      alert('Error updating installation status');
    }
  };

  if (loading) return <div className="p-8 text-center text-on-surface-variant">Loading...</div>;
  if (!installation) return <div className="p-8 text-center text-error">Installation not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/installation">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          </Link>
          <div>
            <h1 className="text-headline-sm font-bold">Installation Details</h1>
            <p className="text-body-md text-on-surface-variant">Project: {installation.project_id}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <span className={`status-badge ${
            installation.status === 'SUBMITTED' ? 'status-badge-warning' :
            installation.status === 'VERIFIED' ? 'status-badge-success' :
            installation.status === 'REJECTED' ? 'status-badge-error' :
            'status-badge-info'
          }`}>
            {installation.status}
          </span>
          
          {installation.status === 'SUBMITTED' && (
            <>
              <Button onClick={() => handleVerify(true)} className="bg-green-600 hover:bg-green-700">
                <Check className="w-4 h-4 mr-2" /> Approve
              </Button>
              <Button onClick={() => handleVerify(false)} variant="destructive">
                <X className="w-4 h-4 mr-2" /> Reject
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-on-surface-variant block mb-1">Installation Date</span>
                <span className="font-medium">
                  {installation.installation_date ? new Date(installation.installation_date).toLocaleDateString('en-IN') : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-on-surface-variant block mb-1">Installed Capacity</span>
                <span className="font-medium">{installation.installed_capacity ? `${installation.installed_capacity} kW` : 'N/A'}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block mb-1">Panel Quantity</span>
                <span className="font-medium">{installation.panel_quantity || 'N/A'}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block mb-1">Inverter Model</span>
                <span className="font-medium">{installation.inverter_model || 'N/A'}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block mb-1">Installed By</span>
                <span className="font-medium">{installation.created_by_name || 'N/A'}</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-outline-variant grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-on-surface-variant block mb-1">Structure</span>
                <span className={`font-medium ${installation.structure_installed ? 'text-green-600' : 'text-error'}`}>
                  {installation.structure_installed ? 'Completed' : 'Pending'}
                </span>
              </div>
              <div>
                <span className="text-on-surface-variant block mb-1">Earthing</span>
                <span className={`font-medium ${installation.earthing_completed ? 'text-green-600' : 'text-error'}`}>
                  {installation.earthing_completed ? 'Completed' : 'Pending'}
                </span>
              </div>
              <div>
                <span className="text-on-surface-variant block mb-1">Wiring</span>
                <span className={`font-medium ${installation.wiring_completed ? 'text-green-600' : 'text-error'}`}>
                  {installation.wiring_completed ? 'Completed' : 'Pending'}
                </span>
              </div>
              <div>
                <span className="text-on-surface-variant block mb-1">Testing</span>
                <span className={`font-medium ${installation.testing_completed ? 'text-green-600' : 'text-error'}`}>
                  {installation.testing_completed ? 'Completed' : 'Pending'}
                </span>
              </div>
            </div>

            {installation.remarks && (
              <div className="pt-4 border-t border-outline-variant">
                <span className="text-on-surface-variant block mb-1 text-sm">Remarks</span>
                <p className="text-sm bg-surface-variant/30 p-3 rounded-md">{installation.remarks}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reserved Materials</CardTitle>
          </CardHeader>
          <CardContent>
            {!installation.reservations || installation.reservations.length === 0 ? (
              <div className="text-center py-4 text-on-surface-variant text-sm">No materials reserved for this installation.</div>
            ) : (
              <div className="space-y-3">
                {installation.reservations.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-surface-variant/20 rounded-md border border-outline-variant">
                    <Box className="w-5 h-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{item.product_name}</div>
                      <div className="text-xs text-on-surface-variant truncate">
                        {item.brand} {item.model ? `• ${item.model}` : ''}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-medium text-sm">{item.quantity} qty</div>
                      <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm inline-block mt-1 ${
                        item.status === 'ISSUED' ? 'bg-green-100 text-green-800' :
                        item.status === 'RELEASED' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {item.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Installation Photos</CardTitle>
        </CardHeader>
        <CardContent>
          {!installation.photos || installation.photos.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant">No photos uploaded for this installation.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {installation.photos.map((photo) => (
                <div key={photo.id} className="border border-outline-variant rounded-lg overflow-hidden group">
                  <div className="aspect-square bg-surface-variant/30 relative">
                    <img 
                      src={photo.file_path} 
                      alt={photo.category} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/e2e8f0/64748b?text=Image+Not+Found';
                      }}
                    />
                  </div>
                  <div className="p-3 bg-surface text-center border-t border-outline-variant">
                    <span className="text-sm font-medium truncate block">{photo.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
