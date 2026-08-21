'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Project {
  id: number;
  project_id: string;
  status: string;
  capacity?: number;
  customer_name: string;
  customer_mobile: string;
  created_at: string;
}

const statusConfig: Record<
  string,
  {
    label: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
  }
> = {
  NEW: {
    label: 'New',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
  },
  SITE_SURVEY: {
    label: 'Site Survey',
    bgColor: 'bg-cyan-100',
    textColor: 'text-cyan-800',
    borderColor: 'border-cyan-200',
  },
  SURVEY_SUBMITTED: {
    label: 'Survey Submitted',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200',
  },
  SURVEY_VERIFIED: {
    label: 'Survey Verified',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
  },
  MATERIAL_ALLOCATED: {
    label: 'Material Allocated',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-200',
  },
  INSTALLATION_STARTED: {
    label: 'Installation Started',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-200',
  },
  INSTALLATION_COMPLETED: {
    label: 'Installation Completed',
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-800',
    borderColor: 'border-teal-200',
  },
  FINAL_VERIFICATION: {
    label: 'Final Verification',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-800',
    borderColor: 'border-indigo-200',
  },
  PROJECT_COMPLETED: {
    label: 'Completed',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-800',
    borderColor: 'border-emerald-200',
  },
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const limit = 12;

  useEffect(() => {
    fetchProjects();
  }, [search, statusFilter, page]);

  const fetchProjects = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await fetch(`/api/projects?${params}`);

      if (response.ok) {
        const data = await response.json();

        setProjects(data.projects || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-8">
      {/* =========================================================
          HEADER
      ========================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-headline-md font-bold text-on-surface">
            Projects
          </h1>

          <p className="mt-1 text-body-md text-on-surface-variant">
            Manage solar installation projects
          </p>
        </div>

        {/* Link styled as button - no nested button */}
        <Link
          href="/projects/new"
          className="btn-primary inline-flex h-10 shrink-0 items-center justify-center gap-2 px-4"
        >
          <span className="material-symbols-outlined text-[20px] leading-none">
            add
          </span>

          <span>New Project</span>
        </Link>
      </div>

      {/* =========================================================
          FILTERS
      ========================================================== */}
      <div className="card-base p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          {/* Search */}
          <div className="relative min-w-0 flex-1">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] leading-none text-on-surface-variant">
              search
            </span>

            <input
              type="text"
              placeholder="Search by project ID, customer name, or mobile..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="input-base w-full pl-10"
            />
          </div>

          {/* Status Filter */}
          <div className="relative w-full shrink-0 sm:w-[220px]">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] leading-none text-on-surface-variant">
              filter_list
            </span>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="input-base w-full cursor-pointer pl-10"
            >
              <option value="">All Statuses</option>

              {Object.entries(statusConfig).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* =========================================================
          LOADING STATE
      ========================================================== */}
      {loading ? (
        <div className="grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="card-base flex h-full min-h-[260px] flex-col p-6"
            >
              <div className="flex flex-1 flex-col animate-pulse space-y-4">
                <div className="h-5 w-3/4 rounded bg-surface-container" />
                <div className="h-4 w-1/2 rounded bg-surface-container" />
                <div className="h-4 w-full rounded bg-surface-container" />
                <div className="h-4 w-2/3 rounded bg-surface-container" />
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        /* =========================================================
           EMPTY STATE
        ========================================================== */
        <div className="card-base p-12">
          <div className="mx-auto flex max-w-md flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container">
              <span className="material-symbols-outlined text-[36px] leading-none text-on-surface-variant">
                bolt
              </span>
            </div>

            <h3 className="mb-2 text-headline-sm font-semibold text-on-surface">
              No projects found
            </h3>

            <p className="mb-6 text-body-md text-on-surface-variant">
              Get started by creating your first project
            </p>

            <Link
              href="/projects/new"
              className="btn-primary inline-flex h-10 items-center justify-center gap-2 px-4"
            >
              <span className="material-symbols-outlined text-[20px] leading-none">
                add
              </span>

              <span>Create Project</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* =========================================================
              PROJECT GRID
          ========================================================== */}
          <div className="grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const status = statusConfig[project.status] || {
                label: project.status,
                bgColor: 'bg-gray-100',
                textColor: 'text-gray-800',
                borderColor: 'border-gray-200',
              };

              return (
                <div
                  key={project.id}
                  className="card-base group flex h-full min-w-0 flex-col p-6 transition-colors hover:border-primary-container"
                >
                  <div className="flex flex-1 flex-col">
                    {/* =================================================
                        CARD HEADER
                    ================================================== */}
                    <div className="flex items-start justify-between gap-4 border-b border-outline-variant pb-4">
                      {/* Project information */}
                      <div className="min-w-0 flex-1">
                        <h3
                          className="truncate text-headline-sm font-semibold text-on-surface"
                          title={project.project_id}
                        >
                          {project.project_id}
                        </h3>

                        <p
                          className="mt-1 truncate text-body-md text-on-surface-variant"
                          title={project.customer_name}
                        >
                          {project.customer_name}
                        </p>
                      </div>

                      {/* Status */}
                      <span
                        className={`status-badge shrink-0 whitespace-nowrap ${status.bgColor} ${status.textColor} ${status.borderColor}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    {/* =================================================
                        DETAILS
                    ================================================== */}
                    <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
                      {/* Capacity */}
                      {project.capacity != null && (
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-fixed">
                            <span className="material-symbols-outlined text-[20px] leading-none text-primary-container">
                              bolt
                            </span>
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs text-on-surface-variant">
                              Capacity
                            </p>

                            <p className="truncate font-medium text-on-surface">
                              {project.capacity} kW
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Created */}
                      <div
                        className={`flex min-w-0 items-center gap-3 ${
                          project.capacity == null
                            ? 'sm:col-span-2'
                            : ''
                        }`}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary-container">
                          <span className="material-symbols-outlined text-[20px] leading-none text-secondary">
                            calendar_today
                          </span>
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs text-on-surface-variant">
                            Created
                          </p>

                          <p className="truncate font-medium text-on-surface">
                            {new Date(
                              project.created_at
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* =================================================
                        ACTIONS
                    ================================================== */}
                    <div className="mt-auto flex items-center gap-2 border-t border-outline-variant pt-4">
                      {/* View */}
                      <Link
                        href={`/projects/${project.id}`}
                        className="btn-outline flex h-10 min-w-0 flex-1 items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px] leading-none">
                          visibility
                        </span>

                        <span>View</span>
                      </Link>

                      {/* Edit */}
                      <Link
                        href={`/projects/${project.id}/edit`}
                        aria-label={`Edit ${project.project_id}`}
                        className="btn-outline flex h-10 w-10 shrink-0 items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-[18px] leading-none">
                          edit
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* =========================================================
              PAGINATION
          ========================================================== */}
          {totalPages > 1 && (
            <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-body-md text-on-surface-variant">
                Showing {((page - 1) * limit) + 1} to{' '}
                {Math.min(page * limit, total)} of {total} projects
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn-outline h-10 px-4"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>

                <span className="flex h-10 items-center whitespace-nowrap px-3 font-label-bold text-on-surface">
                  Page {page} of {totalPages}
                </span>

                <button
                  type="button"
                  className="btn-outline h-10 px-4"
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
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
