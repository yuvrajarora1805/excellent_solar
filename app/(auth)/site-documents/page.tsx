'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Eye, Image as ImageIcon, MapPin, Calendar, CheckCircle, Clock, X, Search, ShieldCheck } from 'lucide-react';

interface Project {
  id: number;
  project_id: string;
  customer_name?: string;
  status: string;
  capacity?: number;
  installation_date?: string;
  site_address?: string;
  geotag_location?: string;
}

interface Photo {
  id: number;
  category: string;
  file_name: string;
  file_path: string;
  created_at?: string;
  uploader_name?: string;
  uploader_role?: string;
  latitude?: number;
  longitude?: number;
}

const formatCategoryName = (category?: string) => {
  if (!category) return 'General Document';
  const categoryMap: Record<string, string> = {
    pspclBill: 'PSPCL Electricity Bill',
    pspcl_bill: 'PSPCL Electricity Bill',
    pspcl: 'PSPCL Electricity Bill',
    electricity_bill: 'Electricity Bill',
    site_photo: 'Site Survey Photo',
    roof_photo: 'Roof Photo',
    structure_photo: 'Structure Photo',
    earthing: 'Earthing & Safety',
    inverter: 'Inverter Installation',
    panel: 'Solar Panel Array',
    wiring: 'DC/AC Wiring',
    net_meter: 'Net Meter Installation',
    bi_directional_meter: 'Bi-Directional Meter',
  };
  if (categoryMap[category]) return categoryMap[category];
  return category
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
};

const formatUploaderName = (name?: string, roleFallback: string = 'Field Staff') => {
  if (!name || !name.trim()) {
    return roleFallback;
  }
  return name;
};

