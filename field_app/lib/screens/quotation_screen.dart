import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';
import '../main.dart' show baseUrl;

class QuotationProductItem {
  int? productId;
  String name;
  double unitPrice;
  int quantity;
  String unit;

  QuotationProductItem({
    this.productId,
    required this.name,
    required this.unitPrice,
    required this.quantity,
    this.unit = 'Piece',
  });

  double get lineTotal => unitPrice * quantity;
}

class QuotationScreen extends StatefulWidget {
  final String customerName;
  final String mobileNumber;
  final String capacityKw;
  final List<dynamic>? initialProducts;

  const QuotationScreen({
    super.key,
    this.customerName = '',
    this.mobileNumber = '',
    this.capacityKw = '',
    this.initialProducts,
  });

  @override
  State<QuotationScreen> createState() => _QuotationScreenState();
}

class _QuotationScreenState extends State<QuotationScreen> {
  late TextEditingController _customerNameCtrl;
  late TextEditingController _mobileCtrl;
  late TextEditingController _capacityCtrl;
  late TextEditingController _discountCtrl;
  String _systemType = 'ON_GRID';

  List<QuotationProductItem> _items = [];
  bool _isGenerating = false;

  @override
  void initState() {
    super.initState();
    _customerNameCtrl = TextEditingController(text: widget.customerName);
    _mobileCtrl = TextEditingController(text: widget.mobileNumber);
    _capacityCtrl = TextEditingController(text: widget.capacityKw);
    _discountCtrl = TextEditingController(text: '0');

    // Auto-populate items from earlier step if provided
    if (widget.initialProducts != null && widget.initialProducts!.isNotEmpty) {
      for (var p in widget.initialProducts!) {
        String pName = p['name'] ?? p['product_code'] ?? 'Solar Item';
        double pPrice = (p['selling_price'] ?? p['unit_price'] ?? 0.0).toDouble();
        int pQty = (p['quantity'] ?? 1).toInt();
        _items.add(QuotationProductItem(
          productId: p['id'] != null ? p['id'] as int : null,
          name: pName,
          unitPrice: pPrice,
          quantity: pQty,
          unit: p['unit'] ?? 'Piece',
        ));
      }
    }

    // Default sample solar products if empty
    if (_items.isEmpty) {
      _items = [
        QuotationProductItem(name: 'Solar Panels (540W Mono PERC)', unitPrice: 18000, quantity: 10, unit: 'W'),
        QuotationProductItem(name: 'Growatt 5kW On-Grid Inverter', unitPrice: 42000, quantity: 1, unit: 'Piece'),
        QuotationProductItem(name: 'Galvanized Iron Structure (5kW)', unitPrice: 1500, quantity: 5, unit: 'KW'),
        QuotationProductItem(name: 'Earthing & Lightning Protection Kit', unitPrice: 8500, quantity: 1, unit: 'Set'),
        QuotationProductItem(name: 'ACDB & DCDB Junction Boxes', unitPrice: 6500, quantity: 1, unit: 'Set'),
      ];
    }
  }

  @override
  void dispose() {
    _customerNameCtrl.dispose();
    _mobileCtrl.dispose();
    _capacityCtrl.dispose();
    _discountCtrl.dispose();
    super.dispose();
  }

  double get _subtotal {
    return _items.fold(0.0, (sum, item) => sum + item.lineTotal);
  }

  double get _discount {
    return double.tryParse(_discountCtrl.text) ?? 0.0;
  }

  double get _gst {
    double taxable = (_subtotal - _discount).clamp(0.0, double.infinity);
    return (taxable * 0.18);
  }

  double get _grandTotal {
    double taxable = (_subtotal - _discount).clamp(0.0, double.infinity);
    return taxable + _gst;
  }

