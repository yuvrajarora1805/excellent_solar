import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:http/http.dart' as http;
import '../services/api_service.dart';
import '../main.dart' show baseUrl;

class ScannedInventoryItem {
  final String modelNumber;
  final String serialNumber;
  final String rawInput;
  bool hasError;
  String? errorMessage;
  String? productName;

  ScannedInventoryItem({
    required this.modelNumber,
    required this.serialNumber,
    required this.rawInput,
    this.hasError = false,
    this.errorMessage,
    this.productName,
  });
}

class ScanInventoryScreen extends StatefulWidget {
  const ScanInventoryScreen({super.key});

  @override
  State<ScanInventoryScreen> createState() => _ScanInventoryScreenState();
}

class _ScanInventoryScreenState extends State<ScanInventoryScreen> {
  final MobileScannerController _cameraController = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
  );
  
  final List<ScannedInventoryItem> _scannedItems = [];
  final Set<String> _processingSerials = {};
  bool _isSubmitting = false;

  @override
  void dispose() {
    _cameraController.dispose();
    super.dispose();
  }

  void _onBarcodeDetected(BarcodeCapture capture) {
    if (_isSubmitting) return;

    for (final barcode in capture.barcodes) {
      final String? rawVal = barcode.rawValue?.trim();
      if (rawVal == null || rawVal.isEmpty) continue;

      final parts = rawVal.split(' ');
      if (parts.length < 2) continue; // Invalid format for our QR

      final modelNumber = parts[0];
      final serialNumber = parts.sublist(1).join(' ');

      if (_processingSerials.contains(serialNumber)) continue;
      _processingSerials.add(serialNumber);

      SystemSound.play(SystemSoundType.click);
      HapticFeedback.mediumImpact();

      setState(() {
        _scannedItems.insert(0, ScannedInventoryItem(
          modelNumber: modelNumber,
          serialNumber: serialNumber,
          rawInput: rawVal,
        ));
      });
      
      _validateItem(modelNumber, serialNumber);
    }
  }

  Future<void> _validateItem(String modelNumber, String serialNumber) async {
    try {
      final response = await ApiService.post(
        Uri.parse('$baseUrl/api/mobile/inventory/validate-scan'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'model_number': modelNumber,
          'serial_number': serialNumber,
        }),
      );

      final data = jsonDecode(response.body);
      
      if (!mounted) return;
      
      setState(() {
        for (var item in _scannedItems) {
          if (item.serialNumber == serialNumber) {
            if (data['success'] == false) {
              item.hasError = true;
              item.errorMessage = data['error'];
            } else {
              item.hasError = false;
              item.errorMessage = null;
              item.productName = data['product_name'];
            }
          }
        }
        
        _scannedItems.sort((a, b) {
          int aError = a.hasError ? 1 : 0;
          int bError = b.hasError ? 1 : 0;
          return bError.compareTo(aError);
        });
      });
    } catch (e) {
      // Ignore background validation errors
    }
  }

  Future<void> _submitBulkScan() async {
    if (_scannedItems.isEmpty) return;

    setState(() => _isSubmitting = true);

    try {
      final itemsPayload = _scannedItems.map((item) => {
        'model_number': item.modelNumber,
        'serial_number': item.serialNumber,
      }).toList();

      final response = await ApiService.post(
        Uri.parse('$baseUrl/api/mobile/inventory/bulk-scan'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'items': itemsPayload}),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Added ${data['successCount']} items to inventory!'), backgroundColor: Colors.green),
        );
        setState(() {
          _scannedItems.clear();
          _processingSerials.clear();
        });
      } else {
        // Reset all item errors first
        for (var item in _scannedItems) {
          item.hasError = false;
          item.errorMessage = null;
        }

        bool needsNewProduct = false;
        String? missingModel;
        
        if (data['errors'] != null) {
          for (var err in data['errors']) {
            String errCode = err['code'] ?? '';
            String errMsg = err['error'] ?? 'Unknown error';
            var errItem = err['item'];
            
            if (errItem != null) {
              String sNum = errItem['serial_number'];
              // Map error to specific scanned item
              for (var item in _scannedItems) {
                if (item.serialNumber == sNum) {
                  item.hasError = true;
                  item.errorMessage = errMsg;
                }
              }
            }

            if (errCode == 'PRODUCT_NOT_FOUND') {
              needsNewProduct = true;
              missingModel = err['item']['model_number'];
            }
          }
        }

        _scannedItems.sort((a, b) {
          int aError = a.hasError ? 1 : 0;
          int bError = b.hasError ? 1 : 0;
          return bError.compareTo(aError);
        });

        setState(() {}); // Update UI to show red items

        if (needsNewProduct && missingModel != null) {
          _showCreateProductPopup(missingModel);
        } else {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(data['error'] ?? 'Some items failed to save. Please review the list.'), backgroundColor: Colors.red),
          );
        }
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _showCreateProductPopup(String modelNumber) async {
    // Hardcoded list of categories to match the web app exactly
    List<String> categories = [
      'Solar Panel',
      'Inverter',
      'Structure',
      'Cable',
      'Connector',
      'Earthing',
      'ACDB/DCDB',
      'Breaker',
      'Accessories'
    ];
    
    List<dynamic> existingProducts = [];
    try {
      final pRes = await ApiService.get(Uri.parse('$baseUrl/api/inventory/products'));
      if (pRes.statusCode == 200) {
        existingProducts = jsonDecode(pRes.body);
      }
    } catch (e) {
      debugPrint('Error fetching data: $e');
    }

    if (!mounted) return;

    String selectedCategory = categories.first;
    bool isNewCategory = false;
    final TextEditingController newCatController = TextEditingController();
    final TextEditingController nameController = TextEditingController();
    final TextEditingController brandController = TextEditingController();
    
    bool isMapping = existingProducts.isNotEmpty;
    String? selectedExistingModel = existingProducts.isNotEmpty ? existingProducts.first['model'] : null;

    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: Text('Model Not Found: $modelNumber'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text('This product model does not exist. Choose an action:'),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: RadioListTile<bool>(
                            title: const Text('Map to Existing', style: TextStyle(fontSize: 13)),
                            value: true,
                            groupValue: isMapping,
                            onChanged: existingProducts.isEmpty ? null : (val) => setDialogState(() => isMapping = val!),
                            contentPadding: EdgeInsets.zero,
                          ),
                        ),
                        Expanded(
                          child: RadioListTile<bool>(
                            title: const Text('Create New', style: TextStyle(fontSize: 13)),
                            value: false,
                            groupValue: isMapping,
                            onChanged: (val) => setDialogState(() => isMapping = val!),
                            contentPadding: EdgeInsets.zero,
                          ),
                        ),
                      ],
                    ),
                    const Divider(),
                    if (isMapping) ...[
                      const Text('Select an existing product to map this scan to:'),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        isExpanded: true,
                        value: selectedExistingModel,
                        items: existingProducts.map((p) => DropdownMenuItem<String>(
                          value: p['model'] ?? p['product_code'],
                          child: Text('${p['name']} (${p['model'] ?? p['product_code']})', overflow: TextOverflow.ellipsis),
                        )).toList(),
                        onChanged: (val) {
                          if (val != null) setDialogState(() => selectedExistingModel = val);
                        },
                        decoration: const InputDecoration(labelText: 'Existing Product', border: OutlineInputBorder()),
                      ),
                    ] else ...[
                      TextField(
                        controller: nameController,
                        decoration: const InputDecoration(labelText: 'Product Name', border: OutlineInputBorder()),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: brandController,
                        decoration: const InputDecoration(labelText: 'Brand', border: OutlineInputBorder()),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Checkbox(
                            value: isNewCategory,
                            onChanged: (val) {
                              setDialogState(() => isNewCategory = val ?? false);
                            },
                          ),
                          const Text('Add New Category?'),
                        ],
                      ),
                      if (isNewCategory)
                        TextField(
                          controller: newCatController,
                          decoration: const InputDecoration(labelText: 'New Category Name', border: OutlineInputBorder()),
                        )
                      else
                        DropdownButtonFormField<String>(
                          value: selectedCategory,
                          items: categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                          onChanged: (val) {
                            if (val != null) setDialogState(() => selectedCategory = val);
                          },
                          decoration: const InputDecoration(labelText: 'Category', border: OutlineInputBorder()),
                        ),
                    ],
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.pop(context);
                  },
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () async {
                    if (isMapping) {
                      if (selectedExistingModel == null) return;
                      // Update scanned items to map to existing model
                      for (int i = 0; i < _scannedItems.length; i++) {
                        if (_scannedItems[i].modelNumber == modelNumber) {
                          _scannedItems[i] = ScannedInventoryItem(
                            modelNumber: selectedExistingModel!,
                            serialNumber: _scannedItems[i].serialNumber,
                            rawInput: _scannedItems[i].rawInput,
                            productName: _scannedItems[i].productName,
                          );
                        }
                      }
                      Navigator.pop(context);
                      _submitBulkScan();
                    } else {
                      String finalCat = isNewCategory ? newCatController.text.trim() : selectedCategory;
                      if (finalCat.isEmpty) return;

                      final payload = {
                        'model_number': modelNumber,
                        'category': finalCat,
                        'name': nameController.text.trim(),
                        'brand': brandController.text.trim(),
                      };

                      final res = await ApiService.post(
                        Uri.parse('$baseUrl/api/mobile/products/create'),
                        headers: {'Content-Type': 'application/json'},
                        body: jsonEncode(payload),
                      );

                      if (res.statusCode == 200 || res.statusCode == 201) {
                        Navigator.pop(context);
                        // Retry the bulk submission now that it's registered
                        _submitBulkScan();
                      } else {
                        final errData = jsonDecode(res.body);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(errData['error'] ?? 'Failed to create product'), backgroundColor: Colors.red),
                        );
                      }
                    }
                  },
                  child: Text(isMapping ? 'Map & Continue' : 'Create & Continue'),
                ),
              ],
            );
          }
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Inventory Multi-Scan'),
        actions: [
          if (_scannedItems.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.check_circle),
              color: Colors.green,
              onPressed: _isSubmitting ? null : _submitBulkScan,
            ),
        ],
      ),
      body: Column(
        children: [
          // Camera View
          SizedBox(
            height: 250,
            child: MobileScanner(
              controller: _cameraController,
              onDetect: _onBarcodeDetected,
            ),
          ),
          
          // Header for list
          Container(
            padding: const EdgeInsets.all(12),
            color: Colors.grey.shade200,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('${_scannedItems.length} items scanned', style: const TextStyle(fontWeight: FontWeight.bold)),
                if (_scannedItems.isNotEmpty)
                  ElevatedButton(
                    onPressed: _isSubmitting ? null : _submitBulkScan,
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.blue, foregroundColor: Colors.white),
                    child: _isSubmitting ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Submit All'),
                  ),
              ],
            ),
          ),

          // List of scanned items
          Expanded(
            child: _scannedItems.isEmpty
                ? const Center(child: Text('Point camera at QR codes to scan.'))
                : ListView.builder(
                    itemCount: _scannedItems.length,
                    itemBuilder: (context, index) {
                      final item = _scannedItems[index];
                      return ListTile(
                        tileColor: item.hasError ? Colors.red.shade50 : null,
                        leading: Icon(Icons.qr_code, color: item.hasError ? Colors.red : Colors.blue),
                        title: Text('${item.productName ?? 'Unknown Product'} - Model: ${item.modelNumber}'),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Serial: ${item.serialNumber}'),
                            if (item.hasError && item.errorMessage != null)
                              Text(
                                item.errorMessage!,
                                style: const TextStyle(color: Colors.red, fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                          ],
                        ),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete, color: Colors.red),
                          onPressed: () {
                            setState(() {
                              _scannedItems.removeAt(index);
                              _processingSerials.remove(item.serialNumber);
                            });
                          },
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
