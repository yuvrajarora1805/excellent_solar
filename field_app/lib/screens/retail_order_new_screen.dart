import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../services/api_service.dart';
import '../main.dart';

class RetailOrderNewScreen extends StatefulWidget {
  final int? initialDraftId;
  const RetailOrderNewScreen({Key? key, this.initialDraftId}) : super(key: key);

  @override
  _RetailOrderNewScreenState createState() => _RetailOrderNewScreenState();
}

class _RetailOrderNewScreenState extends State<RetailOrderNewScreen> {
  final _formKey = GlobalKey<FormState>();
  
  String _customerName = '';
  String _customerMobile = '';
  String _customerAddress = '';
  
  List<dynamic> _products = [];
  List<dynamic> _customers = [];
  bool _isLoading = false;
  
  // order items list
  List<Map<String, dynamic>> _orderItems = [];
  
  // controllers for dealer details auto-fill
  final _mobileController = TextEditingController();
  final _addressController = TextEditingController();

  // current item inputs
  String _productInput = '';
  int? _selectedProductId;
  int _quantity = 1;
  double _unitPrice = 0.0;
  int? _selectedCustomerId;

  @override
  void initState() {
    super.initState();
    _fetchProducts();
    _fetchCustomers();
    if (widget.initialDraftId != null) {
      _fetchDraftDetails(widget.initialDraftId!);
    }
  }

