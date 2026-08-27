'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader, CardGrid, StatsCard } from '@/components/page-layout';
import { DataTable, StatusBadge } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Plus, Edit, Trash2, Package, Zap } from 'lucide-react';

interface SystemTemplate {
  id: number;
  name: string;
  code: string;
  system_type: string;
  capacity_kw: number;
  template_type: string;
  status: string;
  description?: string;
}

export default function SystemTemplatesPage() {
  const [templates, setTemplates] = useState<SystemTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SystemTemplate | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    onGrid: 0,
    offGrid: 0,
    hybrid: 0,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/system-templates');
      const data = await response.json();
      setTemplates(data);

      // Calculate stats
      setStats({
        total: data.length,
        onGrid: data.filter((t: SystemTemplate) => t.system_type === 'ON_GRID').length,
        offGrid: data.filter((t: SystemTemplate) => t.system_type === 'OFF_GRID').length,
        hybrid: data.filter((t: SystemTemplate) => t.system_type === 'HYBRID').length,
      });
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedTemplate(null);
    setIsModalOpen(true);
  };

  const handleEdit = (template: SystemTemplate) => {
    setSelectedTemplate(template);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const res = await fetch(`/api/system-templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTemplates(prev => prev.filter(t => t.id !== id));
      } else {
        alert('Failed to delete template.');
      }
      await fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };


  const columns = [
    {
      key: 'name',
      title: 'Template Name',
      render: (value: string, row: SystemTemplate) => (
        <div>
          <div className="font-medium text-slate-900 dark:text-white">{value}</div>
          <div className="text-xs text-slate-500">{row.code}</div>
        </div>
      ),
    },
    {
      key: 'system_type',
      title: 'Type',
      render: (value: string) => (
        <span className="inline-flex items-center gap-1 text-sm">
          {value === 'ON_GRID' && <Zap className="w-4 h-4 text-green-500" />}
          {value === 'OFF_GRID' && <Package className="w-4 h-4 text-blue-500" />}
          {value.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'capacity_kw',
      title: 'Capacity',
      render: (value: number) => `${value} kW`,
    },
    {
      key: 'template_type',
      title: 'Variant',
      render: (value: string) => (
        <span className="px-2 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800">
          {value}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: string) => <StatusBadge status={value} />,
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, row: SystemTemplate) => (
        <div className="flex items-center gap-2">
          <Link href={`/system-templates/${row.id}/builder`}>
            <button className="p-1 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors" title="Builder">
              <Package className="w-4 h-4 text-orange-500" />
            </button>
          </Link>
          <button
            onClick={() => handleEdit(row)}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            title="Edit Settings"
          >
            <Edit className="w-4 h-4 text-slate-500" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="System Templates"
        description="Manage pre-configured solar system templates for quick quotation generation"
        actions={
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            New Template
          </Button>
        }
      />

      <CardGrid cols={4} className="mb-6">
        <StatsCard title="Total Templates" value={stats.total} icon={<Package className="w-6 h-6" />} />
        <StatsCard title="On-Grid" value={stats.onGrid} icon={<Zap className="w-6 h-6 text-green-500" />} />
        <StatsCard title="Off-Grid" value={stats.offGrid} icon={<Package className="w-6 h-6 text-blue-500" />} />
        <StatsCard title="Hybrid" value={stats.hybrid} icon={<Package className="w-6 h-6 text-purple-500" />} />
      </CardGrid>

      <div className="card-professional">
        <DataTable
          columns={columns}
          data={templates}
          isLoading={isLoading}
          emptyMessage="No system templates found. Create your first template to get started."
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedTemplate ? 'Edit Template' : 'New Template'}
        size="lg"
      >
        <TemplateForm
          template={selectedTemplate}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchTemplates();
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

function TemplateForm({ template, onSuccess, onCancel }: any) {
  const [formData, setFormData] = useState(
    template || {
      name: '',
      code: '',
      system_type: 'ON_GRID',
      capacity_kw: 5,
      template_type: 'STANDARD',
      description: '',
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = template ? `/api/system-templates/${template.id}` : '/api/system-templates';
      await fetch(url, {
        method: template ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      onSuccess();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Template Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-800"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Code
          </label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-800"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Capacity (kW)
          </label>
          <input
            type="number"
            step="0.1"
            value={formData.capacity_kw}
            onChange={(e) => setFormData({ ...formData, capacity_kw: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-800"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            System Type
          </label>
          <select
            value={formData.system_type}
            onChange={(e) => setFormData({ ...formData, system_type: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-800"
          >
            <option value="ON_GRID">On-Grid</option>
            <option value="OFF_GRID">Off-Grid</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Template Type
          </label>
          <select
            value={formData.template_type}
            onChange={(e) => setFormData({ ...formData, template_type: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-800"
          >
            <option value="STANDARD">Standard</option>
            <option value="PREMIUM">Premium</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-800"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
        >
          {template ? 'Update' : 'Create'} Template
        </button>
      </div>
    </form>
  );
}
