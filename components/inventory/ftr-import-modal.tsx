'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { FileUp, CheckCircle, AlertCircle, FileText, PackageCheck, Plus, Sparkles } from 'lucide-react';

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

interface ProductItem {
  id: number;
  name: string;
  product_code: string;
  model?: string;
  current_stock: number;
}

interface FTRImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  products?: ProductItem[];
}

export const FTRImportModal: React.FC<FTRImportModalProps> = ({ isOpen, onClose, onSuccess, products: initialProducts = [] }) => {
  const [filePath, setFilePath] = useState('/media/yuvraj/New Volume/xamp/htdocs/excellent-solar/FTR 5601014785 MS Excellent Solar(4)_260827_183421.pdf');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [ftrData, setFtrData] = useState<FTRData | null>(null);
  const [productList, setProductList] = useState<ProductItem[]>(initialProducts);
  const [selectedProductId, setSelectedProductId] = useState<number | string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/inventory/products');
      if (res.ok) {
        const data = await res.json();
        const prods: ProductItem[] = data.products || [];
        setProductList(prods);
      }
    } catch (err) {
      console.error('Failed to fetch products for modal:', err);
    }
  };

  const autoAssociateProduct = (modelName: string, currentProducts: ProductItem[]) => {
    if (!modelName) return;
    const cleanModel = modelName.trim().toLowerCase();

    // 1. Match exact product_code or model
    let matched = currentProducts.find(
      p => (p.product_code && p.product_code.toLowerCase() === cleanModel) ||
           (p.model && p.model.toLowerCase() === cleanModel)
    );

    // 2. Match partial name
    if (!matched) {
      matched = currentProducts.find(
        p => p.name.toLowerCase().includes(cleanModel) || cleanModel.includes(p.product_code.toLowerCase())
      );
    }

    if (matched) {
      setSelectedProductId(matched.id);
    } else if (currentProducts.length > 0) {
      setSelectedProductId(currentProducts[0].id);
    }
  };

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

      // Auto-associate product by parsed module_model (e.g. BIN-21-615)
      const parsedModel = data.module_model || 'BIN-21-615';
      autoAssociateProduct(parsedModel, productList);

      setMessage({ type: 'success', text: `Extracted ${data.modules?.length || 0} solar panel serial numbers! Associated with Model: ${parsedModel}` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error processing OCR on PDF' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewProduct = async () => {
    const modelName = ftrData?.module_model || 'BIN-21-615';
    try {
      setCreatingProduct(true);
      setMessage(null);

      const newProdRes = await fetch('/api/inventory/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_code: modelName,
          name: `Waaree TopCon Solar Panel (${modelName})`,
          category: 'Solar Panels',
          brand: 'WAAREE ENERGIES LIMITED',
          model: modelName,
          unit: 'Piece',
          minimum_stock: 0,
          current_stock: 0,
          selling_price: 0,
        }),
      });

      const result = await newProdRes.json();
      if (!newProdRes.ok || result.error) {
        throw new Error(result.error || 'Failed to create new product');
      }

      // Refresh product list and auto-select newly created product
      const updatedRes = await fetch('/api/inventory/products');
      if (updatedRes.ok) {
        const updatedData = await updatedRes.json();
        const updatedProds: ProductItem[] = updatedData.products || [];
        setProductList(updatedProds);
        const newProd = updatedProds.find(p => p.product_code === modelName);
        if (newProd) {
          setSelectedProductId(newProd.id);
        }
      }

      setMessage({ type: 'success', text: `Successfully created new catalog product for Model: ${modelName}!` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error creating product' });
    } finally {
      setCreatingProduct(false);
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

      const targetProductId = selectedProductId || (productList.length > 0 ? productList[0].id : 1);

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

  const currentParsedModel = ftrData?.module_model || 'BIN-21-615';
  const isModelExisting = productList.some(
    p => (p.product_code && p.product_code.toLowerCase() === currentParsedModel.toLowerCase()) ||
         (p.model && p.model.toLowerCase() === currentParsedModel.toLowerCase())
  );

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
            <Button onClick={handleParse} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
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
            {message.type === 'success' ? <CheckCircle className="w-4 h-4 text-green-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
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
                <span className="font-extrabold text-blue-700">{currentParsedModel}</span>
              </div>
              <div className="p-2 bg-blue-50 border rounded">
                <span className="text-slate-500 block">Parsed Quantity</span>
                <span className="font-bold text-green-700 text-sm">{ftrData.modules.length} Panels</span>
              </div>
            </div>

            {/* Target Solar Panel Selection & Auto Association */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <label className="block text-xs font-extrabold text-amber-900 uppercase tracking-wide">
                    Select Product to Update Stock (+{ftrData.modules.length})
                  </label>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Auto-associated with Module Model: <span className="font-extrabold font-mono text-blue-700">{currentParsedModel}</span>
                  </p>
                </div>

                {!isModelExisting && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateNewProduct}
                    disabled={creatingProduct}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {creatingProduct ? 'Creating...' : `+ Create New Product for Model: ${currentParsedModel}`}
                  </Button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="text-xs p-2 border rounded bg-white w-full font-bold text-slate-800"
                >
                  {productList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Code: {p.product_code}) - Stock: {p.current_stock}
                    </option>
                  ))}
                  {productList.length === 0 && (
                    <option value={1}>BIN-21-615 - Waaree TopCon 615W Solar Panel</option>
                  )}
                </select>

                <Button onClick={handleImportStock} disabled={importing} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shrink-0 w-full sm:w-auto">
                  <PackageCheck className="w-4 h-4 mr-1" />
                  {importing ? 'Updating Stock...' : `Update Stock (+${ftrData.modules.length})`}
                </Button>
              </div>
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
