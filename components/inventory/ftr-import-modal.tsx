'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { FileUp, CheckCircle, AlertCircle, FileText, PackageCheck } from 'lucide-react';

interface FTRModule {
  sr_no: string;
  box_no: string;
  module_sr_no: string;
  pmax: string;
  voc: string;
  isc: string;
  vmp: string;
  imp: string;
  ff: string;
  eff: string;
}

interface FTRData {
  type: string;
  customer?: string;
  invoice_no?: string;
  date?: string;
  module_model?: string;
  total_quantity?: string;
  raw_text?: string;
  modules?: FTRModule[];
  total_parsed_count?: number;
}

interface FTRImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  products?: Array<{ id: number; name: string; product_code: string; current_stock: number }>;
}

export const FTRImportModal: React.FC<FTRImportModalProps> = ({ isOpen, onClose, onSuccess, products = [] }) => {
  const [filePath, setFilePath] = useState('/media/yuvraj/New Volume/xamp/htdocs/excellent-solar/FTR 5601014785 MS Excellent Solar(4)_260827_183421.pdf');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [ftrData, setFtrData] = useState<FTRData | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleParse = async () => {
    try {
      setLoading(true);
      setMessage(null);

      let response: Response;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        response = await fetch('/api/ocr/parse-pdf', {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetch('/api/ocr/parse-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath }),
        });
      }

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to parse PDF');
      }

      if (data.type !== 'FLASHER_REPORT' && (!data.modules || data.modules.length === 0)) {
        setMessage({ type: 'error', text: 'Uploaded document is not a Flasher Test Report or contains no serial numbers.' });
      }

      setFtrData(data);
      setMessage({ type: 'success', text: `Extracted ${data.modules?.length || 0} solar panel serial numbers successfully!` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error processing OCR on PDF' });
    } finally {
      setLoading(false);
    }
  };

  const handleImportStock = async () => {
    if (!ftrData || !ftrData.modules || ftrData.modules.length === 0) {
      setMessage({ type: 'error', text: 'No solar panel serial numbers available to import' });
      return;
    }

    try {
      setImporting(true);
      setMessage(null);

      const targetProductId = selectedProductId || (products.length > 0 ? products[0].id : 1);

      const res = await fetch('/api/serial-numbers/import-ftr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: targetProductId,
          invoice_no: ftrData.invoice_no || '5601014785',
          modules: ftrData.modules,
        }),
      });

      const result = await res.json();
      if (!res.ok || result.error) {
        throw new Error(result.error || 'Failed to update stock');
      }

      setMessage({ type: 'success', text: result.message || 'Stock updated successfully!' });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error importing stock' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Solar Panels (FTR OCR & Stock Update)">
      <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
        {/* Upload or File Path */}
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border space-y-3">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Select Solar Panel Flasher Report PDF
          </label>
          <div className="flex gap-2">
            <Input
              type="file"
              accept=".pdf"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
              className="flex-1"
            />
            <Button onClick={handleParse} disabled={loading}>
              {loading ? 'Running OCR...' : 'Run OCR & Parse'}
            </Button>
          </div>

          <div className="text-xs text-slate-500">
            Or specify local PDF file path on system:
          </div>
          <Input
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            placeholder="/path/to/FTR.pdf"
            className="text-xs font-mono"
          />
        </div>

        {/* Alerts */}
        {message && (
          <div className={`p-3 rounded-md flex items-center gap-2 text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* FTR Parsed Preview */}
        {ftrData && ftrData.modules && (
          <div className="space-y-4">
            {/* Header Info Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="p-2 bg-blue-50 border rounded">
                <span className="text-slate-500 block">Customer</span>
                <span className="font-bold">{ftrData.customer || 'M/S Excellent Solar'}</span>
              </div>
              <div className="p-2 bg-blue-50 border rounded">
                <span className="text-slate-500 block">Invoice No.</span>
                <span className="font-bold">{ftrData.invoice_no || '5601014785'}</span>
              </div>
              <div className="p-2 bg-blue-50 border rounded">
                <span className="text-slate-500 block">Module Model</span>
                <span className="font-bold">{ftrData.module_model || 'BIN-21-615'}</span>
              </div>
              <div className="p-2 bg-blue-50 border rounded">
                <span className="text-slate-500 block">Parsed Quantity</span>
                <span className="font-bold text-green-700 text-sm">{ftrData.modules.length} Panels</span>
              </div>
            </div>

            {/* Target Solar Panel Selection */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-bold text-amber-900">
                  Select Product to Update Stock (+{ftrData.modules.length})
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="mt-1 text-sm p-1.5 border rounded bg-white w-full max-w-md font-medium"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.product_code}) - Current Stock: {p.current_stock}
                    </option>
                  ))}
                  {products.length === 0 && (
                    <option value={1}>Waaree 550W / 615W Solar Panel (Default)</option>
                  )}
                </select>
              </div>

              <Button onClick={handleImportStock} disabled={importing} className="bg-green-600 hover:bg-green-700 text-white">
                <PackageCheck className="w-4 h-4 mr-1" />
                {importing ? 'Updating Stock...' : `Update Stock (+${ftrData.modules.length})`}
              </Button>
            </div>

            {/* Modules Table Preview */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-bold flex justify-between items-center">
                <span>Extracted Solar Panel Serial Numbers & Flasher Specs (First 50 shown)</span>
                <span>Total: {ftrData.modules.length}</span>
              </div>
              <div className="max-h-60 overflow-y-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b sticky top-0">
                    <tr>
                      <th className="p-2">#</th>
                      <th className="p-2">Box No.</th>
                      <th className="p-2">Module Serial No.</th>
                      <th className="p-2">Pmax (W)</th>
                      <th className="p-2">Voc (V)</th>
                      <th className="p-2">Isc (A)</th>
                      <th className="p-2">Eff (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {ftrData.modules.slice(0, 50).map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 text-slate-500">{m.sr_no}</td>
                        <td className="p-2 font-mono text-[11px]">{m.box_no}</td>
                        <td className="p-2 font-mono font-bold text-blue-700">{m.module_sr_no}</td>
                        <td className="p-2 font-bold">{m.pmax}</td>
                        <td className="p-2">{m.voc}</td>
                        <td className="p-2">{m.isc}</td>
                        <td className="p-2 font-semibold text-green-700">{m.eff}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
