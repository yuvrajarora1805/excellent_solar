import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../main.dart' show baseUrl;

class AddProductScreen extends StatefulWidget {
  const AddProductScreen({super.key});

  @override
  State<AddProductScreen> createState() => _AddProductScreenState();
}

class _AddProductScreenState extends State<AddProductScreen> {
  final _formKey = GlobalKey<FormState>();
  
  bool _isLoading = false;
  String _category = 'Solar Panel';
  String _unit = 'Piece';
  
  final _productCodeController = TextEditingController();
  final _customCategoryController = TextEditingController();
  final _nameController = TextEditingController();
  final _brandController = TextEditingController();
  final _modelController = TextEditingController();
  final _specController = TextEditingController();
  final _minStockController = TextEditingController(text: '0');
  final _currStockController = TextEditingController(text: '0');
  final _sellingPriceController = TextEditingController(text: '0');

  final List<String> _categories = [
    'Solar Panel',
    'Inverter',
    'Structure',
    'Cable',
    'Connector',
    'Earthing',
    'ACDB/DCDB',
    'Breaker',
    'Accessories',
    'CUSTOM'
  ];

  final List<String> _units = ['Piece', 'Meter', 'Kg', 'Set'];

  @override
  void dispose() {
    _productCodeController.dispose();
    _customCategoryController.dispose();
    _nameController.dispose();
    _brandController.dispose();
    _modelController.dispose();
    _specController.dispose();
    _minStockController.dispose();
    _currStockController.dispose();
    _sellingPriceController.dispose();
    super.dispose();
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;
    
    String finalCategory = _category == 'CUSTOM' ? _customCategoryController.text.trim() : _category;
    if (finalCategory.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Custom category name is required'), backgroundColor: Colors.red));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final payload = {
        'product_code': _productCodeController.text.trim(),
        'name': _nameController.text.trim(),
        'category': finalCategory,
        'brand': _brandController.text.trim(),
        'model': _modelController.text.trim(),
        'specification': _specController.text.trim(),
        'unit': _unit,
        'minimum_stock': int.tryParse(_minStockController.text) ?? 0,
        'current_stock': int.tryParse(_currStockController.text) ?? 0,
        'selling_price': double.tryParse(_sellingPriceController.text) ?? 0.0,
      };

      final response = await ApiService.post(
        Uri.parse('$baseUrl/api/inventory/products'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 201 || response.statusCode == 200) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Product created successfully!'), backgroundColor: Colors.green),
        );
        Navigator.pop(context, true); // Return true to indicate success
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(data['error'] ?? 'Failed to create product'), backgroundColor: Colors.red),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add New Product'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16.0),
          children: [
            const Text('Product Information', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            
            TextFormField(
              controller: _productCodeController,
              decoration: const InputDecoration(labelText: 'Product Code *', border: OutlineInputBorder()),
              validator: (value) => value == null || value.trim().isEmpty ? 'Product code is required' : null,
            ),
            const SizedBox(height: 16),
            
            DropdownButtonFormField<String>(
              value: _category,
              decoration: const InputDecoration(labelText: 'Category *', border: OutlineInputBorder()),
              items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c == 'CUSTOM' ? '+ Add New Custom Category...' : c))).toList(),
              onChanged: (val) {
                if (val != null) setState(() => _category = val);
              },
            ),
            
            if (_category == 'CUSTOM') ...[
              const SizedBox(height: 8),
              TextFormField(
                controller: _customCategoryController,
                decoration: const InputDecoration(labelText: 'Custom Category Name *', border: OutlineInputBorder()),
                validator: (value) => _category == 'CUSTOM' && (value == null || value.trim().isEmpty) ? 'Required' : null,
              ),
            ],
            const SizedBox(height: 16),
            
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Product Name *', border: OutlineInputBorder()),
              validator: (value) => value == null || value.trim().isEmpty ? 'Product name is required' : null,
            ),
            const SizedBox(height: 16),
            
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _brandController,
                    decoration: const InputDecoration(labelText: 'Brand', border: OutlineInputBorder()),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _modelController,
                    decoration: const InputDecoration(labelText: 'Model', border: OutlineInputBorder()),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            TextFormField(
              controller: _specController,
              decoration: const InputDecoration(labelText: 'Specification', border: OutlineInputBorder()),
              maxLines: 3,
            ),
            const SizedBox(height: 16),
            
            DropdownButtonFormField<String>(
              value: _unit,
              decoration: const InputDecoration(labelText: 'Unit', border: OutlineInputBorder()),
              items: _units.map((u) => DropdownMenuItem(value: u, child: Text(u))).toList(),
              onChanged: (val) {
                if (val != null) setState(() => _unit = val);
              },
            ),
            const SizedBox(height: 16),
            
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _minStockController,
                    decoration: const InputDecoration(labelText: 'Minimum Stock', border: OutlineInputBorder()),
                    keyboardType: TextInputType.number,
                    validator: (value) => int.tryParse(value ?? '') == null ? 'Invalid' : null,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _currStockController,
                    decoration: const InputDecoration(labelText: 'Current Stock', border: OutlineInputBorder()),
                    keyboardType: TextInputType.number,
                    validator: (value) => int.tryParse(value ?? '') == null ? 'Invalid' : null,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            TextFormField(
              controller: _sellingPriceController,
              decoration: const InputDecoration(labelText: 'Selling Price (₹)', border: OutlineInputBorder()),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
            ),
            const SizedBox(height: 24),
            
            SizedBox(
              height: 50,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _submitForm,
                style: ElevatedButton.styleFrom(backgroundColor: Colors.blue, foregroundColor: Colors.white),
                child: _isLoading 
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Create Product', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}
