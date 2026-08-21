import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import '../main.dart' show baseUrl;

class Product {
  final int id;
  final String productCode;
  final String name;
  final String category;
  final String brand;
  final String model;
  final String unit;
  final int availableStock;

  Product({
    required this.id,
    required this.productCode,
    required this.name,
    required this.category,
    required this.brand,
    required this.model,
    required this.unit,
    required this.availableStock,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    int stock = 0;
    if (json['available_stock'] != null) {
      stock = int.tryParse(json['available_stock'].toString()) ?? 0;
    } else if (json['current_stock'] != null) {
      stock = int.tryParse(json['current_stock'].toString()) ?? 0;
    }
    
    return Product(
      id: json['id'],
      productCode: json['product_code'] ?? '',
      name: json['name'] ?? '',
      category: json['category'] ?? '',
      brand: json['brand'] ?? '',
      model: json['model'] ?? '',
      unit: json['unit'] ?? 'Piece',
      availableStock: stock,
    );
  }
}

class SelectedProduct {
  final Product product;
  int quantity;

  SelectedProduct({required this.product, required this.quantity});

  Map<String, dynamic> toJson() => {
        'product_id': product.id,
        'quantity': quantity,
      };
}

class ProductPickerScreen extends StatefulWidget {
  final List<SelectedProduct> initialSelection;

  const ProductPickerScreen({super.key, this.initialSelection = const []});

  @override
  State<ProductPickerScreen> createState() => _ProductPickerScreenState();
}

class _ProductPickerScreenState extends State<ProductPickerScreen> {
  List<Product> _products = [];
  List<SelectedProduct> _selected = [];
  bool _loading = true;
  String _search = '';
  String _activeCategory = 'All';
  List<String> _categories = ['All'];

  @override
  void initState() {
    super.initState();
    _selected = List.from(widget.initialSelection);
    _fetchProducts();
  }

  Future<void> _fetchProducts() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/api/inventory/products'));
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        final products = data.map((e) => Product.fromJson(e)).toList();
        final cats = ['All', ...{...products.map((p) => p.category)}.toList()..sort()];
        setState(() {
          _products = products;
          _categories = cats;
          _loading = false;
        });
      }
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  List<Product> get _filtered => _products.where((p) {
        final matchCat = _activeCategory == 'All' || p.category == _activeCategory;
        final matchSearch = _search.isEmpty ||
            p.name.toLowerCase().contains(_search.toLowerCase()) ||
            p.brand.toLowerCase().contains(_search.toLowerCase());
        return matchCat && matchSearch && p.availableStock > 0;
      }).toList();

  SelectedProduct? _getSelected(int productId) {
    try {
      return _selected.firstWhere((s) => s.product.id == productId);
    } catch (_) {
      return null;
    }
  }

  void _setQty(Product product, int qty) {
    setState(() {
      _selected.removeWhere((s) => s.product.id == product.id);
      if (qty > 0) {
        _selected.add(SelectedProduct(product: product, quantity: qty.clamp(1, product.availableStock)));
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        foregroundColor: Colors.white,
        title: Text('Select Products', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, _selected),
            child: Text('Done (${_selected.length})', style: GoogleFonts.inter(color: const Color(0xFF38BDF8), fontWeight: FontWeight.bold)),
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              style: GoogleFonts.inter(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Search products...',
                hintStyle: TextStyle(color: Colors.white54),
                prefixIcon: const Icon(Icons.search, color: Colors.white54),
                filled: true,
                fillColor: const Color(0xFF1E293B),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
              onChanged: (v) => setState(() => _search = v),
            ),
          ),

          // Category chips
          SizedBox(
            height: 40,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: _categories.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final cat = _categories[i];
                final isActive = _activeCategory == cat;
                return GestureDetector(
                  onTap: () => setState(() => _activeCategory = cat),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: isActive ? const Color(0xFF38BDF8) : const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(cat, style: GoogleFonts.inter(
                      color: isActive ? const Color(0xFF0F172A) : Colors.white70,
                      fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                      fontSize: 12,
                    )),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 8),

          // Product list
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF38BDF8)))
                : _filtered.isEmpty
                    ? Center(child: Text('No products found', style: GoogleFonts.inter(color: Colors.white54)))
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        itemCount: _filtered.length,
                        itemBuilder: (context, i) {
                          final p = _filtered[i];
                          final sel = _getSelected(p.id);
                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: sel != null ? const Color(0xFF0C4A6E) : const Color(0xFF1E293B),
                              borderRadius: BorderRadius.circular(12),
                              border: sel != null ? Border.all(color: const Color(0xFF38BDF8), width: 1.5) : null,
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(p.name, style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w600)),
                                      Text('${p.brand} ${p.model}', style: GoogleFonts.inter(color: Colors.white54, fontSize: 12)),
                                      const SizedBox(height: 4),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(color: const Color(0xFF064E3B), borderRadius: BorderRadius.circular(8)),
                                        child: Text('${p.availableStock} ${p.unit} available', style: GoogleFonts.inter(color: const Color(0xFF34D399), fontSize: 11, fontWeight: FontWeight.w600)),
                                      ),
                                    ],
                                  ),
                                ),
                                Row(
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.remove_circle_outline, color: Colors.white54),
                                      onPressed: sel != null ? () => _setQty(p, (sel.quantity) - 1) : null,
                                    ),
                                    SizedBox(
                                      width: 36,
                                      child: Text(
                                        '${sel?.quantity ?? 0}',
                                        textAlign: TextAlign.center,
                                        style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                                      ),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.add_circle_outline, color: Color(0xFF38BDF8)),
                                      onPressed: (sel?.quantity ?? 0) < p.availableStock
                                          ? () => _setQty(p, (sel?.quantity ?? 0) + 1)
                                          : null,
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          );
                        },
                      ),
          ),

          // Bottom summary bar
          if (_selected.isNotEmpty)
            Container(
              color: const Color(0xFF1E293B),
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('${_selected.length} products selected', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold)),
                        Text('${_selected.fold(0, (s, e) => s + e.quantity)} total units', style: GoogleFonts.inter(color: Colors.white54, fontSize: 12)),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () => Navigator.pop(context, _selected),
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF38BDF8), foregroundColor: const Color(0xFF0F172A)),
                    child: Text('Confirm', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
