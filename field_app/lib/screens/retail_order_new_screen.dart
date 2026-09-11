import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class RetailOrderNewScreen extends StatefulWidget {
  const RetailOrderNewScreen({Key? key}) : super(key: key);

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

  @override
  void initState() {
    super.initState();
    _fetchProducts();
    _fetchCustomers();
  }

  @override
  void dispose() {
    _mobileController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _fetchCustomers() async {
    try {
      final response = await ApiService.get('/api/customers?customer_type=RETAIL&limit=1000');
      if (response != null && response is Map && response['customers'] != null) {
        setState(() {
          _customers = response['customers'];
        });
      }
    } catch (e) {
      print('Error fetching customers: $e');
    }
  }

  Future<void> _fetchProducts() async {
    try {
      final response = await ApiService.get('/api/inventory/products');
      if (response != null && response is Map) {
        setState(() {
          _products = response['products'] ?? [];
        });
      } else if (response is List) {
        setState(() {
          _products = response;
        });
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
      _orderItems.add({
        'product_id': prodId,
        'product_name': finalName,
        'quantity': _quantity,
        'unit_price': _unitPrice,
        'line_total': _quantity * _unitPrice,
        'is_custom': prodId == null,
      });
      
      _productInput = '';
      _selectedProductId = null;
      _quantity = 1;
      _unitPrice = 0.0;
    });
  }

  Future<void> _submitOrder() async {
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
        'customer_id': null,
        'customer_name': _customerName,
        'customer_mobile': _customerMobile,
        'delivery_address': _customerAddress,
        'total_amount': totalAmount,
        'items': _orderItems,
      };
      
      final response = await ApiService.post('/api/orders/retail/requirement', body: body);
      
      if (response != null && response['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Retail requirement created!')),
        );
        Navigator.pop(context, true); // return true to indicate success
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(response?['error'] ?? 'Failed to create order')),
        );
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
                    Autocomplete<dynamic>(
                      optionsBuilder: (TextEditingValue textEditingValue) {
                        if (textEditingValue.text.isEmpty) return const Iterable<dynamic>.empty();
                        return _customers.where((c) => c['name']?.toString().toLowerCase().contains(textEditingValue.text.toLowerCase()) ?? false);
                      },
                      displayStringForOption: (dynamic option) => option['name']?.toString() ?? '',
                      onSelected: (dynamic selection) {
                        setState(() {
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
                          onChanged: (val) => _customerName = val,
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
                          Autocomplete<dynamic>(
                            optionsBuilder: (TextEditingValue textEditingValue) {
                              if (textEditingValue.text.isEmpty) return const Iterable<dynamic>.empty();
                              return _products.where((p) => p['name']?.toString().toLowerCase().contains(textEditingValue.text.toLowerCase()) ?? false);
                            },
                            displayStringForOption: (dynamic option) => option['name']?.toString() ?? '',
                            onSelected: (dynamic selection) {
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
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _submitOrder,
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                        child: const Text('Send to Office', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      ),
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
    );
  }
}
