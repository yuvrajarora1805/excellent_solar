'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const [projectRes, reservationsRes] = await Promise.all([
          fetch(`/api/projects/${id}`),
          fetch(`/api/reservations?project_id=${id}`)
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
              <span className="font-medium text-on-surface">{project.discom || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Consumer No:</span>
              <span className="font-medium text-on-surface">{project.consumer_number || 'N/A'}</span>
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
                <p className="text-on-surface-variant mb-2 font-medium">Geotagged Site Photo:</p>
                <div className="rounded-lg overflow-hidden border border-outline-variant">
                  <img src={project.site_photo_path} alt="Site Geotag" className="w-full object-cover max-h-64" />
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
