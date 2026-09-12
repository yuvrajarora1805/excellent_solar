import re

with open("app/(auth)/inventory/flasher-reports/page.tsx", "r") as f:
    content = f.read()

modal_replacement = """      <Modal isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} title="Add Serial Number">
        <form onSubmit={handleAddManualPanel} className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900">
            <strong>Unique Identification</strong>: Enter the unique serial number or barcode for the selected product.
          </div>

          <div>
            <label className="block font-bold mb-1">Select Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(Number(e.target.value))}
              className="w-full border rounded p-2 text-sm bg-white dark:bg-slate-900 font-medium"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.product_code})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Serial No. (Unique Key)</label>
              <Input
                required
                value={manualForm.module_sr_no}
                onChange={(e) => setManualForm({ ...manualForm, module_sr_no: e.target.value })}
                placeholder="Scan or type barcode..."
                className="font-mono"
              />
            </div>
            {products.find(p => p.id === selectedProductId)?.category === 'Solar Panels' && (
              <div>
                <label className="block font-bold mb-1">Box No.</label>
                <Input
                  value={manualForm.box_no}
                  onChange={(e) => setManualForm({ ...manualForm, box_no: e.target.value })}
                  placeholder="e.g. 18126725273"
                  className="font-mono"
                />
              </div>
            )}
          </div>

          {products.find(p => p.id === selectedProductId)?.category === 'Solar Panels' && (
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
          )}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => setIsManualModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Save Serial Number</Button>
          </div>
        </form>
      </Modal>"""

content = re.sub(r'      <Modal isOpen=\{isManualModalOpen\}.*?</Modal>', modal_replacement, content, flags=re.DOTALL)

with open("app/(auth)/inventory/flasher-reports/page.tsx", "w") as f:
    f.write(content)
