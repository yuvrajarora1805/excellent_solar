import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../main.dart' show baseUrl;

class OrderDetailScreen extends StatefulWidget {
  final int orderId;
  final String orderNumber;

  const OrderDetailScreen({super.key, required this.orderId, required this.orderNumber});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  Map<String, dynamic>? _order;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchOrderDetails();
  }

  Future<void> _fetchOrderDetails() async {
    try {
      final response = await ApiService.get(Uri.parse('$baseUrl/api/orders/${widget.orderId}'));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (mounted) {
          setState(() {
            _order = data['order'];
            _isLoading = false;
          });
        }
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Widget _buildSectionHeader(String title, IconData icon, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 8),
          Text(title, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: color)),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(flex: 2, child: Text(label, style: const TextStyle(color: Colors.black54, fontWeight: FontWeight.bold, fontSize: 13))),
          Expanded(flex: 3, child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13))),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Order ${widget.orderNumber}'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _order == null
              ? const Center(child: Text('Failed to load order details'))
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Order Status Card
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: _order!['status'] == 'DISPATCHED' || _order!['status'] == 'DELIVERED' ? Colors.green.shade50 : Colors.orange.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: _order!['status'] == 'DISPATCHED' || _order!['status'] == 'DELIVERED' ? Colors.green : Colors.orange),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Status', style: TextStyle(fontWeight: FontWeight.bold)),
                            Text(
                              _order!['status'] ?? 'UNKNOWN',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: _order!['status'] == 'DISPATCHED' || _order!['status'] == 'DELIVERED' ? Colors.green.shade700 : Colors.orange.shade700,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Customer Details
                      _buildSectionHeader('Customer Details', Icons.person, Colors.blue),
                      Card(
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8), side: BorderSide(color: Colors.grey.shade300)),
                        child: Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Column(
                            children: [
                              _buildDetailRow('Name', _order!['customer_name'] ?? 'N/A'),
                              _buildDetailRow('Mobile', _order!['customer_mobile'] ?? 'N/A'),
                              _buildDetailRow('Delivery Addr', _order!['delivery_address'] ?? 'N/A'),
                              if (_order!['order_type'] != null)
                                _buildDetailRow('Order Type', _order!['order_type']),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Vehicle & Driver Details
                      _buildSectionHeader('Vehicle & Driver', Icons.local_shipping, Colors.amber.shade800),
                      Card(
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8), side: BorderSide(color: Colors.grey.shade300)),
                        child: Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildDetailRow('Driver Name', _order!['driver_name'] ?? 'N/A'),
                              _buildDetailRow('Vehicle Number', _order!['vehicle_number'] ?? 'N/A'),
                              if (_order!['vehicle_photo_path'] != null) ...[
                                const SizedBox(height: 10),
                                const Text('Vehicle Proof Photo:', style: TextStyle(color: Colors.black54, fontWeight: FontWeight.bold, fontSize: 13)),
                                const SizedBox(height: 8),
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: Image.network(
                                    _order!['vehicle_photo_path'].startsWith('http') 
                                        ? _order!['vehicle_photo_path'] 
                                        : '$baseUrl${_order!['vehicle_photo_path']}',
                                    height: 150,
                                    width: double.infinity,
                                    fit: BoxFit.cover,
                                    errorBuilder: (c, e, s) => Container(
                                      height: 150,
                                      color: Colors.grey.shade200,
                                      child: const Center(child: Icon(Icons.broken_image, size: 40, color: Colors.grey)),
                                    ),
                                  ),
                                ),
                              ]
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Items Breakdown
                      _buildSectionHeader('Products Breakdown', Icons.shopping_cart, Colors.purple),
                      Card(
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8), side: BorderSide(color: Colors.grey.shade300)),
                        child: Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (_order!['items'] != null && (_order!['items'] as List).isNotEmpty)
                                ...(_order!['items'] as List).map((item) => Padding(
                                      padding: const EdgeInsets.only(bottom: 8.0),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Expanded(
                                            child: Text(
                                              item['product_name'] ?? 'Unknown Product',
                                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                            ),
                                          ),
                                          Text(
                                            'Qty: ${item['quantity']}',
                                            style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue),
                                          ),
                                        ],
                                      ),
                                    )).toList()
                              else
                                const Text('No items found', style: TextStyle(color: Colors.grey)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Serials
                      _buildSectionHeader('Scanned Serials', Icons.qr_code, Colors.teal),
                      Card(
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8), side: BorderSide(color: Colors.grey.shade300)),
                        child: Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (_order!['serials'] != null && (_order!['serials'] as List).isNotEmpty)
                                Wrap(
                                  spacing: 6,
                                  runSpacing: 6,
                                  children: (_order!['serials'] as List).map((s) => Chip(
                                    label: Text(s['serial_number'] ?? '', style: const TextStyle(fontSize: 11)),
                                    backgroundColor: Colors.teal.shade50,
                                    side: BorderSide(color: Colors.teal.shade200),
                                  )).toList(),
                                )
                              else
                                const Text('No serialized items scanned', style: TextStyle(color: Colors.grey)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 30),
                    ],
                  ),
                ),
    );
  }
}
