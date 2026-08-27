import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../services/api_service.dart';
import '../main.dart' show baseUrl;

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  List<dynamic> _orders = [];
  bool _isLoading = true;
  String _selectedTab = 'ALL';

  @override
  void initState() {
    super.initState();
    _fetchOrders();
  }

  Future<void> _fetchOrders() async {
    try {
      setState(() => _isLoading = true);
      String url = '$baseUrl/api/orders';
      if (_selectedTab != 'ALL') {
        url += '?order_type=$_selectedTab';
      }

      final response = await ApiService.get(Uri.parse(url));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _orders = data['orders'] ?? [];
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  void _openCreateOrderModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const CreateOrderBottomSheet(),
    ).then((_) => _fetchOrders());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Orders & Barcode Dispatch',
          style: GoogleFonts.hankenGrotesk(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchOrders,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openCreateOrderModal,
        backgroundColor: Colors.blue.shade700,
        icon: const Icon(Icons.camera_alt, color: Colors.white),
        label: const Text('New Order (Scan)', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: Column(
        children: [
          // Filter Tabs
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: Row(
              children: [
                _buildFilterChip('ALL', 'All Orders'),
                const SizedBox(width: 8),
                _buildFilterChip('PROJECT', 'Customer Project'),
                const SizedBox(width: 8),
                _buildFilterChip('RETAIL', 'Retail Sale'),
              ],
            ),
          ),

          // Orders List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _orders.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.local_shipping_outlined, size: 64, color: Colors.grey.shade400),
                            const SizedBox(height: 12),
                            Text('No orders found', style: TextStyle(color: Colors.grey.shade600, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Text('Tap "+ New Order" to scan barcodes & dispatch', style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        itemCount: _orders.length,
                        itemBuilder: (context, index) {
                          final order = _orders[index];
                          final isProject = order['order_type'] == 'PROJECT';
                          final isDispatched = order['status'] == 'DISPATCHED' || order['status'] == 'DELIVERED';

                          return Card(
                            elevation: 0,
                            margin: const EdgeInsets.only(bottom: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                              side: BorderSide(color: Colors.grey.shade300),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(14.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        order['order_number'] ?? '#ORD',
                                        style: TextStyle(
                                          fontWeight: FontWeight.w900,
                                          fontSize: 16,
                                          color: Colors.blue.shade800,
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: isDispatched ? Colors.green.shade50 : Colors.amber.shade50,
                                          borderRadius: BorderRadius.circular(6),
                                          border: Border.all(color: isDispatched ? Colors.green.shade300 : Colors.amber.shade300),
                                        ),
                                        child: Text(
                                          order['status'] ?? 'DRAFT',
                                          style: TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                            color: isDispatched ? Colors.green.shade800 : Colors.amber.shade800,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    order['customer_name'] ?? 'Customer',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                  ),
                                  if (order['customer_mobile'] != null && order['customer_mobile'].toString().isNotEmpty)
                                    Text('Mobile: ${order['customer_mobile']}', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      Icon(Icons.directions_bus, size: 16, color: Colors.blue.shade700),
                                      const SizedBox(width: 4),
                                      Text(
                                        'Vehicle: ${order['vehicle_number'] ?? 'N/A'}',
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                                      ),
                                      if (order['driver_name'] != null)
                                        Text(' (${order['driver_name']})', style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
                                    ],
                                  ),
                                  const Divider(height: 16),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: isProject ? Colors.purple.shade50 : Colors.teal.shade50,
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          isProject ? 'PROJECT ORDER' : 'RETAIL SALE',
                                          style: TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                            color: isProject ? Colors.purple.shade700 : Colors.teal.shade700,
                                          ),
                                        ),
                                      ),
                                      Text(
                                        '₹${(order['total_amount'] ?? 0).toString()}',
                                        style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Colors.black87),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String tabKey, String label) {
    final isSelected = _selectedTab == tabKey;
    return ChoiceChip(
      label: Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: isSelected ? Colors.white : Colors.black87)),
      selected: isSelected,
      selectedColor: Colors.blue.shade700,
      backgroundColor: Colors.grey.shade200,
      onSelected: (_) {
        setState(() => _selectedTab = tabKey);
        _fetchOrders();
      },
    );
  }
}

class CreateOrderBottomSheet extends StatefulWidget {
  const CreateOrderBottomSheet({super.key});

  @override
  State<CreateOrderBottomSheet> createState() => _CreateOrderBottomSheetState();
}

class _CreateOrderBottomSheetState extends State<CreateOrderBottomSheet> {
  String _orderType = 'PROJECT';
  int? _selectedCustomerId;
  List<dynamic> _customersList = [];
  bool _loadingCustomers = false;

  final _customerNameController = TextEditingController();
  final _customerMobileController = TextEditingController();
  final _deliveryAddressController = TextEditingController();
  final _vehicleNumberController = TextEditingController();
  final _driverNameController = TextEditingController();
  final _barcodeInputController = TextEditingController();

  List<String> _scannedBarcodes = [];
  File? _vehiclePhoto;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _fetchCustomers();
  }

  Future<void> _fetchCustomers() async {
    try {
      setState(() => _loadingCustomers = true);
      final response = await ApiService.get(Uri.parse('$baseUrl/api/customers?limit=100'));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _customersList = data['customers'] ?? data ?? [];
          _loadingCustomers = false;
        });
      } else {
        setState(() => _loadingCustomers = false);
      }
    } catch (e) {
      setState(() => _loadingCustomers = false);
    }
  }

  void _onCustomerSelected(int? custId) {
    setState(() {
      _selectedCustomerId = custId;
      if (custId != null) {
        final cust = _customersList.firstWhere((c) => c['id'] == custId, orElse: () => null);
        if (cust != null) {
          _customerNameController.text = cust['name'] ?? '';
          _customerMobileController.text = cust['mobile'] ?? '';
          _deliveryAddressController.text = cust['address'] ?? '';
        }
      }
    });
  }

  Future<void> _openCameraScanner() async {
    final String? scannedCode = await Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const CameraBarcodeScannerView()),
    );

    if (scannedCode != null && scannedCode.isNotEmpty) {
      if (!_scannedBarcodes.contains(scannedCode)) {
        setState(() {
          _scannedBarcodes.add(scannedCode);
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('✓ Scanned Barcode: $scannedCode'),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 2),
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Barcode $scannedCode already added!'),
              backgroundColor: Colors.amber.shade900,
            ),
          );
        }
      }
    }
  }

  Future<void> _takeVehiclePhoto() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.camera, imageQuality: 70);
    if (picked != null) {
      setState(() {
        _vehiclePhoto = File(picked.path);
      });
    }
  }

  void _addBarcodeManual() {
    final code = _barcodeInputController.text.trim();
    if (code.isNotEmpty && !_scannedBarcodes.contains(code)) {
      setState(() {
        _scannedBarcodes.add(code);
        _barcodeInputController.clear();
      });
    }
  }

  Future<void> _submitOrder(bool dispatchNow) async {
    if (_customerNameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Customer Name is required')));
      return;
    }

    try {
      setState(() => _isSubmitting = true);

      final serialsList = _scannedBarcodes.map((b) => {'product_id': 1, 'serial_number': b}).toList();
      final body = {
        'order_type': _orderType,
        'customer_id': _selectedCustomerId,
        'customer_name': _customerNameController.text.trim(),
        'customer_mobile': _customerMobileController.text.trim(),
        'delivery_address': _deliveryAddressController.text.trim(),
        'vehicle_number': _vehicleNumberController.text.trim(),
        'driver_name': _driverNameController.text.trim(),
        'total_amount': _scannedBarcodes.length * 23500,
        'items': [
          {'product_id': 1, 'quantity': _scannedBarcodes.isNotEmpty ? _scannedBarcodes.length : 1, 'unit_price': 23500}
        ],
        'serials': serialsList,
        'dispatchImmediately': dispatchNow,
      };

      final response = await ApiService.post(Uri.parse('$baseUrl/api/orders'), body: body);

      if (response.statusCode == 200) {
        if (mounted) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(dispatchNow ? 'Order Dispatched & Stock Synced!' : 'Order Draft Created!'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to submit order')));
      }
    } catch (e) {
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.9,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,

            children: [
              Text('Create Order & Dispatch', style: GoogleFonts.hankenGrotesk(fontSize: 18, fontWeight: FontWeight.bold)),
              IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
            ],
          ),
          const Divider(),
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Order Type Toggle
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            backgroundColor: _orderType == 'PROJECT' ? Colors.blue.shade50 : Colors.white,
                            side: BorderSide(color: _orderType == 'PROJECT' ? Colors.blue : Colors.grey.shade300),
                          ),
                          onPressed: () => setState(() => _orderType = 'PROJECT'),
                          child: const Text('Customer Project'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            backgroundColor: _orderType == 'RETAIL' ? Colors.teal.shade50 : Colors.white,
                            side: BorderSide(color: _orderType == 'RETAIL' ? Colors.teal : Colors.grey.shade300),
                          ),
                          onPressed: () => setState(() => _orderType = 'RETAIL'),
                          child: const Text('Retail OTC Sale'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Customer Project Selection Dropdown
                  if (_orderType == 'PROJECT') ...[
                    _loadingCustomers
                        ? const Center(child: Padding(padding: EdgeInsets.all(8.0), child: CircularProgressIndicator()))
                        : DropdownButtonFormField<int>(
                            decoration: const InputDecoration(
                              labelText: 'Select Registered Customer / Project *',
                              border: OutlineInputBorder(),
                              isDense: true,
                            ),
                            value: _selectedCustomerId,
                            items: _customersList.map((c) {
                              return DropdownMenuItem<int>(
                                value: c['id'],
                                child: Text('${c['name']} (${c['mobile'] ?? ''})', overflow: TextOverflow.ellipsis),
                              );
                            }).toList(),
                            onChanged: _onCustomerSelected,
                          ),
                    const SizedBox(height: 12),
                  ],

                  // Customer Details Form Fields
                  TextField(
                    controller: _customerNameController,
                    decoration: const InputDecoration(labelText: 'Customer / Buyer Name *', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _customerMobileController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(labelText: 'Mobile Phone', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _deliveryAddressController,
                    decoration: const InputDecoration(labelText: 'Delivery / Installation Address', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 16),

                  // Live Camera Barcode Scanner Section
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.blue.shade200),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,

                          children: [
                            const Text('Scan Solar Panel Barcodes', style: TextStyle(fontWeight: FontWeight.bold)),
                            Text('${_scannedBarcodes.length} Panels Scanned', style: TextStyle(color: Colors.blue.shade900, fontWeight: FontWeight.bold)),
                          ],
                        ),
                        const SizedBox(height: 10),

                        // Prominent Camera Scan Button
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.blue.shade700,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            onPressed: _openCameraScanner,
                            icon: const Icon(Icons.camera_alt, color: Colors.white),
                            label: const Text('Open Camera Barcode Scanner', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          ),
                        ),
                        const SizedBox(height: 10),

                        // Manual Entry Fallback
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _barcodeInputController,
                                decoration: const InputDecoration(
                                  hintText: 'Or type Module Sr. No.',
                                  fillColor: Colors.white,
                                  filled: true,
                                  border: OutlineInputBorder(),
                                  isDense: true,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            OutlinedButton(
                              onPressed: _addBarcodeManual,
                              child: const Text('Add Manual'),
                            ),
                          ],
                        ),

                        if (_scannedBarcodes.isNotEmpty) ...[
                          const SizedBox(height: 10),
                          Wrap(
                            spacing: 6,
                            runSpacing: 4,
                            children: _scannedBarcodes
                                .map((b) => Chip(
                                      label: Text(b, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                                      onDeleted: () => setState(() => _scannedBarcodes.remove(b)),
                                    ))
                                .toList(),
                          ),
                        ]
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Vehicle Details
                  TextField(
                    controller: _vehicleNumberController,
                    decoration: const InputDecoration(labelText: 'Vehicle Number (e.g. PB-04-AB-1234)', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _driverNameController,
                    decoration: const InputDecoration(labelText: 'Driver Name', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 12),

                  // Vehicle Photo Capture
                  OutlinedButton.icon(
                    onPressed: _takeVehiclePhoto,
                    icon: Icon(_vehiclePhoto == null ? Icons.camera_alt : Icons.check_circle, color: _vehiclePhoto == null ? Colors.blue : Colors.green),
                    label: Text(_vehiclePhoto == null ? 'Capture Vehicle Photo Proof' : 'Vehicle Photo Captured ✓'),
                  ),
                  const SizedBox(height: 20),

                  // Action Buttons
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: _isSubmitting ? null : () => _submitOrder(false),
                          child: const Text('Save Draft'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(backgroundColor: Colors.green.shade700, foregroundColor: Colors.white),
                          onPressed: _isSubmitting ? null : () => _submitOrder(true),
                          child: Text(_isSubmitting ? 'Syncing...' : 'Dispatch & Sync Stock'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================
// CAMERA BARCODE SCANNER VIEW SCREEN
// ============================================
class CameraBarcodeScannerView extends StatefulWidget {
  const CameraBarcodeScannerView({super.key});

  @override
  State<CameraBarcodeScannerView> createState() => _CameraBarcodeScannerViewState();
}

class _CameraBarcodeScannerViewState extends State<CameraBarcodeScannerView> {
  final MobileScannerController _controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
  );
  bool _isScanned = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan Solar Panel Barcode'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: ValueListenableBuilder(
              valueListenable: _controller,
              builder: (context, state, child) {
                return Icon(
                  state.torchState == TorchState.on ? Icons.flash_on : Icons.flash_off,
                  color: Colors.yellow,
                );
              },
            ),
            onPressed: () => _controller.toggleTorch(),
          ),
        ],
      ),
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: (capture) {
              if (_isScanned) return;
              final List<Barcode> barcodes = capture.barcodes;
              for (final barcode in barcodes) {
                final String? rawVal = barcode.rawValue;
                if (rawVal != null && rawVal.trim().isNotEmpty) {
                  setState(() => _isScanned = true);
                  Navigator.pop(context, rawVal.trim());
                  break;
                }
              }
            },
          ),

          // Scanning Overlay Frame
          Center(
            child: Container(
              width: 280,
              height: 160,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.green, width: 3),
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),

          // Instructions at bottom
          Positioned(
            bottom: 40,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.7),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text(
                'Point camera at Solar Panel Barcode (Module Sr. No.)',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
