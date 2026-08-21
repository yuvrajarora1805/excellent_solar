'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Survey {
  id: number;
  project_id: string;
  customer_name: string;
  status: string;
  created_by_name: string;
  submitted_at?: string;
  latitude?: number;
  longitude?: number;
  roof_type?: string;
  estimated_capacity?: number;
}

export default function SurveyPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchSurveys();
  }, [filter]);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await fetch(`/api/survey${params}`);
      if (response.ok) {
        const data = await response.json();
        setSurveys(data.surveys || []);
      }
    } catch (error) {
      console.error('Failed to fetch surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: number, approved: boolean) => {
    const reason = approved ? '' : prompt('Rejection reason:');
    if (approved === false && reason === null) return;

    try {
      const response = await fetch(`/api/survey/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved, reason }),
      });

      if (response.ok) {
        fetchSurveys();
      } else {
        alert('Failed to verify survey');
      }
    } catch (error) {
      alert('Failed to verify survey');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      SUBMITTED: 'status-badge-warning',
      VERIFIED: 'status-badge-success',
      REJECTED: 'status-badge-error',
    };
    return badges[status] || 'status-badge-info';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-headline-md font-bold text-on-surface">Site Surveys</h1>
        <p className="text-body-md text-on-surface-variant mt-1">Manage and verify site surveys</p>
      </div>

      <div className="flex gap-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input-base cursor-pointer"
        >
          <option value="all">All Surveys</option>
          <option value="SUBMITTED">Pending Verification</option>
          <option value="VERIFIED">Verified</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="card-base p-6"><div className="text-center py-8">Loading...</div></div>
      ) : surveys.length === 0 ? (
        <div className="card-base p-6"><div className="text-center py-8">No surveys found</div></div>
      ) : (
        <div className="grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
          {surveys.map((survey) => (
            <div key={survey.id} className={`card-base flex h-full flex-col p-6 ${survey.status === 'SUBMITTED' ? 'border-l-4 border-l-primary-container' : ''}`}>
              <div className="flex flex-1 flex-col space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 border-b border-outline-variant pb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-headline-sm font-semibold text-on-surface">{survey.project_id}</h3>
                    <p className="truncate text-body-md text-on-surface-variant">{survey.customer_name}</p>
                  </div>
                  <span className={`status-badge shrink-0 whitespace-nowrap ${getStatusBadge(survey.status)}`}>
                    {survey.status.toLowerCase()}
                  </span>
                </div>

                {/* Location */}
                {survey.latitude != null && survey.longitude != null && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="material-symbols-outlined shrink-0 text-on-surface-variant">
                      location_on
                    </span>
                    <span className="font-technical-mono">{survey.latitude.toFixed(4)}, {survey.longitude.toFixed(4)}</span>
                  </div>
                )}

                {/* Roof Type */}
                {survey.roof_type != null && (
                  <div className="text-sm">
                    <span className="text-on-surface-variant">Roof: </span>
                    <span>{survey.roof_type}</span>
                  </div>
                )}

                {/* Estimated Capacity */}
                {survey.estimated_capacity != null && (
                  <div className="text-sm">
                    <span className="text-on-surface-variant">Est. Capacity: </span>
                    <span className="font-medium">{survey.estimated_capacity} kW</span>
                  </div>
                )}

                {/* Surveyed By */}
                <div className="text-label-sm text-on-surface-variant">
                  Surveyed by: {survey.created_by_name}
                </div>

                {/* Actions */}
                <div className="mt-auto flex items-center gap-2 pt-4">
                  <Link
                    href={`/survey/${survey.id}`}
                    className="btn-outline flex h-10 flex-1 items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    View
                  </Link>

                  {survey.status === 'SUBMITTED' && (
                    <>
                      <button
                        onClick={() => handleVerify(survey.id, true)}
                        className="bg-tertiary text-on-tertiary h-10 w-10 shrink-0 flex items-center justify-center rounded font-label-bold hover:opacity-90 transition-opacity"
                        aria-label="Approve survey"
                      >
                        <span className="material-symbols-outlined text-sm">check</span>
                      </button>
                      <button
                        onClick={() => handleVerify(survey.id, false)}
                        className="bg-error text-on-error h-10 w-10 shrink-0 flex items-center justify-center rounded font-label-bold hover:opacity-90 transition-opacity"
                        aria-label="Reject survey"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
