import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../services/api_service.dart';
import '../main.dart' show baseUrl;

// Re-using the utility from orders_screen if needed, or inline it
String extractSerialNumberFromBarcode(String input) {
  input = input.trim();
  if (input.contains('/')) {
    final parts = input.split('/');
    if (parts.isNotEmpty) {
      input = parts.last;
    }
  }
  return input;
}

class ScannedItem {
  final String serialNumber;
  final String modelNumber;
  final bool isMatched;
  final int? productId;

  ScannedItem({
    required this.serialNumber,
    required this.modelNumber,
    required this.isMatched,
    this.productId,
  });
}

class ChecklistItem {
  final int productId;
  final String productName;
  final int requiredQuantity;
  int scannedQuantity;

  ChecklistItem({
    required this.productId,
    required this.productName,
    required this.requiredQuantity,
    this.scannedQuantity = 0,
  });
}

class OrderDispatchScannerScreen extends StatefulWidget {
  final Map<String, dynamic> order;

  const OrderDispatchScannerScreen({super.key, required this.order});

  @override
  State<OrderDispatchScannerScreen> createState() => _OrderDispatchScannerScreenState();
}

class _OrderDispatchScannerScreenState extends State<OrderDispatchScannerScreen> {
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

  final List<ScannedItem> _scannedItems = [];
  final Set<String> _processingSerials = {};
  final Map<int, ChecklistItem> _checklist = {};

  bool _isSubmitting = false;

  final TextEditingController _vehicleNumberController = TextEditingController();
  final TextEditingController _driverNameController = TextEditingController();
  final TextEditingController _driverMobileController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Pre-fill serials if they were already added to the draft
    // 1. Build the checklist
    if (widget.order['items'] != null) {
      for (var item in widget.order['items']) {
        final category = item['category']?.toString() ?? '';
        final name = item['product_name']?.toString().toLowerCase() ?? '';
        
        // Only list items that likely need serials
        if (category == 'Solar Panels' || category == 'Inverters' || name.contains('panel') || name.contains('inverter')) {
          final pid = item['product_id'];
          if (pid != null) {
            _checklist[pid] = ChecklistItem(
              productId: pid,
              productName: item['product_name'] ?? 'Unknown',
              requiredQuantity: item['quantity'] ?? 0,
            );
          }
        }
      }
    }

