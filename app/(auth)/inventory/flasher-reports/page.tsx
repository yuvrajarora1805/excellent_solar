'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Plus, Search, FileUp, Zap, CheckCircle, Package } from 'lucide-react';
import { FTRImportModal } from '@/components/inventory/ftr-import-modal';

interface FlasherPanel {
  id?: number;
  sr_no: number | string;
  box_no: string;
  module_sr_no: string;
  pmax: string | number;
  voc: string | number;
  isc: string | number;
  vmp: string | number;
  imp: string | number;
  ff: string | number;
  eff: string | number;
}

export default function FlasherReportsPage() {
  const [panels, setPanels] = useState<FlasherPanel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isFtrModalOpen, setIsFtrModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Flasher Report Header Info
  const [headerInfo, setHeaderInfo] = useState({
    brand: 'WAAREE ENERGIES LIMITED',
    report_title: 'Flasher Report',
    customer: 'M/S Excellent Solar',
    oa_no: '3260108840',
    invoice_no: '5601014785',
    date: '10.08.2026',
    module_model: 'BIN-21-615',
    quantity: '620 Nos.',
  });

  // Form for manual panel addition
  const [manualForm, setManualForm] = useState<FlasherPanel>({
    sr_no: 1,
    box_no: '',
    module_sr_no: '',
    pmax: '615.00',
    voc: '48.50',
    isc: '15.80',
    vmp: '41.20',
    imp: '15.00',
    ff: '80.50',
    eff: '22.80',
  });

  useEffect(() => {
    fetchSerials();
  }, []);

  const fetchSerials = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/serial-numbers');
      if (res.ok) {
        const data = await res.json();
        const rawList = Array.isArray(data) ? data : (data.serials || []);
        
        const serialsList: FlasherPanel[] = rawList.map((s: any, idx: number) => {
          let box_no = '18126725273';
          let pmax = '617.49', voc = '48.24', isc = '15.81', vmp = '41.21', imp = '14.98', ff = '80.96', eff = '22.86';

          if (s.remarks && s.remarks.includes('Pmax:')) {
            const parts = s.remarks.split('|');
            parts.forEach((p: string) => {
              if (p.includes('Box:')) box_no = p.replace('Box:', '').trim();
              if (p.includes('Pmax:')) pmax = p.replace('Pmax:', '').replace('W', '').trim();
              if (p.includes('Voc:')) voc = p.replace('Voc:', '').replace('V', '').trim();
              if (p.includes('Isc:')) isc = p.replace('Isc:', '').replace('A', '').trim();
              if (p.includes('Eff:')) eff = p.replace('Eff:', '').replace('%', '').trim();
            });
          }

          return {
            id: s.id,
            sr_no: idx + 1,
            box_no: box_no,
            module_sr_no: s.serial_number,
            pmax, voc, isc, vmp, imp, ff, eff,
          };
        });

        if (serialsList.length > 0) {
          setPanels(serialsList);
        } else {
          loadDefaultSamplePanels();
        }
      } else {
        loadDefaultSamplePanels();
      }
    } catch (err) {
      console.error('Failed to fetch serial numbers:', err);
      loadDefaultSamplePanels();
    } finally {
      setLoading(false);
    }
  };


  const loadDefaultSamplePanels = () => {
    setPanels([
      { sr_no: 393, box_no: '18126725273', module_sr_no: 'WS08269074875699', pmax: '617.49', voc: '48.24', isc: '15.81', vmp: '41.21', imp: '14.98', ff: '80.96', eff: '22.86' },
      { sr_no: 394, box_no: '18126725273', module_sr_no: 'WS08269074875700', pmax: '618.40', voc: '48.25', isc: '15.83', vmp: '41.22', imp: '15.00', ff: '80.95', eff: '22.89' },
      { sr_no: 395, box_no: '18126725273', module_sr_no: 'WS08269074875703', pmax: '618.98', voc: '48.34', isc: '15.77', vmp: '41.27', imp: '15.00', ff: '81.18', eff: '22.92' },
      { sr_no: 396, box_no: '18126725273', module_sr_no: 'WS08269074875704', pmax: '616.36', voc: '48.27', isc: '15.82', vmp: '41.25', imp: '14.94', ff: '80.73', eff: '22.82' },
      { sr_no: 397, box_no: '18126725273', module_sr_no: 'WS08269074875705', pmax: '618.01', voc: '48.25', isc: '15.82', vmp: '41.21', imp: '15.00', ff: '80.96', eff: '22.88' },
    ]);
  };

  const handleAddManualPanel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.module_sr_no) {
      alert('Module Serial Number is required!');
      return;
    }

    try {
      const res = await fetch('/api/serial-numbers/import-ftr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: 1,
          invoice_no: headerInfo.invoice_no,
          modules: [manualForm],
        }),
      });

      if (res.ok) {
        alert('Solar Panel Serial Number added manually and stock updated!');
        setIsManualModalOpen(false);
        fetchSerials();
      } else {
        alert('Failed to add serial number.');
      }
    } catch (err) {
      alert('Error adding manual serial number.');
    }
  };

  const filteredPanels = panels.filter(p =>
    p.module_sr_no.toLowerCase().includes(search.toLowerCase()) ||
    p.box_no.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-7 h-7 text-amber-500" />
            Solar Panel Flasher Reports & Serial Tracker
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Track Waaree flasher test metrics, OA No., Box No., and unique module serial numbers
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsManualModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus className="w-4 h-4" />
            Add Panel Manually
          </Button>
          <Button onClick={() => setIsFtrModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <FileUp className="w-4 h-4" />
            Import FTR PDF (OCR)
          </Button>
        </div>
      </div>

      {/* Waaree Flasher Report Details Card */}
      <Card className="border-2 border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10">
        <CardHeader className="pb-3 border-b bg-emerald-100/50 dark:bg-emerald-900/30">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-black text-emerald-950 dark:text-emerald-200 uppercase tracking-wide">
                {headerInfo.brand} - {headerInfo.report_title}
              </CardTitle>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                Customer: <span className="font-bold text-slate-900 dark:text-white">{headerInfo.customer}</span>
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-extrabold rounded-full">
              Verified Flasher Report
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            <div className="p-2.5 bg-white dark:bg-slate-900 border rounded shadow-sm">
              <span className="text-slate-500 block">OA No.</span>
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">{headerInfo.oa_no}</span>
            </div>
            <div className="p-2.5 bg-white dark:bg-slate-900 border rounded shadow-sm">
              <span className="text-slate-500 block">Invoice No.</span>
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">{headerInfo.invoice_no}</span>
            </div>
            <div className="p-2.5 bg-white dark:bg-slate-900 border rounded shadow-sm">
              <span className="text-slate-500 block">Date</span>
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">{headerInfo.date}</span>
            </div>
            <div className="p-2.5 bg-white dark:bg-slate-900 border rounded shadow-sm">
              <span className="text-slate-500 block">Module Model</span>
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">{headerInfo.module_model}</span>
            </div>
            <div className="p-2.5 bg-white dark:bg-slate-900 border rounded shadow-sm">
              <span className="text-slate-500 block">Total Quantity</span>
              <span className="font-extrabold text-sm text-emerald-600">{panels.length} Nos.</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter & Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by Unique Module Serial No. or Box No...."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 font-mono text-sm"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold">
          Showing {filteredPanels.length} of {panels.length} panels
        </div>
      </div>

      {/* Full Flasher Matrix Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[900px]">
            <thead className="bg-slate-800 text-white uppercase font-bold sticky top-0">
              <tr>
                <th className="p-3 w-16 text-center">Sr. No.</th>
                <th className="p-3">Box No.</th>
                <th className="p-3 text-amber-300">Module Sr. No. (Unique Key)</th>
                <th className="p-3 text-right">Pmax (W)</th>
                <th className="p-3 text-right">Voc (V)</th>
                <th className="p-3 text-right">Isc (A)</th>
                <th className="p-3 text-right">Vmp (V)</th>
                <th className="p-3 text-right">Imp (A)</th>
                <th className="p-3 text-right">FF (%)</th>
                <th className="p-3 text-right text-emerald-300">Eff (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y font-medium text-slate-800 dark:text-slate-200">
              {filteredPanels.map((p, idx) => (
                <tr key={idx} className="hover:bg-amber-50/50 dark:hover:bg-slate-800 transition-colors">
                  <td className="p-3 text-center text-slate-500 font-mono">{p.sr_no}</td>
                  <td className="p-3 font-mono">{p.box_no}</td>
                  <td className="p-3 font-mono font-bold text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20">
                    {p.module_sr_no}
                  </td>
                  <td className="p-3 text-right font-bold">{p.pmax}</td>
                  <td className="p-3 text-right">{p.voc}</td>
                  <td className="p-3 text-right">{p.isc}</td>
                  <td className="p-3 text-right">{p.vmp}</td>
                  <td className="p-3 text-right">{p.imp}</td>
                  <td className="p-3 text-right">{p.ff}</td>
                  <td className="p-3 text-right font-bold text-emerald-600">{p.eff}%</td>
                </tr>
              ))}
              {filteredPanels.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    No panel serial numbers found matching "{search}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Manual Panel Addition Modal */}
      <Modal isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} title="Add Solar Panel Manually">
        <form onSubmit={handleAddManualPanel} className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900">
            <strong>Unique Identification</strong>: Each solar panel has a unique Module Serial Number.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Module Serial No. (Unique Key)</label>
              <Input
                required
                value={manualForm.module_sr_no}
                onChange={(e) => setManualForm({ ...manualForm, module_sr_no: e.target.value })}
                placeholder="e.g. WS08269074875699"
                className="font-mono"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Box No.</label>
              <Input
                value={manualForm.box_no}
                onChange={(e) => setManualForm({ ...manualForm, box_no: e.target.value })}
                placeholder="e.g. 18126725273"
                className="font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold mb-1">Pmax (W)</label>
              <Input
                value={manualForm.pmax}
                onChange={(e) => setManualForm({ ...manualForm, pmax: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Voc (V)</label>
              <Input
                value={manualForm.voc}
                onChange={(e) => setManualForm({ ...manualForm, voc: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Isc (A)</label>
              <Input
                value={manualForm.isc}
                onChange={(e) => setManualForm({ ...manualForm, isc: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Vmp (V)</label>
              <Input
                value={manualForm.vmp}
                onChange={(e) => setManualForm({ ...manualForm, vmp: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Imp (A)</label>
              <Input
                value={manualForm.imp}
                onChange={(e) => setManualForm({ ...manualForm, imp: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Eff (%)</label>
              <Input
                value={manualForm.eff}
                onChange={(e) => setManualForm({ ...manualForm, eff: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => setIsManualModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Save Panel & Update Stock</Button>
          </div>
        </form>
      </Modal>

      {/* OCR Import Modal */}
      <FTRImportModal
        isOpen={isFtrModalOpen}
        onClose={() => setIsFtrModalOpen(false)}
        onSuccess={() => {
          fetchSerials();
          setIsFtrModalOpen(false);
        }}
      />
    </div>
  );
}
