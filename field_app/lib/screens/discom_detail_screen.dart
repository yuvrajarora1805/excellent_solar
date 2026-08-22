import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import '../services/api_service.dart';
import '../main.dart' show baseUrl;

class DiscomDetailScreen extends StatefulWidget {
  final Map<String, dynamic> application;
  const DiscomDetailScreen({super.key, required this.application});

  @override
  State<DiscomDetailScreen> createState() => _DiscomDetailScreenState();
}

class _DiscomDetailScreenState extends State<DiscomDetailScreen> {
  late TextEditingController _npNumberController;
  late TextEditingController _processingFeeController;
  late TextEditingController _jeNameController;
  late TextEditingController _jePhoneController;
  
  bool _isLoading = true;
  bool _isSaving = false;
  Map<String, dynamic>? _fullDetails;
  
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _npNumberController = TextEditingController(text: widget.application['np_number'] ?? '');
    _processingFeeController = TextEditingController(text: widget.application['processing_fee']?.toString() ?? '');
    _jeNameController = TextEditingController(text: widget.application['je_name'] ?? '');
    _jePhoneController = TextEditingController(text: widget.application['je_phone'] ?? '');
    _fetchDetails();
  }

  Future<void> _fetchDetails() async {
    try {
      final response = await ApiService.get(Uri.parse('$baseUrl/api/mobile/discom/${widget.application['id']}'));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success']) {
          setState(() {
            _fullDetails = data['application'];
            
            // Update controllers with fresh data
            _npNumberController.text = _fullDetails!['np_number'] ?? '';
            _processingFeeController.text = _fullDetails!['processing_fee']?.toString() ?? '';
            _jeNameController.text = _fullDetails!['je_name'] ?? '';
            _jePhoneController.text = _fullDetails!['je_phone'] ?? '';
            
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to load details')));
    }
  }

  @override
  void dispose() {
    _npNumberController.dispose();
    _processingFeeController.dispose();
    _jeNameController.dispose();
    _jePhoneController.dispose();
    super.dispose();
  }

  Future<void> _updateFields() async {
    setState(() => _isSaving = true);
    try {
      final response = await ApiService.put(
        Uri.parse('$baseUrl/api/mobile/discom/${widget.application['id']}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'action': 'update_fields',
          'updateData': {
            'np_number': _npNumberController.text,
            'processing_fee': _processingFeeController.text.isNotEmpty ? double.parse(_processingFeeController.text) : null,
            'je_name': _jeNameController.text,
            'je_phone': _jePhoneController.text,
          }
        }),
      );

      if (response.statusCode == 200) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Updated successfully!')));
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to update fields')));
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Connection error')));
    } finally {
      setState(() => _isSaving = false);
    }
  }

  Future<void> _updateVerification(String stage, String status) async {
    try {
      final response = await ApiService.put(
        Uri.parse('$baseUrl/api/mobile/discom/${widget.application['id']}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'stage': stage,
          'status': status,
        }),
      );
      if (response.statusCode == 200) {
        _fetchDetails(); // Reload data
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${stage.toUpperCase()} status updated!')));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to update status')));
    }
  }

  Future<void> _uploadDocument(String docTypeId) async {
    try {
      final XFile? image = await _picker.pickImage(source: ImageSource.camera, imageQuality: 70);
      if (image == null) return;

      setState(() => _isLoading = true);

      var request = http.MultipartRequest('POST', Uri.parse('$baseUrl/api/mobile/upload'));
      request.fields['discom_id'] = widget.application['id'].toString();
      request.fields['document_type_id'] = docTypeId;
      request.files.add(await http.MultipartFile.fromPath('file', image.path));

      final streamedResponse = await ApiService.sendMultipart(request);
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        await _fetchDetails();
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Document uploaded!')));
      } else {
        throw Exception('Failed to upload');
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Upload failed')));
    }
  }

  Widget _buildVerificationCard(String title, String stage, Map<String, dynamic>? verificationData) {
    String currentStatus = verificationData?['status'] ?? 'PENDING';
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
            DropdownButton<String>(
              value: ['PENDING', 'APPROVED', 'REJECTED'].contains(currentStatus) ? currentStatus : 'PENDING',
              onChanged: (String? newValue) {
                if (newValue != null) {
                  _updateVerification(stage, newValue);
                }
              },
              items: <String>['PENDING', 'APPROVED', 'REJECTED']
                  .map<DropdownMenuItem<String>>((String value) {
                return DropdownMenuItem<String>(
                  value: value,
                  child: Text(value),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final app = widget.application;
    
    return Scaffold(
      appBar: AppBar(
        title: Text('App #${app['application_id'] ?? app['id']}'),
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header Info
            Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                side: const BorderSide(color: Colors.black12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Project & Customer', style: TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text(app['customer_name'] ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    Text('Project ID: ${app['project_id']}'),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        app['status'] ?? 'UNKNOWN',
                        style: TextStyle(color: Colors.blue.shade700, fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            
            const Text('Verifications', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _buildVerificationCard('JE Verification', 'je', _fullDetails?['je_verification']),
            _buildVerificationCard('SDO Verification', 'sdo', _fullDetails?['sdo_verification']),
            _buildVerificationCard('XEN Verification', 'xen', _fullDetails?['xen_verification']),
            
            const SizedBox(height: 24),
            const Text('DISCOM Details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            
            TextField(
              controller: _npNumberController,
              decoration: const InputDecoration(labelText: 'NP Number', border: OutlineInputBorder(), prefixIcon: Icon(Icons.numbers)),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _processingFeeController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Processing Fee (₹)', border: OutlineInputBorder(), prefixIcon: Icon(Icons.currency_rupee)),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _jeNameController,
              decoration: const InputDecoration(labelText: 'JE Name', border: OutlineInputBorder(), prefixIcon: Icon(Icons.person)),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _jePhoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'JE Phone', border: OutlineInputBorder(), prefixIcon: Icon(Icons.phone)),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _isSaving ? null : _updateFields,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: const Color(0xFF7C5800),
                foregroundColor: Colors.white,
              ),
              child: _isSaving
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('Save Details', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
            
            const SizedBox(height: 24),
            const Text('Documents', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            if (_fullDetails?['checklist'] != null)
              ...(_fullDetails!['checklist'] as List).map((doc) {
                bool isUploaded = doc['is_uploaded'] == 1 || doc['is_uploaded'] == true;
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: Icon(isUploaded ? Icons.check_circle : Icons.error_outline, 
                                 color: isUploaded ? Colors.green : Colors.orange),
                    title: Text(doc['name'] ?? 'Document'),
                    trailing: isUploaded 
                      ? const Text('Uploaded', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold))
                      : IconButton(
                          icon: const Icon(Icons.camera_alt, color: Colors.blue),
                          onPressed: () => _uploadDocument(doc['id'].toString()),
                        ),
                  ),
                );
              }),
            if (_fullDetails?['checklist'] == null || (_fullDetails!['checklist'] as List).isEmpty)
              const Padding(
                padding: EdgeInsets.all(16.0),
                child: Text('No documents required or checklist empty. (You can still upload a general document).'),
              ),
            
            if (_fullDetails?['checklist'] == null || (_fullDetails!['checklist'] as List).isEmpty)
              ElevatedButton.icon(
                onPressed: () => _uploadDocument('1'),
                icon: const Icon(Icons.upload_file),
                label: const Text('Upload General Document'),
              ),
            
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}