    // 2. Pre-fill serials if they were already added to the draft
    if (widget.order['serials'] != null) {
      for (var s in widget.order['serials']) {
        final pid = s['product_id'];
        _scannedItems.add(ScannedItem(
          serialNumber: s['serial_number'],
          modelNumber: s['product_name'] ?? 'Unknown Model',
          isMatched: true,
          productId: pid,
        ));
        _processingSerials.add(s['serial_number']);
        
        // Update checklist progress for pre-filled serials
        if (pid != null) {
          if (_checklist.containsKey(pid)) {
            _checklist[pid]!.scannedQuantity++;
          } else {
            _checklist[pid] = ChecklistItem(
              productId: pid,
              productName: s['product_name'] ?? 'Unknown',
              requiredQuantity: 0,
              scannedQuantity: 1,
            );
          }
        }
      }
    }
    _vehicleNumberController.text = widget.order['vehicle_number'] ?? '';
    _driverNameController.text = widget.order['driver_name'] ?? '';
    _driverMobileController.text = widget.order['driver_mobile'] ?? '';
  }

  @override
  void dispose() {
    _controller.dispose();
    _vehicleNumberController.dispose();
    _driverNameController.dispose();
    _driverMobileController.dispose();
    super.dispose();
  }

  Future<void> _onBarcodeDetected(BarcodeCapture capture) async {
    for (final barcode in capture.barcodes) {
      final String? rawVal = barcode.rawValue?.trim();
      if (rawVal == null || rawVal.isEmpty) continue;

      final String serialNumber = extractSerialNumberFromBarcode(rawVal);
      if (serialNumber.isEmpty) continue;

      if (_scannedItems.any((p) => p.serialNumber == serialNumber || p.serialNumber == rawVal) ||
          _processingSerials.contains(serialNumber) ||
          _processingSerials.contains(rawVal)) {
        continue;
      }
      _processingSerials.add(serialNumber);

      SystemSound.play(SystemSoundType.click);
      HapticFeedback.mediumImpact();

      ScannedItem matchedItem = await _lookupInventoryStatus(serialNumber, rawInput: rawVal);

      if (!mounted) return;
      setState(() {
        _scannedItems.insert(0, matchedItem);
      });

      if (!matchedItem.isMatched) {
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

      if (list.isEmpty && rawInput != null && rawInput != serial && rawInput.isNotEmpty) {
        response = await ApiService.get(Uri.parse('$baseUrl/api/serial-numbers?search=${Uri.encodeComponent(rawInput)}'));
        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          list = data is List ? data : (data['serials'] ?? []);
        }
      }

      if (list.isNotEmpty) {
        var match = list.firstWhere(
          (item) => item['serial_number'] == serial || item['serial_number'] == rawInput,
          orElse: () => list.first,
        );
        return ScannedItem(
          serialNumber: match['serial_number'] ?? serial,
          modelNumber: match['product_name'] ?? match['model_number'] ?? 'Unknown Model',
          isMatched: true,
          productId: match['product_id'],
        );
      }
    } catch (e) {
      // Ignore
    }
    return ScannedItem(
      serialNumber: serial,
      modelNumber: 'Unknown',
      isMatched: false,
    );
  }

  Future<void> _submitDispatch() async {
    if (_scannedItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please scan at least one serial number.')));
      return;
    }

    setState(() => _isSubmitting = true);
    
    try {
      final serialsPayload = _scannedItems.map((item) => {
        'product_id': item.productId,
        'serial_number': item.serialNumber,
      }).toList();

      final body = {
        'vehicle_number': _vehicleNumberController.text.trim(),
        'driver_name': _driverNameController.text.trim(),
        'driver_mobile': _driverMobileController.text.trim(),
        'serials': serialsPayload,
      };

      final response = await ApiService.post(
        Uri.parse('$baseUrl/api/orders/${widget.order['id']}/dispatch'),
        body: body,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Order dispatched successfully!', style: TextStyle(color: Colors.white)), backgroundColor: Colors.green));
            Navigator.pop(context, true);
          }
        } else {
          throw Exception(data['error'] ?? 'Unknown error');
        }
      } else {
        throw Exception('Failed to dispatch order (HTTP ${response.statusCode})');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Dispatch Order ${widget.order['order_number'] ?? ''}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.flash_on),
            onPressed: () => _controller.toggleTorch(),
          ),
          IconButton(
            icon: const Icon(Icons.cameraswitch),
            onPressed: () => _controller.switchCamera(),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            flex: 3,
            child: Stack(
              children: [
                MobileScanner(
                  controller: _controller,
                  onDetect: _onBarcodeDetected,
                ),
                Positioned(
                  bottom: 16,
                  left: 16,
                  right: 16,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.black54,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'Point camera at Barcode / QR Code\nDuplicate scans are ignored',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            flex: 4,
            child: SingleChildScrollView(
              child: Column(
                children: [
                  if (_checklist.isNotEmpty)
                    Container(
                      margin: const EdgeInsets.all(8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.blue.shade200),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.checklist, color: Colors.blue),
                              SizedBox(width: 8),
                              Text('Required Scans', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.blue)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          ..._checklist.values.map((c) {
                            bool isComplete = c.scannedQuantity >= c.requiredQuantity && c.requiredQuantity > 0;
                            bool isOver = c.scannedQuantity > c.requiredQuantity;
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(child: Text(c.productName, style: const TextStyle(fontSize: 14))),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: isComplete ? Colors.green.shade100 : (isOver ? Colors.orange.shade100 : Colors.red.shade50),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text('${c.scannedQuantity} / ${c.requiredQuantity}', style: TextStyle(
                                      color: isComplete ? Colors.green.shade800 : (isOver ? Colors.orange.shade800 : Colors.red.shade800),
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    )),
                                  ),
                                ]
                              )
                            );
                          }).toList(),
                        ],
                      ),
                    ),
                  Container(
                    padding: const EdgeInsets.all(12),
                    color: Colors.grey.shade100,
                    child: Row(
                      children: [
                        const Icon(Icons.qr_code, color: Colors.black87),
                        const SizedBox(width: 8),
                        Text(
                          'Scanned Serials (${_scannedItems.length})',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                      ],
                    ),
                  ),
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _scannedItems.length,
                    itemBuilder: (context, index) {
                      final item = _scannedItems[index];
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: item.isMatched ? Colors.green.shade100 : Colors.red.shade100,
                          child: Icon(
                            item.isMatched ? Icons.check : Icons.close,
                            color: item.isMatched ? Colors.green : Colors.red,
                          ),
                        ),
                        title: Text(item.serialNumber, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text(item.modelNumber),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete, color: Colors.red),
                          onPressed: () {
                            setState(() {
                              _processingSerials.remove(item.serialNumber);
                              _scannedItems.removeAt(index);
                              if (item.productId != null && _checklist.containsKey(item.productId)) {
                                _checklist[item.productId]!.scannedQuantity--;
                              }
                            });
                          },
                        ),
                      );
                    },
                  ),
                  const Divider(),
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Dispatch Details', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _vehicleNumberController,
                          decoration: const InputDecoration(
                            labelText: 'Vehicle Number',
                            border: OutlineInputBorder(),
                            prefixIcon: Icon(Icons.local_shipping),
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _driverNameController,
                          decoration: const InputDecoration(
                            labelText: 'Driver Name',
                            border: OutlineInputBorder(),
                            prefixIcon: Icon(Icons.person),
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _driverMobileController,
                          decoration: const InputDecoration(
                            labelText: 'Driver Mobile',
                            border: OutlineInputBorder(),
                            prefixIcon: Icon(Icons.phone),
                          ),
                          keyboardType: TextInputType.phone,
                        ),
                        const SizedBox(height: 24),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            icon: _isSubmitting 
                              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Icon(Icons.check_circle),
                            label: const Text('Confirm Dispatch', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              backgroundColor: Colors.green.shade600,
                              foregroundColor: Colors.white,
                            ),
                            onPressed: _isSubmitting ? null : _submitDispatch,
                          ),
                        ),
                      ],
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
