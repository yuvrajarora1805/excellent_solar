import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../main.dart' show baseUrl;

class MyTicketsListScreen extends StatefulWidget {
  const MyTicketsListScreen({super.key});

  @override
  State<MyTicketsListScreen> createState() => _MyTicketsListScreenState();
}

class _MyTicketsListScreenState extends State<MyTicketsListScreen> {
  List<dynamic> _tickets = [];
  List<dynamic> _customers = [];
  bool _isLoading = true;
  String _error = '';
  String _role = '';
  int _workerId = 1;

  @override
  void initState() {
    super.initState();
    _loadRoleAndFetch();
  }

  Future<void> _loadRoleAndFetch() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _role = (prefs.getString('worker_role') ?? 'WORKER').toUpperCase().trim();
      _workerId = prefs.getInt('worker_id') ?? 1;
    });
    _fetchTickets();
    if (_role == 'ADMIN' || _role == 'MANAGER') {
      _fetchCustomers();
    }
  }

  Future<void> _fetchCustomers() async {
    try {
      final response = await ApiService.get(Uri.parse('$baseUrl/api/customers?limit=500'));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _customers = data['customers'] ?? [];
        });
      }
    } catch (_) {}
  }

  Future<void> _fetchTickets() async {
    try {
      final response = await ApiService.get(Uri.parse('$baseUrl/api/mobile/tickets?worker_id=$_workerId'));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _tickets = data['tickets'] ?? [];
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = 'Failed to load tickets';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Connection error';
        _isLoading = false;
      });
    }
  }

  // ── RAISE NEW TICKET ────────────────────────────────────────────────────────
  void _showRaiseTicketSheet() {
    int? selectedCustomerId;
    String selectedCategory = 'Inverter';
    String selectedType = 'Not Working';
    String selectedPriority = 'NORMAL';
    final descCtrl = TextEditingController();
    bool submitting = false;

    final categoryTypes = {
      'Inverter':    ['Not Working', 'Low Output', 'Error Code', 'Overheating', 'Other'],
      'Panel':       ['Physical Damage', 'Low Generation', 'Shading Issue', 'Other'],
      'Electrical':  ['Wiring Issue', 'MCB Tripping', 'Earth Fault', 'Other'],
      'Battery':     ['Not Charging', 'Low Backup', 'Physical Damage', 'Other'],
      'Wiring':      ['Loose Connection', 'Short Circuit', 'Conduit Damage', 'Other'],
      'Other':       ['General Query', 'AMC Visit', 'Inspection', 'Other'],
    };

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) => Padding(
          padding: EdgeInsets.only(
            left: 20, right: 20, top: 24,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(4)))),
                const SizedBox(height: 16),
                Text('Raise Service Ticket', style: GoogleFonts.hankenGrotesk(fontSize: 18, fontWeight: FontWeight.bold)),
                const Divider(height: 24),

                // Customer Dropdown
                const Text('Customer *', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 6),
                DropdownButtonFormField<int>(
                  decoration: const InputDecoration(border: OutlineInputBorder(), contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10)),
                  hint: const Text('Select Customer'),
                  value: selectedCustomerId,
                  items: _customers.map<DropdownMenuItem<int>>((c) => DropdownMenuItem<int>(
                    value: c['id'] as int,
                    child: Text('${c['name']} (${c['mobile'] ?? ''})', overflow: TextOverflow.ellipsis),
                  )).toList(),
                  onChanged: (v) => setS(() => selectedCustomerId = v),
                ),
                const SizedBox(height: 14),

                // Issue Category
                const Text('Issue Category *', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 6),
                DropdownButtonFormField<String>(
                  decoration: const InputDecoration(border: OutlineInputBorder(), contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10)),
                  value: selectedCategory,
                  items: categoryTypes.keys.map((k) => DropdownMenuItem(value: k, child: Text(k))).toList(),
                  onChanged: (v) => setS(() {
                    selectedCategory = v!;
                    selectedType = categoryTypes[v]!.first;
                  }),
                ),
                const SizedBox(height: 14),

                // Issue Type
                const Text('Issue Type *', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 6),
                DropdownButtonFormField<String>(
                  decoration: const InputDecoration(border: OutlineInputBorder(), contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10)),
                  value: selectedType,
                  items: (categoryTypes[selectedCategory] ?? []).map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                  onChanged: (v) => setS(() => selectedType = v!),
                ),
                const SizedBox(height: 14),

                // Priority
                const Text('Priority', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 6),
                DropdownButtonFormField<String>(
                  decoration: const InputDecoration(border: OutlineInputBorder(), contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10)),
                  value: selectedPriority,
                  items: ['LOW', 'NORMAL', 'HIGH', 'URGENT'].map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
                  onChanged: (v) => setS(() => selectedPriority = v!),
                ),
                const SizedBox(height: 14),

                // Description
                const Text('Description', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 6),
                TextField(
                  controller: descCtrl,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    hintText: 'Describe the issue in detail...',
                    contentPadding: EdgeInsets.all(12),
                  ),
                ),
                const SizedBox(height: 20),

                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF7C5800),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    onPressed: submitting ? null : () async {
                      if (selectedCustomerId == null) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a customer!')));
                        return;
                      }
                      setS(() => submitting = true);
                      try {
                        final body = jsonEncode({
                          'customer_id': selectedCustomerId,
                          'issue_category': selectedCategory,
                          'issue_type': selectedType,
                          'priority': selectedPriority,
                          'description': descCtrl.text.trim(),
                          'created_by': _workerId,
                        });
                        final res = await ApiService.post(Uri.parse('$baseUrl/api/mobile/tickets'), body: body);
                        final data = jsonDecode(res.body);
                        if (res.statusCode == 200 || res.statusCode == 201) {
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Ticket ${data['ticket_number']} raised successfully!'), backgroundColor: Colors.green),
                          );
                          _fetchTickets();
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(data['error'] ?? 'Failed to create ticket')));
                        }
                      } catch (e) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Connection error')));
                      }
                      setS(() => submitting = false);
                    },
                    child: submitting ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2) : const Text('Submit Ticket', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showTicketDetailsDialog(Map<String, dynamic> t) {
    final status = (t['status'] ?? 'OPEN').toString().toUpperCase();
    final isResolved = status == 'RESOLVED' || status == 'CLOSED';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    t['ticket_number'] ?? 'Ticket Detail',
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.blue),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: isResolved ? Colors.green.shade100 : Colors.amber.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      status,
                      style: TextStyle(
                        color: isResolved ? Colors.green.shade800 : Colors.amber.shade900,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
              const Divider(height: 24),
              _buildDetailRow(Icons.person, 'Customer Name', t['customer_name'] ?? 'N/A'),
              if (t['customer_mobile'] != null)
                _buildDetailRow(Icons.phone, 'Mobile Number', t['customer_mobile']),
              _buildDetailRow(Icons.category, 'Issue Category', '${t['issue_category']} (${t['issue_type']})'),
              _buildDetailRow(Icons.priority_high, 'Priority Level', t['priority'] ?? 'MEDIUM'),
              const SizedBox(height: 12),
              const Text('Problem Description:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 6),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(t['description'] ?? 'No description provided.', style: const TextStyle(fontSize: 14)),
              ),
              if (t['resolution'] != null && t['resolution'].toString().isNotEmpty) ...[
                const SizedBox(height: 12),
                const Text('Resolution Notes:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.green)),
                const SizedBox(height: 6),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.green.shade200),
                  ),
                  child: Text(t['resolution'], style: const TextStyle(fontSize: 14)),
                ),
              ],
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Close'),
                    ),
                  ),
                  if (!isResolved) ...[
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                        onPressed: () {
                          Navigator.pop(context);
                          _showResolveDialog(t);
                        },
                        child: const Text('Mark Resolved'),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDetailRow(IconData icon, String title, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: Colors.grey.shade600),
          const SizedBox(width: 8),
          SizedBox(
            width: 110,
            child: Text(title, style: TextStyle(color: Colors.grey.shade700, fontSize: 13)),
          ),
          Expanded(
            child: Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
          ),
        ],
      ),
    );
  }

  Future<void> _showResolveDialog(Map<String, dynamic> ticket) async {
    final TextEditingController notesController = TextEditingController();
    final formKey = GlobalKey<FormState>();

    return showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext dialogContext) {
        return AlertDialog(
          title: Text('Resolve Ticket #${ticket['ticket_number']}'),
          content: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Are you sure you want to mark this ticket as resolved? This will submit it for manager approval.',
                  style: TextStyle(fontSize: 14, color: Colors.black87),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: notesController,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Resolution Notes / Work Done *',
                    hintText: 'e.g. Replaced inverter fuse, checked wiring and tested generation',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Please enter resolution notes';
                    }
                    return null;
                  },
                ),
              ],
            ),
          ),
          actions: <Widget>[
            TextButton(
              child: const Text('Cancel'),
              onPressed: () => Navigator.of(dialogContext).pop(),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
              child: const Text('Submit Resolution'),
              onPressed: () async {
                if (formKey.currentState!.validate()) {
                  Navigator.of(dialogContext).pop();
                  await _markResolved(ticket['id'], notesController.text.trim());
                }
              },
            ),
          ],
        );
      },
    );
  }

  Future<void> _markResolved(int ticketId, String notes) async {
    try {
      final response = await ApiService.post(
        Uri.parse('$baseUrl/api/mobile/update-status'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'type': 'TICKET',
          'id': ticketId,
          'status': 'RESOLVED',
          'notes': notes,
        }),
      );

      if (response.statusCode == 200) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('✅ Ticket marked as resolved and sent for approval!'),
              backgroundColor: Colors.green,
            ),
          );
        }
        _fetchTickets();
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to update ticket status.')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Connection error.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Service Tickets'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _fetchTickets),
        ],
      ),
      floatingActionButton: (_role == 'ADMIN' || _role == 'MANAGER')
          ? FloatingActionButton.extended(
              onPressed: _showRaiseTicketSheet,
              backgroundColor: const Color(0xFF7C5800),
              foregroundColor: Colors.white,
              icon: const Icon(Icons.add),
              label: const Text('Raise Ticket', style: TextStyle(fontWeight: FontWeight.bold)),
            )
          : null,
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : _error.isNotEmpty
          ? Center(child: Text(_error))
          : _tickets.isEmpty
            ? const Center(child: Text('No assigned tickets currently.'))
            : ListView.builder(
                padding: const EdgeInsets.all(16.0),
                itemCount: _tickets.length,
                itemBuilder: (context, index) {
                  final t = _tickets[index];
                  final status = (t['status'] ?? 'OPEN').toString().toUpperCase();
                  final isResolved = status == 'RESOLVED' || status == 'CLOSED';

                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: () => _showTicketDetailsDialog(t),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(t['ticket_number'], style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue)),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: isResolved ? Colors.green.shade100 : Colors.red.shade100,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    isResolved ? 'RESOLVED' : (t['priority'] ?? 'NORMAL'), 
                                    style: TextStyle(
                                      color: isResolved ? Colors.green.shade800 : Colors.red.shade800, 
                                      fontSize: 12, 
                                      fontWeight: FontWeight.bold
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(t['customer_name'] ?? 'Unknown Customer', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Text('${t['issue_category']} - ${t['issue_type']}'),
                            const SizedBox(height: 4),
                            Text(
                              t['description'] ?? '', 
                              style: const TextStyle(color: Colors.grey),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                const Icon(Icons.calendar_today, size: 13, color: Colors.grey),
                                const SizedBox(width: 4),
                                Text(
                                  'Date: ${t['date'] ?? t['created_at'] ?? 'N/A'}',
                                  style: TextStyle(color: Colors.grey.shade700, fontSize: 12, fontWeight: FontWeight.w500),
                                ),
                              ],
                            ),

                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                TextButton.icon(
                                  onPressed: () => _showTicketDetailsDialog(t),
                                  icon: const Icon(Icons.info_outline, size: 16),
                                  label: const Text('View Details', style: TextStyle(fontSize: 13)),
                                ),
                                if (!isResolved)
                                  ElevatedButton(
                                    onPressed: () => _showResolveDialog(t),
                                    style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                                    child: const Text('Mark Resolved'),
                                  )
                                else
                                  const Chip(
                                    avatar: Icon(Icons.check_circle, color: Colors.green, size: 18),
                                    label: Text('Awaiting Closure', style: TextStyle(fontSize: 12)),
                                  ),
                              ],
                            )
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
    );
  }
}
