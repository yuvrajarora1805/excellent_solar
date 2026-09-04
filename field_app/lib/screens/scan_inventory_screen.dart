import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:http/http.dart' as http;
import '../services/api_service.dart';
import '../main.dart' show baseUrl;

class ScanInventoryScreen extends StatefulWidget {
  const ScanInventoryScreen({super.key});

  @override
  State<ScanInventoryScreen> createState() => _ScanInventoryScreenState();
}

class _ScanInventoryScreenState extends State<ScanInventoryScreen> {
  MobileScannerController cameraController = MobileScannerController();
  bool _isProcessing = false;
  String _statusMessage = 'Point camera at QR code';

  @override
  void dispose() {
    cameraController.dispose();
    super.dispose();
  }

  Future<void> _processBarcode(String barcode) async {
    if (_isProcessing) return;
    setState(() {
      _isProcessing = true;
      _statusMessage = 'Processing code: $barcode';
    });

    try {
      // Decode the QR format: <ModelNumber> <SerialNumber>
      final parts = barcode.trim().split(' ');
      if (parts.length < 2) {
        setState(() {
          _statusMessage = 'Invalid QR format. Expected "MODEL SERIAL"';
          _isProcessing = false;
        });
        return;
      }

      final modelNumber = parts[0];
      final serialNumber = parts.sublist(1).join(' ');

      final response = await ApiService.post(
        Uri.parse('$baseUrl/api/mobile/inventory/scan'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'model_number': modelNumber,
          'serial_number': serialNumber,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Inventory added successfully!'), backgroundColor: Colors.green),
        );
        setState(() {
          _statusMessage = 'Success! Point at next QR.';
        });
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(data['error'] ?? 'Failed to add inventory'), backgroundColor: Colors.red),
        );
        setState(() {
          _statusMessage = 'Failed. Try again.';
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
      setState(() {
        _statusMessage = 'Error occurred. Try again.';
      });
    } finally {
      // Wait a moment before allowing the next scan
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) {
        setState(() {
          _isProcessing = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan Inventory QR'),
      ),
      body: Column(
        children: <Widget>[
          Expanded(
            flex: 4,
            child: MobileScanner(
              controller: cameraController,
              onDetect: (capture) {
                final List<Barcode> barcodes = capture.barcodes;
                if (barcodes.isNotEmpty) {
                  final String? code = barcodes.first.rawValue;
                  if (code != null) {
                    _processBarcode(code);
                  }
                }
              },
            ),
          ),
          Expanded(
            flex: 1,
            child: Container(
              color: Colors.white,
              width: double.infinity,
              padding: const EdgeInsets.all(16.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    _statusMessage,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    textAlign: TextAlign.center,
                  ),
                  if (_isProcessing)
                    const Padding(
                      padding: EdgeInsets.only(top: 10),
                      child: CircularProgressIndicator(),
                    )
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}
