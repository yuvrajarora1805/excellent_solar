'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Types
interface WorkerStats {
  todaySurveys: number;
  todayInstallations: number;
  weekTotal: number;
  completedThisWeek: number;
}

interface Job {
  id: number;
  project_id: string;
  customer: string;
  phone?: string;
  address?: string;
  location: string;
  survey_status?: string;
  installation_status?: string;
  capacity?: number;
  completed?: string;
  type?: string;
}

export default function WorkerDashboardPage() {
  const [stats, setStats] = useState<WorkerStats>({
    todaySurveys: 0,
    todayInstallations: 0,
    weekTotal: 0,
    completedThisWeek: 0,
  });
  const [todayJobs, setTodayJobs] = useState<Job[]>([]);
  const [upcomingJobs, setUpcomingJobs] = useState<Job[]>([]);
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [selectedTab, setSelectedTab] = useState<'today' | 'upcoming' | 'completed'>('today');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();
        setUser(sessionData.user);
      } catch (error) {
        console.error('Error fetching user session:', error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch stats
        const statsRes = await fetch(`/api/dashboard/stats?role=WORKER&userId=${user.id}`);
        const statsData = await statsRes.json();
        setStats(statsData);

        // Fetch today's jobs
        const todayRes = await fetch(`/api/dashboard/jobs?userId=${user.id}&type=today`);
        const todayData = await todayRes.json();
        setTodayJobs(todayData);

        // Fetch upcoming jobs
        const upcomingRes = await fetch(`/api/dashboard/jobs?userId=${user.id}&type=upcoming`);
        const upcomingData = await upcomingRes.json();
        setUpcomingJobs(upcomingData);

        // Fetch completed jobs
        const completedRes = await fetch(`/api/dashboard/jobs?userId=${user.id}&type=completed`);
        const completedData = await completedRes.json();
        setCompletedJobs(completedData);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const getJobIcon = (type?: string) => {
    return type === 'survey' ? 'assignment_turned_in' : 'engineering';
  };

  const getJobColor = (type?: string) => {
    return type === 'survey' ? 'text-blue-500' : 'text-primary-container';
  };

  const getJobType = (job: Job) => {
    if (job.type === 'installation') return 'installation';
    if (job.installation_status && job.installation_status !== 'DRAFT') return 'installation';
    return 'survey';
  };

  const handleStartJob = (jobId: string, type: string) => {
    const path = type === 'survey' ? `/survey/${jobId}` : `/installation/${jobId}`;
    window.location.href = path;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-container"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">My Jobs</h1>
          <p className="text-on-surface-variant mt-1">Good morning! Here's your work for today.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-lowest rounded border border-outline-variant">
            <span className="material-symbols-outlined text-secondary text-sm">sync</span>
            <span className="text-sm text-on-surface-variant">All synced</span>
          </div>
        </div>
      </div>

      {/* Today's Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-primary-container border border-outline-variant rounded p-4 industrial-shadow">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-on-secondary-fixed text-3xl">today</span>
            <div>
              <div className="text-2xl font-bold text-on-secondary-fixed">{stats.todaySurveys + stats.todayInstallations}</div>
              <div className="text-sm text-on-secondary-fixed-variant">Today's Jobs</div>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded p-4 industrial-shadow">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-blue-500 text-3xl">assignment_turned_in</span>
            <div>
              <div className="text-2xl font-bold text-on-surface">{stats.todaySurveys}</div>
              <div className="text-sm text-on-surface-variant">Surveys</div>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded p-4 industrial-shadow">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary-container text-3xl">engineering</span>
            <div>
              <div className="text-2xl font-bold text-on-surface">{stats.todayInstallations}</div>
              <div className="text-sm text-on-surface-variant">Installations</div>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded p-4 industrial-shadow">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-tertiary text-3xl">check_circle</span>
            <div>
              <div className="text-2xl font-bold text-on-surface">{stats.completedThisWeek}</div>
              <div className="text-sm text-on-surface-variant">This Week</div>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs List with Tabs */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded industrial-shadow">
        {/* Tabs */}
        <div className="flex border-b border-outline-variant">
          <button
            onClick={() => setSelectedTab('today')}
            className={`px-6 py-3 font-label-bold transition-colors border-b-2 ${
              selectedTab === 'today'
                ? 'border-primary-container text-primary-container bg-primary-container/10'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Today ({todayJobs.length})
          </button>
          <button
            onClick={() => setSelectedTab('upcoming')}
            className={`px-6 py-3 font-label-bold transition-colors border-b-2 ${
              selectedTab === 'upcoming'
                ? 'border-primary-container text-primary-container bg-primary-container/10'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Upcoming ({upcomingJobs.length})
          </button>
          <button
            onClick={() => setSelectedTab('completed')}
            className={`px-6 py-3 font-label-bold transition-colors border-b-2 ${
              selectedTab === 'completed'
                ? 'border-primary-container text-primary-container bg-primary-container/10'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Completed ({completedJobs.length})
          </button>
        </div>

        {/* Job List */}
        <div className="divide-y divide-outline-variant">
          {selectedTab === 'today' && todayJobs.length > 0 ? todayJobs.map((job) => {
            const jobType = getJobType(job);
            return (
              <div key={job.id} className="p-4 hover:bg-surface-container-low transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`material-symbols-outlined ${getJobColor(jobType)}`}>
                        {getJobIcon(jobType)}
                      </span>
                      <span className="font-mono text-sm text-on-surface-variant">{job.project_id}</span>
                    </div>
                    <h3 className="font-label-bold text-lg text-on-surface">{job.customer}</h3>
                    <div className="text-sm text-on-surface-variant mt-1 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">location_on</span>
                        {job.location}
                      </span>
                    </div>
                    {job.address && <p className="text-sm text-on-surface-variant mt-1">{job.address}</p>}
                    {job.capacity && (
                      <div className="mt-2 text-sm text-on-surface-variant">
                        <span className="font-label-bold">System:</span> {job.capacity} kW
                      </div>
                    )}
                    {job.phone && (
                      <div className="flex gap-2 mt-3">
                        <a href={`tel:${job.phone}`} className="flex items-center gap-1 text-sm text-primary hover:underline">
                          <span className="material-symbols-outlined text-[18px]">call</span>
                          Call Customer
                        </a>
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(job.address + ', ' + job.location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <span className="material-symbols-outlined text-[18px]">navigation</span>
                          Navigate
                        </a>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleStartJob(job.id.toString(), jobType)}
                    className="px-4 py-2 bg-primary-container text-on-secondary-fixed font-label-bold rounded hover:bg-primary-fixed-dim transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined">play_arrow</span>
                    Start {jobType === 'survey' ? 'Survey' : 'Installation'}
                  </button>
                </div>
              </div>
            );
          }) : selectedTab === 'today' && (
            <div className="p-8 text-center text-on-surface-variant">No jobs scheduled for today</div>
          )}

          {selectedTab === 'upcoming' && upcomingJobs.map((job) => (
            <div key={job.id} className="p-4 hover:bg-surface-container-low transition-colors">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-blue-500">calendar_today</span>
                    <span className="font-mono text-sm text-on-surface-variant">{job.project_id}</span>
                  </div>
                  <h3 className="font-label-bold text-lg text-on-surface">{job.customer}</h3>
                  <div className="text-sm text-on-surface-variant mt-1">{job.location}</div>
                </div>
              </div>
            </div>
          ))}

          {selectedTab === 'completed' && completedJobs.map((job) => (
            <div key={job.id} className="p-4 bg-surface-variant/30">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-tertiary">check_circle</span>
                    <span className="font-mono text-sm text-on-surface-variant">{job.project_id}</span>
                  </div>
                  <h3 className="font-label-bold text-lg text-on-surface">{job.customer}</h3>
                  <div className="text-sm text-on-surface-variant mt-1">
                    Completed on {job.completed ? new Date(job.completed).toLocaleDateString() : 'N/A'} • {job.location}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
