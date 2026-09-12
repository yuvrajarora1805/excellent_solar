import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../main.dart' show baseUrl;
import '../services/api_service.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

class DraftsScreen extends StatefulWidget {
  const DraftsScreen({super.key});

  @override
  State<DraftsScreen> createState() => _DraftsScreenState();
}

class _DraftsScreenState extends State<DraftsScreen> with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  List<dynamic> _orders = [];
  List<dynamic> _quotations = [];
  List<dynamic> _bookings = [];
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _fetchDrafts();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchDrafts() async {
    setState(() => _isLoading = true);
    try {
      final response = await ApiService.get(Uri.parse('$baseUrl/api/mobile/drafts'));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _orders = data['orders'] ?? [];
          _quotations = data['quotations'] ?? [];
          _bookings = data['bookings'] ?? [];
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
        _showError('Failed to load drafts');
      }
    } catch (e) {
      setState(() => _isLoading = false);
      _showError('Error loading drafts');
    }
  }

  Future<void> _deleteDraft(String type, int id) async {
    bool confirm = await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Draft'),
        content: const Text('Are you sure you want to delete this draft? This action cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    ) ?? false;

    if (!confirm) return;

    String endpoint = '';
    if (type == 'Order') endpoint = '/api/orders/$id';
    if (type == 'Quotation') endpoint = '/api/quotations/$id';
    if (type == 'Booking') endpoint = '/api/projects/$id';

    try {
      final response = await ApiService.delete(Uri.parse('$baseUrl$endpoint'));
      if (response.statusCode == 200 || response.statusCode == 204) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Draft deleted successfully')));
        _fetchDrafts();
      } else {
        _showError('Failed to delete draft');
      }
    } catch (e) {
      _showError('Error deleting draft');
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
  }

  Widget _buildDraftList(List<dynamic> items, String type, IconData icon) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (items.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 64, color: Colors.grey.shade300),
            const SizedBox(height: 16),
            Text('No drafted $type found', style: TextStyle(fontSize: 16, color: Colors.grey.shade600)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        final createdDate = DateTime.tryParse(item['created_at'] ?? '');
        final dateString = createdDate != null ? DateFormat('MMM dd, yyyy').format(createdDate) : 'Unknown date';

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          backgroundColor: Colors.blue.shade50,
                          child: Icon(icon, color: Colors.blue.shade700),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(item['reference'] ?? 'Draft', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            const SizedBox(height: 4),
                            Text(dateString, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                          ],
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete_outline, color: Colors.red),
                      onPressed: () => _deleteDraft(type, item['id']),
                    )
                  ],
                ),
                const SizedBox(height: 12),
                Text('Customer: ${item['customer_name'] ?? 'N/A'}', style: const TextStyle(fontSize: 14)),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue.shade50,
                      foregroundColor: Colors.blue.shade700,
                      elevation: 0,
                    ),
                    icon: const Icon(Icons.edit),
                    label: const Text('Resume / Edit'),
                    onPressed: () async {
                      String endpoint = '';
                      if (type == 'Order') endpoint = '/orders/${item['id']}/edit';
                      if (type == 'Quotation') endpoint = '/quotations/${item['id']}/edit';
                      if (type == 'Booking') endpoint = '/projects/${item['id']}/edit'; // Assuming projects route
                      
                      final url = Uri.parse('https://es.omvky.com$endpoint');
                      try {
                        if (await canLaunchUrl(url)) {
                          await launchUrl(url, mode: LaunchMode.externalApplication);
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Could not launch edit page.'))
                          );
                        }
                      } catch (e) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Please edit this draft from the web dashboard.'))
                        );
                      }
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Drafts'),
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: 'Orders (${_orders.length})'),
            Tab(text: 'Quotations (${_quotations.length})'),
            Tab(text: 'Bookings (${_bookings.length})'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildDraftList(_orders, 'Order', Icons.local_shipping),
          _buildDraftList(_quotations, 'Quotation', Icons.description),
          _buildDraftList(_bookings, 'Booking', Icons.assignment_turned_in),
        ],
      ),
    );
  }
}