export default function SiteDocumentsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Survey & Installation details
  const [surveyDetails, setSurveyDetails] = useState<any>(null);
  const [surveyPhotos, setSurveyPhotos] = useState<Photo[]>([]);
  
  const [installationDetails, setInstallationDetails] = useState<any>(null);
  const [installationPhotos, setInstallationPhotos] = useState<Photo[]>([]);

  const [downloadingZip, setDownloadingZip] = useState<'survey' | 'installation' | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'survey' | 'installation'>('survey');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectDocuments(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.projects || [];
        setProjects(list);
        if (list.length > 0) {
          setSelectedProjectId(list[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectDocuments = async (projId: number) => {
    try {
      // Fetch Survey Data
      const surveyRes = await fetch(`/api/survey/${projId}`);
      if (surveyRes.ok) {
        const data = await surveyRes.json();
        setSurveyDetails(data);
        setSurveyPhotos(data.photos || []);
      } else {
        setSurveyDetails(null);
        setSurveyPhotos([]);
      }

      // Fetch Installation Data
      const instRes = await fetch(`/api/installation/${projId}/verify`);
      if (instRes.ok) {
        const data = await instRes.json();
        setInstallationDetails(data.installation || data);
        setInstallationPhotos(data.photos || []);
      } else {
        setInstallationDetails(null);
        setInstallationPhotos([]);
      }
    } catch (err) {
      console.error('Error fetching document details:', err);
    }
  };

  const handleDownloadZip = async (type: 'survey' | 'installation') => {
    if (!selectedProjectId) return;
    setDownloadingZip(type);
    try {
      const response = await fetch(`/api/projects/${selectedProjectId}/download-zip?type=${type}`);
      if (!response.ok) {
        const err = await response.json();
        alert(err.error || 'Failed to download ZIP');
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const currentProject = projects.find(p => p.id === selectedProjectId);
      const code = currentProject?.project_id || `Project_${selectedProjectId}`;
      a.download = `${code}_${type}_photos.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error('Error downloading zip:', err);
      alert('Error downloading ZIP archive');
    } finally {
      setDownloadingZip(null);
    }
  };

  const filteredProjects = projects.filter(p =>
    (p.project_id && p.project_id.toLowerCase().includes(search.toLowerCase())) ||
    (p.customer_name && p.customer_name.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-primary" />
            Site Survey & Installation Document Portal
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            View site survey photos, post-installation documents, and download complete image ZIP archives
          </p>
        </div>
      </div>

      {/* Project Selector Bar */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-1/3 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search by Project ID or Customer Name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="w-full md:w-1/2 flex items-center gap-3">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              Select Project:
            </label>
            <select
              value={selectedProjectId || ''}
              onChange={e => setSelectedProjectId(Number(e.target.value))}
              className="w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-background px-3 text-sm font-medium focus:ring-2 focus:ring-primary"
            >
              {filteredProjects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.project_id} - {p.customer_name || 'Customer'} ({p.status.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {selectedProject && (
        <div className="space-y-6">
          {/* Project Header Summary */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-6 shadow-md flex flex-wrap justify-between items-center gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-primary-300 font-bold">Project Ref</div>
              <div className="text-2xl font-black">{selectedProject.project_id}</div>
              <div className="text-sm opacity-90 mt-1">{selectedProject.customer_name} • {selectedProject.site_address}</div>
            </div>
            <div className="flex gap-3">
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-primary/20 border border-primary text-primary-300">
                Status: {selectedProject.status.replace(/_/g, ' ')}
              </span>
              {selectedProject.capacity && (
                <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 border border-amber-400 text-amber-300">
                  Capacity: {selectedProject.capacity} kW
                </span>
              )}
            </div>
          </div>

          {/* Separate Tab Switcher Header */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
            <button
              onClick={() => setActiveTab('survey')}
              className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'survey'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              1. Site Survey Documents & Photos ({surveyPhotos.length})
            </button>
            <button
              onClick={() => setActiveTab('installation')}
              className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'installation'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              2. Post-Installation Documents & Photos ({installationPhotos.length})
            </button>
          </div>

          {/* Section 1: Site Survey Documents & Photos */}
          {activeTab === 'survey' ? (
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-amber-500" />
                    Site Survey Documents & Field Photos
                  </CardTitle>
                  <CardDescription>
                    Site inspection data, structure analysis, roof photos, and geotag locations
                  </CardDescription>
                </div>
                <Button
                  onClick={() => handleDownloadZip('survey')}
                  disabled={downloadingZip === 'survey'}
                  className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {downloadingZip === 'survey' ? 'Packaging ZIP...' : 'Download Survey ZIP'}
                </Button>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Survey Summary Grid */}
                {surveyDetails ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 text-sm">
                    <div>
                      <span className="text-xs text-slate-500 block">Roof Type</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{surveyDetails.roof_type || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">Available Area</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{surveyDetails.available_area ? `${surveyDetails.available_area} sq.ft` : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">Est. Capacity</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{surveyDetails.estimated_capacity ? `${surveyDetails.estimated_capacity} kW` : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">Shading Issue</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{surveyDetails.shading ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                ) : null}

                {/* Photos Gallery Grid */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Survey Image Gallery ({surveyPhotos.length} Photos)
                  </h4>
                  {surveyPhotos.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {surveyPhotos.map(photo => (
                        <div
                          key={photo.id}
                          onClick={() => setPreviewImage({ url: photo.file_path, title: `Survey - ${formatCategoryName(photo.category)}` })}
                          className="group relative cursor-pointer border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-sm hover:shadow-md transition"
                        >
                          <div className="aspect-square relative flex items-center justify-center overflow-hidden">
                            <img
                              src={photo.file_path}
                              alt={formatCategoryName(photo.category)}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-1 text-xs font-semibold">
                              <Eye className="w-4 h-4" /> Preview
                            </div>
                          </div>
                          <div className="p-2.5 bg-white dark:bg-slate-900 text-xs border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1">
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate" title={formatCategoryName(photo.category)}>
                              {formatCategoryName(photo.category)}
                            </span>
                            {isAdmin && (
                              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium truncate flex items-center gap-1">
                                👤 {formatUploaderName(photo.uploader_name, 'Field Surveyor')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 text-sm">
                      No site survey photos uploaded yet for this project.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Section 2: Installation Documents & Photos */
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    Post-Installation Documents & Verified Photos
                  </CardTitle>
                  <CardDescription>
                    Installation completion record, earthing, panel/inverter details, and post-installation images
                  </CardDescription>
                </div>
                <Button
                  onClick={() => handleDownloadZip('installation')}
                  disabled={downloadingZip === 'installation'}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {downloadingZip === 'installation' ? 'Packaging ZIP...' : 'Download Installation ZIP'}
                </Button>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Installation Details Grid */}
                {installationDetails ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900 text-sm">
                    <div>
                      <span className="text-xs text-slate-500 block">Installation Date</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {installationDetails.installation_date ? new Date(installationDetails.installation_date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">Installed Capacity</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {installationDetails.installed_capacity ? `${installationDetails.installed_capacity} kW` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">Panel Quantity</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{installationDetails.panel_quantity || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">Inverter Model</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{installationDetails.inverter_model || 'N/A'}</span>
                    </div>
                  </div>
                ) : null}

                {/* Photos Gallery Grid */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Installation Image Gallery ({installationPhotos.length} Photos)
                  </h4>
                  {installationPhotos.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {installationPhotos.map(photo => (
                        <div
                          key={photo.id}
                          onClick={() => setPreviewImage({ url: photo.file_path, title: `Installation - ${formatCategoryName(photo.category)}` })}
                          className="group relative cursor-pointer border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-sm hover:shadow-md transition"
                        >
                          <div className="aspect-square relative flex items-center justify-center overflow-hidden">
                            <img
                              src={photo.file_path}
                              alt={formatCategoryName(photo.category)}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-1 text-xs font-semibold">
                              <Eye className="w-4 h-4" /> Preview
                            </div>
                          </div>
                          <div className="p-2.5 bg-white dark:bg-slate-900 text-xs border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1">
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate" title={formatCategoryName(photo.category)}>
                              {formatCategoryName(photo.category)}
                            </span>
                            {isAdmin && (
                              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium truncate flex items-center gap-1">
                                👤 {formatUploaderName(photo.uploader_name, 'Field Installer')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 text-sm">
                      No installation photos uploaded yet for this project.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Lightbox Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl w-full bg-slate-900 rounded-xl overflow-hidden shadow-2xl p-2" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-4 py-2 text-white border-b border-slate-800">
              <span className="font-semibold text-sm">{previewImage.title}</span>
              <button onClick={() => setPreviewImage(null)} className="p-1 hover:bg-slate-800 rounded-full">
                <X className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center max-h-[80vh] overflow-auto">
              <img src={previewImage.url} alt="Preview" className="max-h-[75vh] w-auto object-contain rounded" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
