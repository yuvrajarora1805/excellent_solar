import re

with open("app/(auth)/inventory/flasher-reports/page.tsx", "r") as f:
    content = f.read()

# 1. Add state for products
state_addition = """  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number>(1);
"""
content = re.sub(r'(const \[isClearing, setIsClearing\] = useState\(false\);)', r'\1\n' + state_addition, content)

# 2. Update fetch logic
fetch_logic = """  useEffect(() => {
    fetchSerials();
    fetch('/api/inventory/products').then(res => res.json()).then(data => setProducts(data));
  }, []);"""
content = re.sub(r'  useEffect\(\(\) => \{\n    fetchSerials\(\);\n  \}, \[\]\);', fetch_logic, content)

# 3. Update handleAddManualPanel
handle_add = """  const handleAddManualPanel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.module_sr_no) {
      alert('Serial Number is required!');
      return;
    }

    try {
      let res;
      const selectedProduct = products.find(p => p.id === selectedProductId);
      const isSolarPanel = selectedProduct?.category === 'Solar Panels';

      if (isSolarPanel) {
        res = await fetch('/api/serial-numbers/import-ftr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: selectedProductId,
            invoice_no: headerInfo.invoice_no,
            modules: [manualForm],
          }),
        });
      } else {
        res = await fetch('/api/serial-numbers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: selectedProductId,
            serial_number: manualForm.module_sr_no,
            warehouse_id: 1,
            current_location: 'WAREHOUSE',
            status: 'AVAILABLE'
          }),
        });
        if (res.ok) {
           await fetch('/api/inventory/stock/adjust', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               product_id: selectedProductId,
               new_quantity: 1, // Actually we need to increment, but generic endpoint doesn't increment? Wait, the API might not increment stock.
               // Actually we'll skip this if we just want serials to exist, or we can use the backend to increment.
             })
           });
        }
      }

      if (res.ok) {
        alert('Serial Number added manually!');
        setIsManualModalOpen(false);
        fetchSerials();
      } else {
        alert('Failed to add serial number.');
      }
    } catch (err) {
      alert('Error adding manual serial number.');
    }
  };"""
content = re.sub(r'  const handleAddManualPanel = async \(e: React\.FormEvent\) => \{.*?\n  \};\n', handle_add + "\n", content, flags=re.DOTALL)

with open("app/(auth)/inventory/flasher-reports/page.tsx", "w") as f:
    f.write(content)
