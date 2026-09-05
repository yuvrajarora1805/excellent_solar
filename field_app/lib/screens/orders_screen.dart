import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'product_picker_screen.dart';
import 'order_detail_screen.dart';
import '../services/api_service.dart';
import '../main.dart' show baseUrl;

class ScannedItem {
  final String serialNumber;
  final bool isMatched;
  final String status;
  final String productName;
  final String modelNumber;
  final String remarks;

  ScannedItem({
    required this.serialNumber,
    required this.isMatched,
    required this.status,
    required this.productName,
    required this.modelNumber,
    required this.remarks,
  });
}

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
      if (mounted) setState(() => _isLoading = true);
      String url = '$baseUrl/api/orders';
      if (_selectedTab != 'ALL') {
        url += '?order_type=$_selectedTab';
      }

      final response = await ApiService.get(Uri.parse(url));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (!mounted) return;
        setState(() {
          _orders = data['orders'] ?? [];
          _isLoading = false;
        });
      } else {
        if (!mounted) return;
        setState(() => _isLoading = false);
      }
    } catch (e) {
      if (!mounted) return;
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

                          return InkWell(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => OrderDetailScreen(
                                    orderId: order['id'],
                                    orderNumber: order['order_number'] ?? 'Order',
                                  ),
                                ),
                              );
                            },
                            child: Card(
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
  String? _selectedProjectIdStr;
  List<dynamic> _projectsList = [];
  bool _loadingProjects = false;

  final _customerNameController = TextEditingController();
  final _customerMobileController = TextEditingController();
  final _deliveryAddressController = TextEditingController();
  final _vehicleNumberController = TextEditingController();
  final _driverNameController = TextEditingController();
  final _barcodeInputController = TextEditingController();

  List<ScannedItem> _scannedItems = [];
  List<SelectedProduct> _nonSerializedProducts = [];
  File? _vehiclePhoto;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _fetchProjects();
  }

  Future<void> _fetchProjects() async {
    try {
      if (mounted) setState(() => _loadingProjects = true);
      final response = await ApiService.get(Uri.parse('$baseUrl/api/projects?limit=100'));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> fetched = data is List ? data : (data['projects'] ?? []);
        if (!mounted) return;
        setState(() {
          _projectsList = fetched;
          _loadingProjects = false;
        });
      } else {
        if (!mounted) return;
        setState(() => _loadingProjects = false);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _loadingProjects = false);
    }
  }

  void _onProjectSelected(String? projIdStr) {
    setState(() {
      _selectedProjectIdStr = projIdStr;
      if (projIdStr != null) {
        final proj = _projectsList.firstWhere(
          (p) => p['id'].toString() == projIdStr,
          orElse: () => null,
        );
        if (proj != null) {
          _customerNameController.text = proj['customer_name'] ?? '';
          _customerMobileController.text = proj['customer_mobile'] ?? '';
          _deliveryAddressController.text = proj['customer_address'] ?? proj['site_address'] ?? '';
        }
      }
    });
  }

  Future<void> _openMultiCameraScanner() async {
    final List<ScannedItem>? results = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => MultiCameraBarcodeScannerView(
          initialScannedItems: List.from(_scannedItems),
        ),
      ),
    );

    if (results != null) {
      setState(() {
        _scannedItems = results;
      });
    }
  }

  Future<void> _openProductPicker() async {
    final List<SelectedProduct>? results = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ProductPickerScreen(
          initialSelection: List.from(_nonSerializedProducts),
        ),
      ),
    );

    if (results != null) {
      setState(() {
        _nonSerializedProducts = results;
      });
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

  bool _isCheckingManual = false;

  Future<void> _addBarcodeManual() async {
    final rawInput = _barcodeInputController.text.trim();
    if (rawInput.isEmpty) return;

    final code = extractSerialNumberFromBarcode(rawInput);

    if (_scannedItems.any((p) => p.serialNumber == code || p.serialNumber == rawInput)) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('⚠️ Serial Number $code is already added!')),
      );
      return;
    }

    try {
      setState(() => _isCheckingManual = true);

      // Perform Real-Time Live MySQL Inventory Stock Lookup
      var response = await ApiService.get(Uri.parse('$baseUrl/api/serial-numbers?search=$code'));
      List<dynamic> list = [];
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        list = data is List ? data : (data['serials'] ?? []);
      }
      if (list.isEmpty && rawInput != code) {
        response = await ApiService.get(Uri.parse('$baseUrl/api/serial-numbers?search=${Uri.encodeComponent(rawInput)}'));
        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          list = data is List ? data : (data['serials'] ?? []);
        }
      }

      if (list.isNotEmpty) {
        final item = list.first;
        final String matchedSerial = item['serial_number'] ?? code;
        final String modelStr = item['model_number'] ?? item['product_code'] ?? item['model'] ?? 'Unknown Model';
        final String nameStr = item['product_name'] ?? 'Unknown Product';

        final matchedItem = ScannedItem(
          serialNumber: matchedSerial,
          isMatched: true,
          status: item['status'] ?? 'AVAILABLE',
          productName: nameStr,
          modelNumber: modelStr,
          remarks: item['remarks'] ?? 'Matched in MySQL Stock',
        );

        if (!mounted) return;
        setState(() {
          _scannedItems.insert(0, matchedItem);
          _barcodeInputController.clear();
          _isCheckingManual = false;
        });

        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✓ Matched Stock: Model $modelStr ($matchedSerial)'),
            backgroundColor: Colors.green.shade800,
            duration: const Duration(milliseconds: 1400),
          ),
        );
        return;
      }

      // Not found in inventory stock
      if (!mounted) return;
      setState(() => _isCheckingManual = false);
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('❌ Serial Number $code NOT found in Stock Inventory!'),
          backgroundColor: Colors.red.shade800,
          duration: const Duration(seconds: 2),
        ),
      );
    } catch (e) {
      if (mounted) setState(() => _isCheckingManual = false);
    }
  }


  Future<void> _submitOrder(bool dispatchNow) async {
    if (_customerNameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Customer Name is required')));
      return;
    }

    try {
      setState(() => _isSubmitting = true);

      final serialsList = _scannedItems.map((p) => {'product_id': 1, 'serial_number': p.serialNumber}).toList();
      final body = {
        'order_type': _orderType,
        'project_id': _selectedProjectIdStr != null ? int.tryParse(_selectedProjectIdStr!) : null,
        'customer_name': _customerNameController.text.trim(),
        'customer_mobile': _customerMobileController.text.trim(),
        'delivery_address': _deliveryAddressController.text.trim(),
        'vehicle_number': _vehicleNumberController.text.trim(),
        'driver_name': _driverNameController.text.trim(),
        'vehicle_photo_base64': _vehiclePhoto != null ? base64Encode(_vehiclePhoto!.readAsBytesSync()) : null,
        'total_amount': _scannedItems.length * 23500,
        'items': _nonSerializedProducts.map((p) => {
          'product_id': p.product.id,
          'quantity': p.quantity,
          'unit_price': 0, // Fallback if backend doesn't resolve price
        }).toList(),
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
      height: MediaQuery.of(context).size.height * 0.92,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
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
          const Divider(height: 1),
          const SizedBox(height: 12),
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Order Type Segmented Toggle
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            backgroundColor: _orderType == 'PROJECT' ? Colors.blue.shade50 : Colors.white,
                            side: BorderSide(color: _orderType == 'PROJECT' ? Colors.blue.shade700 : Colors.grey.shade300, width: 1.5),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          onPressed: () => setState(() => _orderType = 'PROJECT'),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.folder_shared, size: 18, color: _orderType == 'PROJECT' ? Colors.blue.shade800 : Colors.grey),
                              const SizedBox(width: 6),
                              Text('Customer Project', style: TextStyle(fontWeight: FontWeight.bold, color: _orderType == 'PROJECT' ? Colors.blue.shade800 : Colors.black87)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            backgroundColor: _orderType == 'RETAIL' ? Colors.teal.shade50 : Colors.white,
                            side: BorderSide(color: _orderType == 'RETAIL' ? Colors.teal.shade700 : Colors.grey.shade300, width: 1.5),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          onPressed: () => setState(() => _orderType = 'RETAIL'),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.storefront, size: 18, color: _orderType == 'RETAIL' ? Colors.teal.shade800 : Colors.grey),
                              const SizedBox(width: 6),
                              Text('Retail OTC Sale', style: TextStyle(fontWeight: FontWeight.bold, color: _orderType == 'RETAIL' ? Colors.teal.shade800 : Colors.black87)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Registered Project Dropdown
                  if (_orderType == 'PROJECT') ...[
                    _loadingProjects
                        ? const Center(child: Padding(padding: EdgeInsets.all(12.0), child: CircularProgressIndicator()))
                        : Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.purple.shade50,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.purple.shade200),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Row(
                                  children: [
                                    Icon(Icons.work, size: 18, color: Colors.purple),
                                    SizedBox(width: 6),
                                    Text('Select Registered Project', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.purple)),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                DropdownButtonFormField<String>(
                                  decoration: const InputDecoration(
                                    fillColor: Colors.white,
                                    filled: true,
                                    border: OutlineInputBorder(),
                                    isDense: true,
                                    hintText: '-- Select Project --',
                                  ),
                                  value: _selectedProjectIdStr,
                                  items: _projectsList.map<DropdownMenuItem<String>>((p) {
                                    final String idStr = p['id'].toString();
                                    return DropdownMenuItem<String>(
                                      value: idStr,
                                      child: Text('${p['project_id']} - ${p['customer_name']}', overflow: TextOverflow.ellipsis),
                                    );
                                  }).toList(),
                                  onChanged: _onProjectSelected,
                                ),
                              ],
                            ),
                          ),
                    const SizedBox(height: 12),
                  ],

                  // Customer Details Form Fields Card
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey.shade300),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Customer & Buyer Details', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        const SizedBox(height: 10),
                        TextField(
                          controller: _customerNameController,
                          decoration: const InputDecoration(labelText: 'Customer / Buyer Name *', border: OutlineInputBorder(), fillColor: Colors.white, filled: true),
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _customerMobileController,
                          keyboardType: TextInputType.phone,
                          decoration: const InputDecoration(labelText: 'Mobile Phone', border: OutlineInputBorder(), fillColor: Colors.white, filled: true),
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _deliveryAddressController,
                          decoration: const InputDecoration(labelText: 'Delivery / Installation Address', border: OutlineInputBorder(), fillColor: Colors.white, filled: true),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 1D & 2D Barcode / QR Code Scanner Section
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.blue.shade300),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.qr_code_scanner, color: Colors.blue, size: 20),
                                SizedBox(width: 6),
                                Text('Scan 1D & 2D Barcodes / QR Codes', style: TextStyle(fontWeight: FontWeight.bold)),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(color: Colors.blue.shade700, borderRadius: BorderRadius.circular(12)),
                              child: Text('${_scannedItems.length} Items', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        // Prominent 1D / 2D Scanner Button
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.blue.shade800,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              elevation: 2,
                            ),
                            onPressed: _openMultiCameraScanner,
                            icon: const Icon(Icons.camera_alt, color: Colors.white),
                            label: Text(
                              'Open 1D/2D Barcode Camera Scanner (${_scannedItems.length})',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
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
                              onPressed: _isCheckingManual ? null : _addBarcodeManual,
                              child: _isCheckingManual
                                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                                  : const Text('Add Manual'),
                            ),

                          ],
                        ),

                        if (_scannedItems.isNotEmpty) ...[
                          const SizedBox(height: 12),
                          const Text('Attached Scanned Items:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.blue)),
                          const SizedBox(height: 6),
                          Wrap(
                            spacing: 6,
                            runSpacing: 6,
                            children: _scannedItems
                                .map((p) => Chip(
                                      avatar: const Icon(Icons.check_circle, size: 16, color: Colors.green),
                                      label: Text('${p.productName} - ${p.modelNumber} (${p.serialNumber})', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                      onDeleted: () => setState(() => _scannedItems.remove(p)),
                                    ))
                                .toList(),
                          ),
                        ]
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Add Non-Serialized Products Section
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.purple.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.purple.shade300),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.category, color: Colors.purple, size: 20),
                                SizedBox(width: 6),
                                Text('Add Non-Serialized Products', style: TextStyle(fontWeight: FontWeight.bold)),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(color: Colors.purple.shade700, borderRadius: BorderRadius.circular(12)),
                              child: Text('${_nonSerializedProducts.length} Items', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.purple.shade800,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              elevation: 2,
                            ),
                            onPressed: _openProductPicker,
                            icon: const Icon(Icons.add_shopping_cart, color: Colors.white),
                            label: const Text(
                              'Select Other Products (Cables, etc.)',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                          ),
                        ),
                        if (_nonSerializedProducts.isNotEmpty) ...[
                          const SizedBox(height: 12),
                          const Text('Selected Products:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.purple)),
                          const SizedBox(height: 6),
                          Wrap(
                            spacing: 6,
                            runSpacing: 6,
                            children: _nonSerializedProducts
                                .map((p) => Chip(
                                      avatar: const Icon(Icons.check_circle, size: 16, color: Colors.green),
                                      label: Text('${p.product.name} (Qty: ${p.quantity})', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                      onDeleted: () => setState(() => _nonSerializedProducts.remove(p)),
                                    ))
                                .toList(),
                          ),
                        ]
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Vehicle Details Card
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.amber.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.amber.shade300),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.directions_bus, size: 18, color: Colors.amber),
                            SizedBox(width: 6),
                            Text('Dispatch Vehicle & Driver Details', style: TextStyle(fontWeight: FontWeight.bold)),
                          ],
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: _vehicleNumberController,
                          decoration: const InputDecoration(labelText: 'Vehicle Number (e.g. PB-04-AB-1234)', border: OutlineInputBorder(), fillColor: Colors.white, filled: true),
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _driverNameController,
                          decoration: const InputDecoration(labelText: 'Driver Name', border: OutlineInputBorder(), fillColor: Colors.white, filled: true),
                        ),
                        const SizedBox(height: 10),
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton.icon(
                            style: OutlinedButton.styleFrom(
                              backgroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                            onPressed: _takeVehiclePhoto,
                            icon: Icon(_vehiclePhoto == null ? Icons.camera_alt : Icons.check_circle, color: _vehiclePhoto == null ? Colors.amber.shade900 : Colors.green),
                            label: Text(
                              _vehiclePhoto == null ? 'Capture Vehicle Photo Proof' : 'Vehicle Photo Captured ✓',
                              style: TextStyle(fontWeight: FontWeight.bold, color: _vehiclePhoto == null ? Colors.amber.shade900 : Colors.green.shade800),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Action Buttons
                  Row(
                    children: [
                      Expanded(
                        flex: 35,
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          onPressed: _isSubmitting ? null : () => _submitOrder(false),
                          child: const FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Text('Save Draft', style: TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        flex: 65,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green.shade700,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 6),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            elevation: 3,
                          ),
                          onPressed: _isSubmitting ? null : () => _submitOrder(true),
                          child: FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Text(
                              _isSubmitting ? 'Syncing...' : '🚀 Dispatch & Sync Stock',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                          ),
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

// ============================================================================
// HELPER: PARSE 1D & 2D BARCODE / QR CODE PAYLOAD TEXT INTO CLEAN SERIAL NUMBER
// ============================================================================
String extractSerialNumberFromBarcode(String raw) {
  String input = raw.trim();
  if (input.isEmpty) return input;

  // 1. Check if input is JSON object (e.g. {"sn": "WS08269074875699"})
  if (input.startsWith('{') && input.endsWith('}')) {
    try {
      final Map<String, dynamic> jsonMap = jsonDecode(input);
      for (final key in ['serial_number', 'serialNumber', 'serial', 'sn', 'module_sn', 'code', 'id']) {
        if (jsonMap.containsKey(key) && jsonMap[key] != null && jsonMap[key].toString().trim().isNotEmpty) {
          return jsonMap[key].toString().trim();
        }
      }
    } catch (_) {}
  }

  // 2. Check if input is URL (e.g., https://waaree.com/verify?sn=WS08269074875699)
  if (input.startsWith('http://') || input.startsWith('https://')) {
    try {
      final uri = Uri.parse(input);
      if (uri.queryParameters.containsKey('sn') && uri.queryParameters['sn']!.trim().isNotEmpty) {
        return uri.queryParameters['sn']!.trim();
      }
      if (uri.queryParameters.containsKey('serial') && uri.queryParameters['serial']!.trim().isNotEmpty) {
        return uri.queryParameters['serial']!.trim();
      }
      if (uri.queryParameters.containsKey('code') && uri.queryParameters['code']!.trim().isNotEmpty) {
        return uri.queryParameters['code']!.trim();
      }
      final segments = uri.pathSegments.where((s) => s.trim().isNotEmpty).toList();
      if (segments.isNotEmpty) {
        final last = segments.last.trim();
        if (RegExp(r'^[A-Za-z0-9\-_]{6,30}$').hasMatch(last)) {
          return last;
        }
      }
    } catch (_) {}
  }

  // 3. Multi-line or delimited QR text parsing (e.g. "BRAND: WAAREE\nSN: WS08269074875699" or "PN:WSP6000i;SN:WPS060260800411")
  String standardizedInput = input.replaceAll(RegExp(r'[;,|]'), '\n');
  if (standardizedInput.contains('\n') || standardizedInput.contains('\r')) {
    final lines = standardizedInput.split(RegExp(r'[\r\n]+'));
    
    // First pass: look for explicit serial number prefixes
    for (final line in lines) {
      final trimmed = line.trim();
      final prefixMatch = RegExp(r'^(SN\s*:?\s*|S/N\s*:?\s*|SERIAL\s*(NO)?\.?\s*:?\s*|SR\s*NO\.?\s*:?\s*|MODULE\s*SN\s*:?\s*)', caseSensitive: false);
      if (prefixMatch.hasMatch(trimmed)) {
        return trimmed.replaceFirst(prefixMatch, '').trim();
      }
    }
    
    // Second pass: if no explicit prefix, look for a long alphanumeric string that looks like a serial
    for (final line in lines) {
      final trimmed = line.trim();
      if (RegExp(r'^[A-Za-z0-9]{8,30}$').hasMatch(trimmed)) {
        return trimmed;
      }
    }
  }

  // 4. Strip common serial number prefixes (SN:, S/N:, SERIAL:, SR NO:, etc.)
  final prefixRegex = RegExp(r'^(SN\s*:?\s*|S/N\s*:?\s*|SERIAL\s*(NO)?\.?\s*:?\s*|SR\s*NO\.?\s*:?\s*|MODULE\s*SN\s*:?\s*)', caseSensitive: false);
  if (prefixRegex.hasMatch(input)) {
    input = input.replaceFirst(prefixRegex, '').trim();
  }

  // 5. GS1 Data Matrix AI prefix (21 = Serial Number in GS1 standard)
  if (input.length > 10 && input.startsWith('21') && RegExp(r'^21[A-Za-z0-9]{6,28}$').hasMatch(input)) {
    return input.substring(2);
  }

  // 6. Handle space-separated "MODEL SERIAL" format used for solar panels
  if (input.contains(' ')) {
    final parts = input.split(' ');
    if (parts.length >= 2) {
      return parts.sublist(1).join(' ').trim();
    }
  }

  return input;
}

// ============================================================================
// CONTINUOUS 1D & 2D MULTI-BARCODE SCANNER VIEW WITH LIVE INVENTORY MATCHING
// ============================================================================
class MultiCameraBarcodeScannerView extends StatefulWidget {
  final List<ScannedItem> initialScannedItems;

  const MultiCameraBarcodeScannerView({
    super.key,
    required this.initialScannedItems,
  });

  @override
  State<MultiCameraBarcodeScannerView> createState() => _MultiCameraBarcodeScannerViewState();
}

class _MultiCameraBarcodeScannerViewState extends State<MultiCameraBarcodeScannerView> {
  // MobileScanner supports both 1D Barcodes and 2D Barcodes (QR Codes, Data Matrix, PDF417, Aztec)
  final MobileScannerController _controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
    formats: const [
      BarcodeFormat.code128,
      BarcodeFormat.code39,
      BarcodeFormat.code93,
      BarcodeFormat.itf,
      BarcodeFormat.ean13,
      BarcodeFormat.upcA,
      BarcodeFormat.codabar,
      BarcodeFormat.qrCode,
      BarcodeFormat.dataMatrix,
      BarcodeFormat.pdf417,
      BarcodeFormat.aztec,
    ],
  );

  late List<ScannedItem> _scannedItems;
  final Set<String> _processingSerials = {};

  @override
  void initState() {
    super.initState();
    _scannedItems = List.from(widget.initialScannedItems);
    _processingSerials.addAll(_scannedItems.map((p) => p.serialNumber));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _onBarcodeDetected(BarcodeCapture capture) async {
    for (final barcode in capture.barcodes) {
      final String? rawVal = barcode.rawValue?.trim();
      if (rawVal == null || rawVal.isEmpty) continue;

      final String serialNumber = extractSerialNumberFromBarcode(rawVal);
      if (serialNumber.isEmpty) continue;

      // Synchronous Guard: Lock immediately before async network calls to prevent repeat scans
      if (_scannedItems.any((p) => p.serialNumber == serialNumber || p.serialNumber == rawVal) ||
          _processingSerials.contains(serialNumber) ||
          _processingSerials.contains(rawVal)) {
        continue;
      }
      _processingSerials.add(serialNumber);

      // 1. Play Audio Beep Sound & Haptic Click Feedback
      SystemSound.play(SystemSoundType.click);
      HapticFeedback.mediumImpact();

      // 2. Perform Real-Time Live Inventory Match & Status Lookup
      ScannedItem matchedItem = await _lookupInventoryStatus(serialNumber, rawInput: rawVal);

      if (!mounted) return;
      setState(() {
        _scannedItems.insert(0, matchedItem);
      });

      if (!matchedItem.isMatched) {
        // Show Red Warning Toast & Auto-remove unmatched item after 1 second
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('❌ Not found in Stock: $serialNumber (Removing in 1s...)'),
            backgroundColor: Colors.red.shade800,
            duration: const Duration(milliseconds: 1000),
          ),
        );

        Future.delayed(const Duration(seconds: 1), () {
          if (mounted) {
            setState(() {
              _scannedItems.removeWhere((p) => p.serialNumber == serialNumber || p.serialNumber == rawVal);
              _processingSerials.remove(serialNumber);
              _processingSerials.remove(rawVal);
            });
          }
        });
      } else {
        // Show Green Success Toast for Matched Inventory Model Number
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✓ Matched Stock: Model ${matchedItem.modelNumber} (${matchedItem.serialNumber})'),
            backgroundColor: Colors.green.shade800,
            duration: const Duration(milliseconds: 1400),
          ),
        );
      }
    }
  }

  Future<ScannedItem> _lookupInventoryStatus(String serial, {String? rawInput}) async {
    try {
      var response = await ApiService.get(Uri.parse('$baseUrl/api/serial-numbers?search=$serial'));
      List<dynamic> list = [];
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        list = data is List ? data : (data['serials'] ?? []);
      }

      // Try search raw input if different from serial
      if (list.isEmpty && rawInput != null && rawInput != serial && rawInput.isNotEmpty) {
        response = await ApiService.get(Uri.parse('$baseUrl/api/serial-numbers?search=${Uri.encodeComponent(rawInput)}'));
        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          list = data is List ? data : (data['serials'] ?? []);
        }
      }

      if (list.isNotEmpty) {
        final item = list.first;
        final String matchedSerial = item['serial_number'] ?? serial;
        final String modelStr = item['model_number'] ?? item['product_code'] ?? item['model'] ?? 'Unknown Model';
        final String nameStr = item['product_name'] ?? 'Unknown Product';
        return ScannedItem(
          serialNumber: matchedSerial,
          isMatched: true,
          status: item['status'] ?? 'AVAILABLE',
          productName: nameStr,
          modelNumber: modelStr,
          remarks: item['remarks'] ?? 'Matched in MySQL Stock',
        );
      }
    } catch (e) {
      // Fallback
    }

    return ScannedItem(
      serialNumber: serial,
      isMatched: false,
      status: 'NOT_FOUND',
      productName: 'Unmatched Serial',
      modelNumber: 'N/A',
      remarks: 'Not found in inventory',
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          '1D/2D Barcode Scanner (${_scannedItems.where((p) => p.isMatched).length})',
          style: GoogleFonts.hankenGrotesk(fontSize: 16, fontWeight: FontWeight.bold),
        ),
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
      body: Column(
        children: [
          // TOP 45%: 1D/2D CAMERA VIEWFINDER
          Expanded(
            flex: 45,
            child: Stack(
              children: [
                MobileScanner(
                  controller: _controller,
                  onDetect: _onBarcodeDetected,
                ),

                // Green Target Crosshair Box (1D & 2D Barcode Spec)
                Center(
                  child: Container(
                    width: 300,
                    height: 140,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.greenAccent, width: 3),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(color: Colors.greenAccent.withValues(alpha: 0.3), blurRadius: 10),
                      ],
                    ),
                  ),
                ),

                // Scan Instruction Banner
                Positioned(
                  top: 12,
                  left: 20,
                  right: 20,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.75),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      '📷 1D & 2D Barcodes Supported (Code 128, QR Code, Data Matrix, etc.)',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // BOTTOM 55%: REAL-TIME SCANNED INVENTORY MATCHED LIST
          Expanded(
            flex: 55,
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
              ),
              child: Column(
                children: [
                  // List Header
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.verified, size: 18, color: Colors.green),
                            const SizedBox(width: 6),
                            Text(
                              'Matched Stock Items (${_scannedItems.where((p) => p.isMatched).length})',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                          ],
                        ),
                        if (_scannedItems.isNotEmpty)
                          TextButton(
                            onPressed: () => setState(() {
                              _scannedItems.clear();
                              _processingSerials.clear();
                            }),
                            child: const Text('Clear All', style: TextStyle(color: Colors.red, fontSize: 12)),
                          ),
                      ],
                    ),
                  ),

                  // Scanned Barcodes List View
                  Expanded(
                    child: _scannedItems.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.qr_code_scanner, size: 48, color: Colors.grey.shade400),
                                const SizedBox(height: 8),
                                Text(
                                  'Point camera at 1D/2D Barcode or QR Code Sticker',
                                  style: TextStyle(color: Colors.grey.shade600, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            itemCount: _scannedItems.length,
                            itemBuilder: (context, index) {
                              final item = _scannedItems[index];
                              final isAvailable = item.status == 'AVAILABLE';

                              return Card(
                                margin: const EdgeInsets.only(bottom: 8),
                                elevation: 0,
                                color: item.isMatched ? Colors.green.shade50 : Colors.red.shade50,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  side: BorderSide(color: item.isMatched ? Colors.green.shade300 : Colors.red.shade300),
                                ),
                                child: ListTile(
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  leading: CircleAvatar(
                                    backgroundColor: Colors.white,
                                    child: Icon(
                                      item.isMatched ? Icons.check_circle : Icons.warning_amber_rounded,
                                      color: item.isMatched ? Colors.green.shade700 : Colors.red.shade700,
                                    ),
                                  ),
                                  title: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Expanded(
                                        child: Text(
                                          'Model: ${item.modelNumber}',
                                          style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            color: item.isMatched ? Colors.green.shade900 : Colors.red.shade900,
                                          ),
                                        ),
                                      ),
                                      Text(
                                        'Serial: ${item.serialNumber}',
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w500,
                                          color: Colors.grey.shade700,
                                        ),
                                      ),
                                    ],
                                  ),
                                  subtitle: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const SizedBox(height: 4),
                                      Text(
                                        item.isMatched
                                            ? '✓ MATCHED STOCK (${item.status})'
                                            : '❌ NOT IN INVENTORY (Removing in 1s...)',
                                        style: TextStyle(
                                          color: item.isMatched ? Colors.green.shade800 : Colors.red.shade800,
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                  trailing: IconButton(
                                    icon: const Icon(Icons.delete_outline, color: Colors.red, size: 20),
                                    onPressed: () => setState(() {
                                      _processingSerials.remove(_scannedItems[index].serialNumber);
                                      _scannedItems.removeAt(index);
                                    }),
                                  ),
                                ),
                              );
                            },
                          ),
                  ),

                  // Confirm & Attach Button
                  Padding(
                    padding: const EdgeInsets.all(12.0),
                    child: SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          backgroundColor: Theme.of(context).primaryColor,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () {
                          final matchedItems = _scannedItems.where((p) => p.isMatched).toList();
                          Navigator.pop(context, matchedItems);
                        },
                        child: Text(
                          'Confirm & Attach (${_scannedItems.where((p) => p.isMatched).length}) Matched Items',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                      ),
                    ),
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