  Future<void> _fetchDraftDetails(int draftId) async {
    setState(() => _isLoading = true);
    try {
      final response = await ApiService.get(Uri.parse('$baseUrl/api/orders/$draftId'));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['order'] != null) {
          final order = data['order'];
          setState(() {
            _customerName = order['customer_name']?.toString() ?? '';
            _customerMobile = order['customer_mobile']?.toString() ?? '';
            _customerAddress = order['delivery_address']?.toString() ?? '';
            _selectedCustomerId = order['customer_id'];
            _mobileController.text = _customerMobile;
            _addressController.text = _customerAddress;
            
            if (order['items'] != null) {
              for (var item in order['items']) {
                _orderItems.add({
                  'product_id': item['product_id'],
                  'product_name': item['product_name'] ?? item['products']?['name'] ?? 'Unknown',
                  'quantity': item['quantity'],
                  'unit_price': (item['unit_price'] as num).toDouble(),
                  'line_total': (item['line_total'] as num).toDouble(),
                  'is_custom': item['product_id'] == null,
                });
              }
            }
          });
        }
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to load draft: $e')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _mobileController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _fetchCustomers() async {
    try {
      final response = await ApiService.get(Uri.parse('$baseUrl/api/customers?customer_type=RETAIL&limit=1000'));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is Map && data['customers'] != null) {
          setState(() {
            _customers = data['customers'];
          });
        }
      }
    } catch (e) {
      print('Error fetching customers: $e');
    }
  }

  Future<void> _fetchProducts() async {
    try {
      final response = await ApiService.get(Uri.parse('$baseUrl/api/inventory/products'));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is Map) {
          setState(() {
            _products = data['products'] ?? [];
          });
        } else if (data is List) {
          setState(() {
            _products = data;
          });
        }
      }
    } catch (e) {
      print('Error fetching products: $e');
    }
  }

  void _addOrderItem() {
    final nameStr = _productInput.trim();
    if (nameStr.isEmpty) return;

    // Check if it exactly matches an existing product
    final existing = _products.firstWhere(
      (p) => p['name']?.toString().toLowerCase() == nameStr.toLowerCase(),
      orElse: () => null,
    );

    final prodId = existing != null ? existing['id'] : null;
    final finalName = existing != null ? existing['name'] : nameStr;

    setState(() {
      int existingIndex = _orderItems.indexWhere((item) =>
          (prodId != null && item['product_id'] == prodId) ||
          (prodId == null && item['product_name'] == finalName));

      if (existingIndex >= 0) {
        _orderItems[existingIndex]['quantity'] = (_orderItems[existingIndex]['quantity'] as num) + _quantity;
        // Optionally update unit_price if it's different, but typically we keep the existing or overwrite. We'll just update line_total.
        _orderItems[existingIndex]['unit_price'] = _unitPrice; // Use the newest unit price entered
        _orderItems[existingIndex]['line_total'] = (_orderItems[existingIndex]['quantity'] as num) * _unitPrice;
      } else {
        _orderItems.add({
          'product_id': prodId,
          'product_name': finalName,
          'quantity': _quantity,
          'unit_price': _unitPrice,
          'line_total': _quantity * _unitPrice,
          'is_custom': prodId == null,
        });
      }
      
      _productInput = '';
      _selectedProductId = null;
      _quantity = 1;
      _unitPrice = 0.0;
    });
  }

  Future<void> _submitOrder(bool isDraft) async {
    if (!_formKey.currentState!.validate()) return;
    if (_orderItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please add at least one material/product.')),
      );
      return;
    }

    _formKey.currentState!.save();
    
    double totalAmount = _orderItems.fold(0.0, (sum, item) => sum + (item['line_total'] as double));

    setState(() => _isLoading = true);
    
    try {
      final body = {
        'customer_id': _selectedCustomerId,
        'customer_name': _customerName,
        'customer_mobile': _customerMobile,
        'delivery_address': _customerAddress,
        'total_amount': totalAmount,
        'is_draft': isDraft,
        'status': isDraft ? 'DRAFT' : 'PENDING_DISPATCH',
        'order_type': 'RETAIL',
        'items': _orderItems,
      };

      if (widget.initialDraftId != null) {
        body['isDraftEdit'] = true;
        body['dispatchImmediately'] = !isDraft; // if it's not a draft, dispatch it? No, retail orders don't dispatch immediately here, they go to pending ticket unless we change it. Wait, the retail requirement API creates a draft or pending ticket. Let's just use PUT /api/orders.
      }
      
      final url = widget.initialDraftId != null 
          ? Uri.parse('$baseUrl/api/orders/${widget.initialDraftId}')
          : Uri.parse('$baseUrl/api/orders/retail/requirement');
          
      final response = widget.initialDraftId != null 
          ? await ApiService.put(url, body: body)
          : await ApiService.post(url, body: body);
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        if (data['success'] == true || data['id'] != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(widget.initialDraftId != null ? 'Retail requirement updated!' : 'Retail requirement created!')),
          );
          Navigator.pop(context, true); // return true to indicate success
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(data['error'] ?? 'Failed to save order')),
          );
        }
      } else {
        try {
          final data = jsonDecode(response.body);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(data['error'] ?? 'Failed to save order')),
          );
        } catch (_) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to save order (HTTP ${response.statusCode})')),
          );
        }
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Raise Retail Order'),
        backgroundColor: const Color(0xFF7C5800),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Dealer Details
                    const Text('1. Dealer Details', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 8),
                    Autocomplete<Map<String, dynamic>>(
                      initialValue: TextEditingValue(text: _customerName),
                      optionsBuilder: (TextEditingValue textEditingValue) {
                        if (textEditingValue.text.isEmpty) return const Iterable<Map<String, dynamic>>.empty();
                        return _customers.whereType<Map<String, dynamic>>().where((c) => c['name']?.toString().toLowerCase().contains(textEditingValue.text.toLowerCase()) ?? false);
                      },
                      displayStringForOption: (Map<String, dynamic> option) => option['name']?.toString() ?? '',
                      onSelected: (Map<String, dynamic> selection) {
                        setState(() {
                          _selectedCustomerId = selection['id'];
                          _customerName = selection['name']?.toString() ?? '';
                          _mobileController.text = selection['mobile']?.toString() ?? '';
                          _addressController.text = selection['address']?.toString() ?? '';
                        });
                      },
                      fieldViewBuilder: (context, textEditingController, focusNode, onFieldSubmitted) {
                        return TextFormField(
                          controller: textEditingController,
                          focusNode: focusNode,
                          decoration: const InputDecoration(
                            labelText: 'Dealer / Walk-in Name *',
                            hintText: 'Search or type new dealer...',
                            border: OutlineInputBorder(),
                          ),
                          validator: (val) => val == null || val.trim().isEmpty ? 'Required' : null,
                          onChanged: (val) {
                            _customerName = val;
                            _selectedCustomerId = null;
                          },
                          onSaved: (val) => _customerName = val?.trim() ?? '',
                        );
                      },
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _mobileController,
                      decoration: const InputDecoration(labelText: 'Mobile Number', border: OutlineInputBorder()),
                      keyboardType: TextInputType.phone,
                      onChanged: (val) => _customerMobile = val.trim(),
                      onSaved: (val) { if(val != null) _customerMobile = val.trim(); else _customerMobile = _mobileController.text.trim(); },
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _addressController,
                      decoration: const InputDecoration(labelText: 'Address', border: OutlineInputBorder()),
                      maxLines: 2,
                      onChanged: (val) => _customerAddress = val.trim(),
                      onSaved: (val) { if(val != null) _customerAddress = val.trim(); else _customerAddress = _addressController.text.trim(); },
                    ),
                    const SizedBox(height: 24),

                    // Product Details
                    const Text('2. Product Requirements', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 8),
                    
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        border: Border.all(color: Colors.grey.shade300),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        children: [
                          Autocomplete<Map<String, dynamic>>(
                            optionsBuilder: (TextEditingValue textEditingValue) {
                              if (textEditingValue.text.isEmpty) return const Iterable<Map<String, dynamic>>.empty();
                              return _products.whereType<Map<String, dynamic>>().where((p) => p['name']?.toString().toLowerCase().contains(textEditingValue.text.toLowerCase()) ?? false);
                            },
                            displayStringForOption: (Map<String, dynamic> option) => option['name']?.toString() ?? '',
                            onSelected: (Map<String, dynamic> selection) {
                              setState(() {
                                _productInput = selection['name']?.toString() ?? '';
                                _selectedProductId = selection['id'];
                                _unitPrice = double.tryParse(selection['selling_price']?.toString() ?? '0') ?? 0.0;
                              });
                            },
                            fieldViewBuilder: (context, textEditingController, focusNode, onFieldSubmitted) {
                              return TextField(
                                controller: textEditingController,
                                focusNode: focusNode,
                                decoration: const InputDecoration(
                                  labelText: 'Type Material or Select',
                                  hintText: 'e.g. 5kW Inverter or Custom Wire',
                                  filled: true,
                                  fillColor: Colors.white,
                                  border: const OutlineInputBorder(),
                                ),
                                onChanged: (val) => _productInput = val,
                              );
                            },
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: TextFormField(
                                  initialValue: _quantity.toString(),
                                  decoration: const InputDecoration(labelText: 'Qty', filled: true, fillColor: Colors.white, border: const OutlineInputBorder()),
                                  keyboardType: TextInputType.number,
                                  onChanged: (val) => _quantity = int.tryParse(val) ?? 1,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: TextFormField(
                                  key: ValueKey('price_$_selectedProductId'),
                                  initialValue: _unitPrice.toString(),
                                  decoration: const InputDecoration(labelText: 'Price/Unit', filled: true, fillColor: Colors.white, border: const OutlineInputBorder()),
                                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                  onChanged: (val) => _unitPrice = double.tryParse(val) ?? 0.0,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: _addOrderItem,
                              icon: const Icon(Icons.add),
                              label: const Text('Add Product'),
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.blueGrey, foregroundColor: Colors.white),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),
                    if (_orderItems.isNotEmpty)
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _orderItems.length,
                        itemBuilder: (context, idx) {
                          final item = _orderItems[idx];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              title: Row(
                                children: [
                                  Text(item['product_name']),
                                  if (item['is_custom'] == true) ...[
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(color: Colors.orange.shade100, borderRadius: BorderRadius.circular(4)),
                                      child: Text('CUSTOM', style: TextStyle(fontSize: 10, color: Colors.orange.shade800, fontWeight: FontWeight.bold)),
                                    ),
                                  ],
                                ],
                              ),
                              subtitle: Text('${item['quantity']} x ₹${item['unit_price']}  =  ₹${item['line_total']}'),
                              trailing: IconButton(
                                icon: const Icon(Icons.delete, color: Colors.red),
                                onPressed: () {
                                  setState(() {
                                    _orderItems.removeAt(idx);
                                  });
                                },
                              ),
                            ),
                          );
                        },
                      ),

                    const SizedBox(height: 40),
                    Row(
                      children: [
                        Expanded(
                          child: SizedBox(
                            height: 50,
                            child: ElevatedButton(
                              onPressed: () => _submitOrder(true),
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.grey.shade200, foregroundColor: Colors.black87, elevation: 0),
                              child: const Text('Save Draft', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: SizedBox(
                            height: 50,
                            child: ElevatedButton(
                              onPressed: () => _submitOrder(false),
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                              child: const Text('Send to Office', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
    );
  }
}
