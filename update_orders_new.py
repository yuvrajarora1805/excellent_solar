import re

with open("app/(auth)/orders/new/page.tsx", "r") as f:
    content = f.read()

# 1. Update imports
content = content.replace("import { useRouter } from 'next/navigation';", "import { useRouter, useSearchParams } from 'next/navigation';\nimport { Suspense } from 'react';")

# 2. Rename export default function NewOrderPage to function NewOrderPageInner
content = content.replace("export default function NewOrderPage() {", "function NewOrderPageInner() {")

# 3. Add useSearchParams and draft loading logic
state_injection = """  const searchParams = useSearchParams();
  const draftId = searchParams.get('order_id');
  const [isDraftMode, setIsDraftMode] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);

  useEffect(() => {
    if (draftId) {
      loadDraftData(draftId);
    }
  }, [draftId]);

  const loadDraftData = async (id: string) => {
    try {
      setDraftLoading(true);
      const res = await fetch(`/api/orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        const order = data.order;
        if (order && order.status === 'DRAFT') {
          setIsDraftMode(true);
          setOrderType(order.order_type);
          if (order.customer_id) setSelectedCustomerId(order.customer_id.toString());
          setCustomerName(order.customer_name || '');
          setCustomerMobile(order.customer_mobile || '');
          setDeliveryAddress(order.delivery_address || '');
          
          if (order.items && order.items.length > 0) {
            setOrderItems(order.items.map((i: any) => ({
              product_id: i.product_id,
              product_name: i.product_name,
              quantity: i.quantity,
              unit_price: i.unit_price,
            })));
          }
        }
      }
    } catch (e) {
      console.error('Failed to load draft:', e);
    } finally {
      setDraftLoading(false);
    }
  };
"""

content = re.sub(r'  const \[selectedCustomerId, setSelectedCustomerId\] = useState<string>\(\'\'\);\n  const \[customerName, setCustomerName\] = useState\(\'\'\);\n  const \[customerMobile, setCustomerMobile\] = useState\(\'\'\);\n  const \[deliveryAddress, setDeliveryAddress\] = useState\(\'\'\);', 
                 r'  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(\'\');\n  const [customerName, setCustomerName] = useState(\'\');\n  const [customerMobile, setCustomerMobile] = useState(\'\');\n  const [deliveryAddress, setDeliveryAddress] = useState(\'\');\n\n' + state_injection, content)


# 4. Modify handleSaveOrder to use PUT if draft mode
handle_save_orig = """      const res = await fetch(orderType === 'RETAIL' ? '/api/orders/retail/requirement' : '/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });"""

handle_save_new = """      const url = isDraftMode ? `/api/orders/${draftId}` : (orderType === 'RETAIL' ? '/api/orders/retail/requirement' : '/api/orders');
      if (isDraftMode) {
        payload.isDraftEdit = true;
      }
      const res = await fetch(url, {
        method: isDraftMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });"""

content = content.replace(handle_save_orig, handle_save_new)

# 5. Add Export Default Wrapper
wrapper = """
export default function NewOrderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewOrderPageInner />
    </Suspense>
  );
}
"""
content += wrapper

with open("app/(auth)/orders/new/page.tsx", "w") as f:
    f.write(content)