  void _addItem() {
    showDialog(
      context: context,
      builder: (context) {
        final nameCtrl = TextEditingController();
        final priceCtrl = TextEditingController();
        final qtyCtrl = TextEditingController(text: '1');

        return AlertDialog(
          title: const Text('Add Product to Quotation'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(labelText: 'Product Name / Description', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: priceCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Unit Price (₹)', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: qtyCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Quantity', border: OutlineInputBorder()),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () {
                final name = nameCtrl.text.trim();
                final price = double.tryParse(priceCtrl.text) ?? 0.0;
                final qty = int.tryParse(qtyCtrl.text) ?? 1;

                if (name.isNotEmpty) {
                  setState(() {
                    _items.add(QuotationProductItem(name: name, unitPrice: price, quantity: qty));
                  });
                  Navigator.pop(context);
                }
              },
              child: const Text('Add Item'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _generatePdfQuotation() async {
    if (_customerNameCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter Customer Name')));
      return;
    }

    setState(() => _isGenerating = true);
    try {
      final payload = {
        'customer_name': _customerNameCtrl.text.trim(),
        'mobile': _mobileCtrl.text.trim(),
        'capacity_kw': _capacityCtrl.text.trim(),
        'system_type': _systemType,
        'discount_amount': _discount,
        'items': _items.map((i) => {
          'product_id': i.productId,
          'description': i.name,
          'unit_price': i.unitPrice,
          'quantity': i.quantity,
          'unit': i.unit,
          'line_total': i.lineTotal,
        }).toList(),
      };

      final response = await ApiService.post(
        Uri.parse('$baseUrl/api/mobile/quotations'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final pdfPath = data['pdf_url'];
        final fullPdfUrl = '$baseUrl$pdfPath?print=true';

        if (await canLaunchUrl(Uri.parse(fullPdfUrl))) {
          await launchUrl(Uri.parse(fullPdfUrl), mode: LaunchMode.externalApplication);
        }

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Quotation generated successfully! PDF opened.')),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to generate quotation')));
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      setState(() => _isGenerating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Generate Solar Quotation'),
        backgroundColor: Colors.amber.shade800,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Customer Header Info Card
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Customer & Project Details', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _customerNameCtrl,
                      decoration: const InputDecoration(labelText: 'Customer Name *', border: OutlineInputBorder(), prefixIcon: Icon(Icons.person)),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _mobileCtrl,
                            keyboardType: TextInputType.phone,
                            decoration: const InputDecoration(labelText: 'Mobile Number', border: OutlineInputBorder(), prefixIcon: Icon(Icons.phone)),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextField(
                            controller: _capacityCtrl,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(labelText: 'Capacity (kW)', border: OutlineInputBorder(), prefixIcon: Icon(Icons.bolt)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Product Items List Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Selected Products & Pricing', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                ElevatedButton.icon(
                  onPressed: _addItem,
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Add Item'),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.blue.shade700, foregroundColor: Colors.white),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Product Cards List
            ..._items.asMap().entries.map((entry) {
              int idx = entry.key;
              QuotationProductItem item = entry.value;

              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              '${idx + 1}. ${item.name}',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete_outline, color: Colors.red),
                            onPressed: () {
                              setState(() => _items.removeAt(idx));
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            flex: 2,
                            child: TextFormField(
                              initialValue: item.unitPrice.toStringAsFixed(0),
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(
                                labelText: 'Price per Unit (₹)',
                                border: OutlineInputBorder(),
                                isDense: true,
                              ),
                              onChanged: (val) {
                                double? p = double.tryParse(val);
                                if (p != null) setState(() => item.unitPrice = p);
                              },
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            flex: 1,
                            child: TextFormField(
                              initialValue: item.quantity.toString(),
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(
                                labelText: 'Qty',
                                border: OutlineInputBorder(),
                                isDense: true,
                              ),
                              onChanged: (val) {
                                int? q = int.tryParse(val);
                                if (q != null && q > 0) setState(() => item.quantity = q);
                              },
                            ),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              const Text('Line Total', style: TextStyle(fontSize: 10, color: Colors.grey)),
                              Text(
                                '₹${item.lineTotal.toStringAsFixed(0)}',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.green),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            }),

            const SizedBox(height: 16),

            // Commercial Totals Summary Box
            Card(
              color: Colors.amber.shade50,
              shape: RoundedRectangleBorder(
                side: BorderSide(color: Colors.amber.shade400),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Subtotal:', style: TextStyle(fontSize: 14)),
                        Text('₹${_subtotal.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Text('Discount (₹):', style: TextStyle(fontSize: 14)),
                        const SizedBox(width: 12),
                        Expanded(
                          child: SizedBox(
                            height: 35,
                            child: TextField(
                              controller: _discountCtrl,
                              keyboardType: TextInputType.number,
                              textAlign: TextAlign.end,
                              decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true),
                              onChanged: (_) => setState(() {}),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('GST (18%):', style: TextStyle(fontSize: 14)),
                        Text('₹${_gst.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      ],
                    ),
                    const Divider(height: 20, thickness: 1.5, color: Colors.amber),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('GRAND TOTAL:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.brown)),
                        Text(
                          '₹${_grandTotal.toStringAsFixed(0)}',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: Colors.green.shade800),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Generate PDF Button
            ElevatedButton.icon(
              onPressed: _isGenerating ? null : _generatePdfQuotation,
              icon: _isGenerating
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Icon(Icons.picture_as_pdf, size: 24),
              label: Text(
                _isGenerating ? 'Generating PDF...' : 'GENERATE & EXPORT PDF QUOTATION',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: Colors.amber.shade900,
                foregroundColor: Colors.white,
                elevation: 4,
              ),
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }
}
