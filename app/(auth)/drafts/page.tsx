'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Clock, ShoppingBag, FileText, Briefcase } from 'lucide-react';
import { format } from 'date-fns';

export default function DraftsDashboardPage() {
  const [drafts, setDrafts] = useState<any>({ orders: [], quotations: [], bookings: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'quotations' | 'bookings'>('orders');

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/drafts');
      if (res.ok) {
        const data = await res.json();
        setDrafts(data);
      }
    } catch (err) {
      console.error('Failed to fetch drafts', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteDraft = async (type: string, id: number) => {
    if (!confirm('Are you sure you want to discard this draft?')) return;
    
    // Determine api endpoint based on type
    let endpoint = '';
    if (type === 'Order') endpoint = `/api/orders/${id}`;
    if (type === 'Quotation') endpoint = `/api/quotations/${id}`;
    if (type === 'Booking') endpoint = `/api/projects/${id}`;

    if (!endpoint) return;

    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        fetchDrafts();
      } else {
        alert('Failed to delete draft');
      }
    } catch (err) {
      alert('Error deleting draft');
    }
  };

  const getEditLink = (type: string, id: number) => {
    if (type === 'Order') return `/orders/${id}/edit`;
    if (type === 'Quotation') return `/quotations/${id}/edit`;
    if (type === 'Booking') return `/projects/${id}/edit`;
    return '#';
  };

  const getIcon = (type: string) => {
    if (type === 'Order') return <ShoppingBag className="w-5 h-5 text-blue-500" />;
    if (type === 'Quotation') return <FileText className="w-5 h-5 text-amber-500" />;
    if (type === 'Booking') return <Briefcase className="w-5 h-5 text-purple-500" />;
    return <Clock className="w-5 h-5" />;
  };

  const renderDraftList = (list: any[], emptyMsg: string) => {
    if (loading) return <div className="text-center py-10 text-gray-500">Loading drafts...</div>;
    if (list.length === 0) return <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl">{emptyMsg}</div>;

    return (
      <div className="space-y-4">
        {list.map((item: any) => (
          <Card key={item.id} className="hover:border-emerald-300 transition-colors shadow-sm">
            <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  {getIcon(item.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">{item.reference || 'Draft'}</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Customer: <span className="font-medium text-gray-900">{item.customer_name || 'N/A'}</span>
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(item.created_at), 'MMM dd, yyyy HH:mm')}
                    </span>
                    {item.total_amount && (
                      <span className="font-semibold text-emerald-600">
                        ₹{parseFloat(item.total_amount).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
                <Link href={getEditLink(item.type, item.id)} className="flex-1 md:flex-none">
                  <Button variant="outline" className="w-full text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                    <Edit className="w-4 h-4 mr-2" />
                    Resume
                  </Button>
                </Link>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => deleteDraft(item.type, item.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Edit className="w-8 h-8 text-emerald-600" />
            My Drafts
          </h1>
          <p className="text-slate-500 mt-1">Manage and resume your incomplete documents and orders.</p>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100/80 rounded-xl w-full md:w-auto overflow-x-auto">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'orders' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Orders ({drafts.orders?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('quotations')}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'quotations' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Quotations ({drafts.quotations?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'bookings' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Bookings ({drafts.bookings?.length || 0})
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'orders' && renderDraftList(drafts.orders, 'No drafted orders found.')}
        {activeTab === 'quotations' && renderDraftList(drafts.quotations, 'No drafted quotations found.')}
        {activeTab === 'bookings' && renderDraftList(drafts.bookings, 'No drafted bookings found.')}
      </div>
    </div>
  );
}
