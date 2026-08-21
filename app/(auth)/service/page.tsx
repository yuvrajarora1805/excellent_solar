'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface ServiceTicket {
  id: number;
  ticket_number: string;
  project_id: number;
  customer_name: string;
  customer_mobile: string;
  issue_category: string;
  issue_type: string;
  priority: string;
  description: string;
  status: string;
  created_at: string;
  assigned_to_name?: string;
}

export default function ServicePage() {
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [stats, setStats] = useState({
    open: 0,
    in_progress: 0,
    resolved: 0,
    high_priority: 0,
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/service-tickets');
      const data = await response.json();
      setTickets(data);

      setStats({
        open: data.filter((t: ServiceTicket) => t.status === 'OPEN').length,
        in_progress: data.filter((t: ServiceTicket) => t.status === 'IN_PROGRESS').length,
        resolved: data.filter((t: ServiceTicket) => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
        high_priority: data.filter((t: ServiceTicket) => t.priority === 'HIGH' || t.priority === 'URGENT').length,
      });
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string, resolution?: string) => {
    try {
      await fetch(`/api/service-tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolution }),
      });
      await fetchTickets();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const getPriorityVariant = (priority: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'default';
      default: return 'default';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'OPEN': return 'warning';
      case 'IN_PROGRESS':
      case 'ASSIGNED': return 'info';
      case 'RESOLVED': return 'success';
      case 'CLOSED': return 'default';
      default: return 'default';
    }
  };

  const columns = [
    {
      key: 'ticket_number',
      title: 'Ticket #',
      render: (value: string) => (
        <span className="font-technical-mono text-sm font-medium">{value}</span>
      ),
    },
    {
      key: 'customer',
      title: 'Customer',
      render: (_: any, row: ServiceTicket) => (
        <div>
          <div className="font-medium text-on-surface">{row.customer_name}</div>
          <div className="text-xs text-on-surface-variant">{row.customer_mobile}</div>
        </div>
      ),
    },
    {
      key: 'issue',
      title: 'Issue',
      render: (_: any, row: ServiceTicket) => (
        <div>
          <div className="text-sm font-medium">{row.issue_type.replace('_', ' ')}</div>
          <div className="text-xs text-on-surface-variant">{row.issue_category}</div>
        </div>
      ),
    },
    {
      key: 'priority',
      title: 'Priority',
      render: (value: string) => {
        const variant = getPriorityVariant(value);
        const colors = {
          success: 'bg-tertiary-container text-on-tertiary-container',
          warning: 'bg-primary-fixed text-on-primary-fixed',
          error: 'bg-error-container text-on-error-container',
          info: 'bg-secondary-container text-on-secondary-container',
          default: 'bg-surface-container text-on-surface-variant',
        };
        return <span className={`status-badge ${colors[variant]}`}>{value}</span>;
      },
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: string) => {
        const variant = getStatusVariant(value);
        const colors = {
          success: 'bg-tertiary-container text-on-tertiary-container',
          warning: 'bg-primary-fixed text-on-primary-fixed',
          error: 'bg-error-container text-on-error-container',
          info: 'bg-secondary-container text-on-secondary-container',
          default: 'bg-surface-container text-on-surface-variant',
        };
        return <span className={`status-badge ${colors[variant]}`}>{value.replace('_', ' ')}</span>;
      },
    },
    {
      key: 'assigned_to',
      title: 'Assigned To',
      render: (value?: string) => value || <span className="text-on-surface-variant">Unassigned</span>,
    },
    {
      key: 'created_at',
      title: 'Created',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, row: ServiceTicket) => (
        <button
          onClick={() => {
            setSelectedTicket(row);
            setIsModalOpen(true);
          }}
          className="text-sm text-primary-container hover:underline font-medium"
        >
          View
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-md font-bold text-on-surface">Service Management</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Handle service requests, warranty claims, and AMC visits</p>
        </div>
        <Button onClick={() => setIsNewTicketOpen(true)} className="btn-primary flex items-center gap-2">
          <span className="material-symbols-outlined">build</span>
          New Ticket
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="card-base p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-bold text-on-surface-variant">Open Tickets</span>
            <span className="material-symbols-outlined text-primary-container">warning</span>
          </div>
          <div className="text-headline-md font-bold text-on-surface">{stats.open}</div>
          <p className="text-label-sm text-secondary mt-1">Awaiting assignment</p>
        </div>

        <div className="card-base p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-bold text-on-surface-variant">In Progress</span>
            <span className="material-symbols-outlined text-secondary">schedule</span>
          </div>
          <div className="text-headline-md font-bold text-on-surface">{stats.in_progress}</div>
          <p className="text-label-sm text-secondary mt-1">Being worked on</p>
        </div>

        <div className="card-base p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-bold text-on-surface-variant">Resolved</span>
            <span className="material-symbols-outlined text-tertiary">check_circle</span>
          </div>
          <div className="text-headline-md font-bold text-on-surface">{stats.resolved}</div>
          <p className="text-label-sm text-secondary mt-1">Completed</p>
        </div>

        <div className="card-base p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-bold text-on-surface-variant">High Priority</span>
            <span className="material-symbols-outlined text-error">error</span>
          </div>
          <div className="text-headline-md font-bold text-on-surface">{stats.high_priority}</div>
          <p className="text-label-sm text-secondary mt-1">Needs attention</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="card-base overflow-hidden">
        <DataTable
          columns={columns}
          data={tickets}
          isLoading={isLoading}
          emptyMessage="No service tickets found"
        />
      </div>

      {/* View Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Ticket ${selectedTicket?.ticket_number}`}
        size="lg"
      >
        {selectedTicket && (
          <ServiceTicketDetails
            ticket={selectedTicket}
            onUpdateStatus={handleUpdateStatus}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </Modal>

      {/* New Ticket Modal */}
      <Modal
        isOpen={isNewTicketOpen}
        onClose={() => setIsNewTicketOpen(false)}
        title="Create Service Ticket"
        size="lg"
      >
        <NewTicketForm
          onSuccess={() => {
            setIsNewTicketOpen(false);
            fetchTickets();
          }}
          onCancel={() => setIsNewTicketOpen(false)}
        />
      </Modal>
    </div>
  );
}

function ServiceTicketDetails({ ticket, onUpdateStatus, onClose }: any) {
  const [resolution, setResolution] = useState('');

  const handleStatusUpdate = (status: string) => {
    onUpdateStatus(ticket.id, status, status === 'RESOLVED' ? resolution : undefined);
  };

  return (
    <div className="space-y-6">
      {/* Customer Info */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-surface-container-low rounded">
        <div>
          <div className="text-sm text-on-surface-variant">Customer</div>
          <div className="font-medium text-on-surface">{ticket.customer_name}</div>
          <div className="text-sm">{ticket.customer_mobile}</div>
        </div>
        <div>
          <div className="text-sm text-on-surface-variant">Project</div>
          <div className="font-medium text-on-surface">ES-2026-{String(ticket.project_id).padStart(4, '0')}</div>
        </div>
        <div>
          <div className="text-sm text-on-surface-variant">Issue</div>
          <div className="font-medium text-on-surface">{ticket.issue_type.replace('_', ' ')}</div>
        </div>
        <div>
          <div className="text-sm text-on-surface-variant">Category</div>
          <div className="font-medium text-on-surface">{ticket.issue_category}</div>
        </div>
      </div>

      {/* Description */}
      <div>
        <h3 className="text-label-bold text-on-surface mb-2">Problem Description</h3>
        <p className="text-on-surface-variant bg-surface-container-low p-3 rounded">
          {ticket.description}
        </p>
      </div>

      {/* Resolution Input */}
      {['IN_PROGRESS', 'ASSIGNED'].includes(ticket.status) && (
        <div>
          <label className="block text-label-bold text-on-surface mb-2">
            Resolution Notes
          </label>
          <textarea
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            rows={3}
            placeholder="Describe how the issue was resolved..."
            className="input-base"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {ticket.status === 'OPEN' && (
          <button
            onClick={() => handleStatusUpdate('ASSIGNED')}
            className="px-3 py-2 text-label-bold text-on-secondary bg-secondary hover:opacity-90 rounded transition-opacity"
          >
            Assign
          </button>
        )}
        {['ASSIGNED', 'OPEN'].includes(ticket.status) && (
          <button
            onClick={() => handleStatusUpdate('IN_PROGRESS')}
            className="px-3 py-2 text-label-bold text-on-primary-fixed bg-primary-fixed hover:opacity-90 rounded transition-opacity"
          >
            Start Work
          </button>
        )}
        {['IN_PROGRESS', 'ASSIGNED'].includes(ticket.status) && (
          <button
            onClick={() => handleStatusUpdate('RESOLVED')}
            className="px-3 py-2 text-label-bold text-on-tertiary bg-tertiary hover:opacity-90 rounded transition-opacity"
            disabled={!resolution}
          >
            Mark Resolved
          </button>
        )}
        {ticket.status === 'RESOLVED' && (
          <button
            onClick={() => handleStatusUpdate('CLOSED')}
            className="px-3 py-2 text-label-bold text-on-surface bg-surface-container hover:opacity-90 rounded transition-opacity"
          >
            Close Ticket
          </button>
        )}
        <button
          onClick={onClose}
          className="ml-auto px-3 py-2 text-label-bold text-on-surface hover:bg-surface-container-low rounded transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function NewTicketForm({ onSuccess, onCancel }: any) {
  const [formData, setFormData] = useState({
    project_id: '',
    customer_id: '',
    issue_category: 'INVERTER',
    issue_type: 'BREAKDOWN',
    priority: 'MEDIUM',
    description: '',
  });

  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        const data = await response.json();
        setProjects(data.projects || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projId = e.target.value;
    const project = projects.find(p => p.id.toString() === projId);
    setFormData({
      ...formData,
      project_id: projId,
      customer_id: project ? project.customer_id.toString() : '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_id || !formData.customer_id) {
      alert('Please select a valid project');
      return;
    }
    try {
      await fetch('/api/service-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-label-bold text-on-surface mb-1">
            Select Project
          </label>
          <select
            value={formData.project_id}
            onChange={handleProjectChange}
            className="input-base cursor-pointer"
            required
            disabled={isLoading}
          >
            <option value="">{isLoading ? 'Loading projects...' : 'Select a project...'}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_id} - {p.customer_name} ({p.customer_mobile})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-label-bold text-on-surface mb-1">
            Issue Category
          </label>
          <select
            value={formData.issue_category}
            onChange={(e) => setFormData({ ...formData, issue_category: e.target.value })}
            className="input-base cursor-pointer"
          >
            <option value="INVERTER">Inverter</option>
            <option value="PANELS">Solar Panels</option>
            <option value="WIRING">Wiring</option>
            <option value="STRUCTURE">Structure</option>
            <option value="GENERATION">Generation Issue</option>
            <option value="MONITORING">Monitoring/WiFi</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-label-bold text-on-surface mb-1">
            Issue Type
          </label>
          <select
            value={formData.issue_type}
            onChange={(e) => setFormData({ ...formData, issue_type: e.target.value })}
            className="input-base cursor-pointer"
          >
            <option value="BREAKDOWN">Breakdown</option>
            <option value="LOW_GENERATION">Low Generation</option>
            <option value="NO_POWER">No Power</option>
            <option value="WIFI_ISSUE">WiFi Issue</option>
            <option value="LEAKAGE">Leakage</option>
            <option value="NOISE">Noise</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-label-bold text-on-surface mb-1">
          Priority
        </label>
        <select
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
          className="input-base cursor-pointer"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>

      <div>
        <label className="block text-label-bold text-on-surface mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          placeholder="Describe the issue in detail..."
          className="input-base resize-none"
          required
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-label-bold text-on-surface hover:bg-surface-container-low rounded transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
        >
          Create Ticket
        </button>
      </div>
    </form>
  );
}
