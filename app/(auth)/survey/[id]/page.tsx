'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SurveyPhoto {
  id: number;
  category: string;
  file_path: string;
  latitude?: number;
  longitude?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason?: string;
}

interface SurveyData {
  id: number;
  project_id: number | string;
  customer_name?: string;
  roof_type?: string;
  roof_condition?: string;
  available_area?: number;
  roof_length?: number;
  roof_width?: number;
  shading: boolean;
  extra_structure: boolean;
  structure_type?: string;
  structure_qty?: number;
  structure_cost?: number;
  estimated_capacity?: number;
  remarks?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  created_by_name?: string;
  photos?: SurveyPhoto[];
}

export default function SurveyDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewingDoc, setViewingDoc] = useState<SurveyPhoto | null>(null);

  useEffect(() => {
    fetchSurvey();
  }, [id]);

  const fetchSurvey = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/survey/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSurvey(data);
      }
    } catch (error) {
      console.error('Failed to fetch survey:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (approved: boolean) => {
    const reason = approved ? '' : prompt('Rejection reason:');
    if (approved === false && reason === null) return;

    try {
      const response = await fetch(`/api/survey/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved, reason }),
      });

      if (response.ok) {
        fetchSurvey();
        alert(approved ? 'Survey approved!' : 'Survey rejected!');
      } else {
        alert('Failed to update survey status');
      }
    } catch (error) {
      alert('Error updating survey status');
    }
  };

  const handlePhotoStatus = async (photoId: number, status: 'APPROVED' | 'REJECTED') => {
    const reason = status === 'REJECTED' ? prompt('Rejection reason:') : '';
    if (status === 'REJECTED' && reason === null) return;

    try {
      const response = await fetch(`/api/survey/${id}/photo/${photoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason }),
      });

      if (response.ok) {
        fetchSurvey();
      } else {
        alert('Failed to update photo status');
      }
    } catch (error) {
      alert('Error updating photo status');
    }
  };

  const handleApproveAllPhotos = async () => {
    try {
      const response = await fetch(`/api/survey/${id}/photo/approve-all`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchSurvey();
      } else {
        alert('Failed to approve all photos');
      }
    } catch (error) {
      alert('Error approving photos');
    }
  };

  if (loading) return <div className="p-8 text-center text-on-surface-variant">Loading...</div>;
  if (!survey) return <div className="p-8 text-center text-error">Survey not found.</div>;

  const hasPendingPhotos = survey.photos?.some(p => p.status === 'PENDING') || false;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/survey">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          </Link>
          <div>
            <h1 className="text-headline-sm font-bold">Survey Details</h1>
            <p className="text-body-md text-on-surface-variant">Project: {survey.project_id}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <span className={`status-badge ${
            survey.status === 'SUBMITTED' ? 'status-badge-warning' :
            survey.status === 'VERIFIED' ? 'status-badge-success' :
            survey.status === 'REJECTED' ? 'status-badge-error' :
            'status-badge-info'
          }`}>
            {survey.status}
          </span>
          
          {survey.status === 'SUBMITTED' && (
            <>
              <Button 
                onClick={() => handleVerify(true)} 
                className="bg-green-600 hover:bg-green-700"
                disabled={survey.photos?.some(p => p.status === 'REJECTED')}
                title={survey.photos?.some(p => p.status === 'REJECTED') ? "Cannot approve survey with rejected photos" : "This will also approve all pending photos"}
              >
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
            <CardTitle>Location & Survey Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-on-surface-variant block mb-1">Roof Type</span>
                <span className="font-medium">{survey.roof_type || 'N/A'}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block mb-1">Condition</span>
                <span className="font-medium">{survey.roof_condition || 'N/A'}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block mb-1">Available Area</span>
                <span className="font-medium">{survey.available_area ? `${survey.available_area} sq ft` : 'N/A'}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block mb-1">Dimensions</span>
                <span className="font-medium">
                  {survey.roof_length && survey.roof_width ? `${survey.roof_length}x${survey.roof_width} ft` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-on-surface-variant block mb-1">Estimated Capacity</span>
                <span className="font-medium">{survey.estimated_capacity ? `${survey.estimated_capacity} kW` : 'N/A'}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block mb-1">Surveyed By</span>
                <span className="font-medium">{survey.created_by_name || 'N/A'}</span>
              </div>
            </div>
            
            {survey.latitude && survey.longitude && (
              <div className="pt-4 border-t border-outline-variant">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-technical-mono">{survey.latitude.toFixed(6)}, {survey.longitude.toFixed(6)}</span>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${survey.latitude},${survey.longitude}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-primary hover:underline ml-auto"
                  >
                    View on Map
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Technical Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-2 gap-4 text-sm">
               <div>
                 <span className="text-on-surface-variant block mb-1">Shading Present?</span>
                 <span className={`font-medium ${survey.shading ? 'text-orange-600' : 'text-green-600'}`}>
                   {survey.shading ? 'Yes' : 'No'}
                 </span>
               </div>
               <div>
                 <span className="text-on-surface-variant block mb-1">Extra Structure Needed?</span>
                 <span className={`font-medium ${survey.extra_structure ? 'text-orange-600' : 'text-green-600'}`}>
                   {survey.extra_structure ? 'Yes' : 'No'}
                 </span>
               </div>
               
               {survey.extra_structure && (
                 <>
                   <div>
                     <span className="text-on-surface-variant block mb-1">Structure Type</span>
                     <span className="font-medium">{survey.structure_type || 'N/A'}</span>
                   </div>
                   <div>
                     <span className="text-on-surface-variant block mb-1">Quantity/Cost</span>
                     <span className="font-medium">
                       {survey.structure_qty || 0} units @ ₹{survey.structure_cost || 0}
                     </span>
                   </div>
                 </>
               )}
             </div>

             {survey.remarks && (
               <div className="pt-4 border-t border-outline-variant">
                 <span className="text-on-surface-variant block mb-1 text-sm">Remarks</span>
                 <p className="text-sm bg-surface-variant/30 p-3 rounded-md">{survey.remarks}</p>
               </div>
             )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Survey Documents & Photos</CardTitle>
          {hasPendingPhotos && (
            <Button 
              size="sm" 
              variant="outline"
              className="border-green-500 text-green-600 hover:bg-green-50"
              onClick={handleApproveAllPhotos}
            >
              <Check className="w-4 h-4 mr-2" /> Approve All Pending
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!survey.photos || survey.photos.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant">No documents uploaded for this survey.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {survey.photos.map((photo) => {
                const isPdf = photo.file_path.toLowerCase().endsWith('.pdf');
                return (
                  <div key={photo.id} className="border border-outline-variant rounded-lg overflow-hidden group hover:border-primary transition-colors flex flex-col">
                    <div className="aspect-square bg-surface-variant/30 relative flex items-center justify-center cursor-pointer" onClick={() => setViewingDoc(photo)}>
                      {photo.status === 'APPROVED' && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded shadow z-10 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Approved
                        </div>
                      )}
                      {photo.status === 'REJECTED' && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded shadow z-10 flex items-center gap-1">
                          <X className="w-3 h-3" /> Rejected
                        </div>
                      )}
                      {isPdf ? (
                        <div className="text-primary flex flex-col items-center">
                          <span className="material-symbols-outlined text-4xl mb-2">picture_as_pdf</span>
                          <span className="text-sm font-medium">PDF Document</span>
                        </div>
                      ) : (
                        <img 
                          src={photo.file_path} 
                          alt={photo.category} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/e2e8f0/64748b?text=Image+Not+Found';
                          }}
                        />
                      )}
                    </div>
                    <div className="p-3 bg-surface text-center border-t border-outline-variant flex-1 flex flex-col">
                      <span className="text-sm font-medium truncate block mb-2" title={photo.category}>{photo.category}</span>
                      
                      {photo.status === 'REJECTED' && photo.rejection_reason && (
                        <span className="text-xs text-red-500 block mb-2 px-1 text-left line-clamp-2" title={photo.rejection_reason}>
                          Reason: {photo.rejection_reason}
                        </span>
                      )}

                      <div className="mt-auto flex gap-2 w-full">
                        {photo.status !== 'APPROVED' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 h-7 text-xs border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePhotoStatus(photo.id, 'APPROVED');
                            }}
                          >
                            Approve
                          </Button>
                        )}
                        {photo.status !== 'REJECTED' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 h-7 text-xs border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePhotoStatus(photo.id, 'REJECTED');
                            }}
                          >
                            Reject
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setViewingDoc(null)}>
          <div className="bg-surface-container-lowest border border-outline-variant rounded p-4 max-w-4xl w-full h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{viewingDoc.category}</h3>
              <Button variant="ghost" size="sm" onClick={() => setViewingDoc(null)}><X className="w-5 h-5" /></Button>
            </div>
            <div className="flex-1 overflow-hidden bg-surface-variant/30 rounded flex items-center justify-center relative">
              {viewingDoc.file_path.toLowerCase().endsWith('.pdf') ? (
                <iframe 
                  src={viewingDoc.file_path} 
                  className="w-full h-full border-0"
                  title="Document Viewer"
                />
              ) : (
                <img 
                  src={viewingDoc.file_path} 
                  alt={viewingDoc.category} 
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
