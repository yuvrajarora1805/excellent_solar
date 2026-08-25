import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
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
  late TextEditingController _applicationDateController;
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
    _applicationDateController = TextEditingController(text: widget.application['application_date'] != null ? widget.application['application_date'].toString().split('T')[0] : '');
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
            _applicationDateController.text = _fullDetails!['application_date'] != null ? _fullDetails!['application_date'].toString().split('T')[0] : '';
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
    _applicationDateController.dispose();
    _processingFeeController.dispose();
    _jeNameController.dispose();
    _jePhoneController.dispose();
    super.dispose();
  }

  Future<void> _selectApplicationDate() async {
    DateTime initialDate = DateTime.tryParse(_applicationDateController.text) ?? DateTime.now();
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
    );
    if (picked != null) {
      setState(() {
        _applicationDateController.text = "${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}";
      });
    }
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
            'application_date': _applicationDateController.text.isNotEmpty ? _applicationDateController.text : null,
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

  Future<bool> _uploadSingleFile(String docType, File file) async {
    try {
      var request = http.MultipartRequest('POST', Uri.parse('$baseUrl/api/mobile/upload'));
      request.fields['discom_id'] = widget.application['id'].toString();
      request.fields['document_type'] = docType;
      request.files.add(await http.MultipartFile.fromPath('file', file.path));

      final streamedResponse = await ApiService.sendMultipart(request);
      final response = await http.Response.fromStream(streamedResponse);
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  Future<void> _pickAndUploadPDF(String docType) async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
      );
      if (result != null && result.files.single.path != null) {
        setState(() => _isLoading = true);
        File pdfFile = File(result.files.single.path!);
        bool success = await _uploadSingleFile(docType, pdfFile);
        await _fetchDetails();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(success ? 'PDF uploaded successfully!' : 'Failed to upload PDF'),
              backgroundColor: success ? Colors.green : Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Error picking PDF file')));
    }
  }

  Future<void> _captureCameraPhoto(String docType) async {
    try {
      final XFile? image = await _picker.pickImage(source: ImageSource.camera, imageQuality: 80);
      if (image != null) {
        setState(() => _isLoading = true);
        bool success = await _uploadSingleFile(docType, File(image.path));
        await _fetchDetails();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(success ? 'Camera photo uploaded!' : 'Upload failed'),
              backgroundColor: success ? Colors.green : Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Camera capture failed')));
    }
  }

  Future<void> _pickGalleryImages(String docType) async {
    try {
      final List<XFile> images = await _picker.pickMultiImage(imageQuality: 80);
      if (images.isNotEmpty) {
        setState(() => _isLoading = true);
        int successCount = 0;
        for (var image in images) {
          bool ok = await _uploadSingleFile(docType, File(image.path));
          if (ok) successCount++;
        }
        await _fetchDetails();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('$successCount image(s) uploaded successfully!'),
              backgroundColor: successCount > 0 ? Colors.green : Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Error picking images')));
    }
  }

  void _showUploadOptionsModal(String docTypeLabel) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (BuildContext context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16.0, horizontal: 12.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                  child: Text(
                    'Upload $docTypeLabel',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ),
                const Divider(),
                ListTile(
                  leading: const Icon(Icons.picture_as_pdf, color: Colors.red, size: 28),
                  title: const Text('Upload PDF Document', style: TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: const Text('Select a .pdf file from your device storage'),
                  onTap: () {
                    Navigator.pop(context);
                    _pickAndUploadPDF(docTypeLabel);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.camera_alt, color: Colors.blue, size: 28),
                  title: const Text('Take Photo with Camera', style: TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: const Text('Capture photo using device camera'),
                  onTap: () {
                    Navigator.pop(context);
                    _captureCameraPhoto(docTypeLabel);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.photo_library, color: Colors.green, size: 28),
                  title: const Text('Pick Multiple Images from Gallery', style: TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: const Text('Select one or more photos from gallery'),
                  onTap: () {
                    Navigator.pop(context);
                    _pickGalleryImages(docTypeLabel);
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showAddExtraDocumentDialog() {
    final titleCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Add Extra Document'),
          content: TextField(
            controller: titleCtrl,
            autofocus: true,
            decoration: const InputDecoration(
              labelText: 'Document Name / Label',
              hintText: 'e.g. NOC Certificate, Agreement',
              border: OutlineInputBorder(),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                final name = titleCtrl.text.trim();
                if (name.isNotEmpty) {
                  Navigator.pop(context);
                  _showUploadOptionsModal(name);
                }
              },
              child: const Text('Proceed to Upload'),
            ),
          ],
        );
      },
    );
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

  Widget _buildDocCard(String title, String docTypeKey, List<dynamic> allUploadedDocs) {
    // Find documents matching this docTypeKey / title
    final matchingDocs = allUploadedDocs.where((d) {
      final name = (d['document_type_name'] ?? d['file_name'] ?? '').toString().toLowerCase();
      final target = title.toLowerCase();
      return name.contains(target) || target.contains(name);
    }).toList();

    bool isUploaded = matchingDocs.isNotEmpty;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: BorderSide(color: isUploaded ? Colors.green.shade200 : Colors.grey.shade300),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  isUploaded ? Icons.check_circle : Icons.error_outline,
                  color: isUploaded ? Colors.green : Colors.orange,
                  size: 24,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: () => _showUploadOptionsModal(title),
                  icon: Icon(isUploaded ? Icons.upload_file : Icons.add_a_photo, size: 18),
                  label: Text(isUploaded ? 'Re-upload' : 'Upload'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isUploaded ? Colors.grey.shade200 : Colors.blue.shade700,
                    foregroundColor: isUploaded ? Colors.black87 : Colors.white,
                    elevation: 0,
                  ),
                ),
              ],
            ),
            if (isUploaded) ...[
              const Divider(height: 16),
              ...matchingDocs.map((doc) => Padding(
                padding: const EdgeInsets.only(top: 4.0),
                child: Row(
                  children: [
                    Icon(
                      doc['file_name']?.toString().endsWith('.pdf') == true
                          ? Icons.picture_as_pdf
                          : Icons.image,
                      size: 16,
                      color: Colors.grey.shade700,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        doc['file_name'] ?? 'File uploaded',
                        style: const TextStyle(fontSize: 12, color: Colors.black87),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.green.shade50,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        doc['status'] ?? 'Uploaded',
                        style: TextStyle(fontSize: 10, color: Colors.green.shade800, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              )),
            ],
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final app = widget.application;
    final List<dynamic> uploadedDocs = _fullDetails?['documents'] as List<dynamic>? ?? [];
    
    // Primary required documents
    const String feeChargeTitle = 'Fee Charge';
    const String estimateFeeTitle = 'Estimate Fee Charge';

    // Extra documents uploaded beyond the 2 main documents
    final extraDocs = uploadedDocs.where((d) {
      final name = (d['document_type_name'] ?? d['file_name'] ?? '').toString().toLowerCase();
      return !name.contains('fee charge') && !name.contains('estimate fee charge');
    }).toList();

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
            _buildVerificationCard('Second Approval', 'second_approval', {'status': _fullDetails?['second_approval_status'] ?? 'PENDING'}),
            
            const SizedBox(height: 24),
            const Text('DISCOM Details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            
            TextField(
              controller: _npNumberController,
              decoration: const InputDecoration(labelText: 'NP Number', border: OutlineInputBorder(), prefixIcon: Icon(Icons.numbers)),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _applicationDateController,
              readOnly: true,
              onTap: _selectApplicationDate,
              decoration: const InputDecoration(
                labelText: 'Application Date',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.calendar_today),
                hintText: 'YYYY-MM-DD',
              ),
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
            
            const SizedBox(height: 28),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Required Documents', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                Text('2 Main Required', style: TextStyle(color: Colors.grey.shade600, fontSize: 12, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 12),
            
            // Primary Required Document 1: Fee Charge
            _buildDocCard(feeChargeTitle, 'fee_charge', uploadedDocs),
            
            // Primary Required Document 2: Estimate Fee Charge
            _buildDocCard(estimateFeeTitle, 'estimate_fee_charge', uploadedDocs),
            
            if (extraDocs.isNotEmpty) ...[
              const SizedBox(height: 16),
              const Text('Extra Uploaded Documents', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              ...extraDocs.map((doc) => Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: Icon(
                    doc['file_name']?.toString().endsWith('.pdf') == true ? Icons.picture_as_pdf : Icons.image,
                    color: Colors.blue,
                  ),
                  title: Text(doc['document_type_name'] ?? doc['file_name'] ?? 'Extra Document'),
                  subtitle: Text(doc['file_name'] ?? ''),
                  trailing: const Icon(Icons.check_circle, color: Colors.green),
                ),
              )),
            ],

            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: _showAddExtraDocumentDialog,
              icon: const Icon(Icons.add),
              label: const Text('Upload Extra Document', style: TextStyle(fontWeight: FontWeight.bold)),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                side: const BorderSide(color: Colors.blue),
                foregroundColor: Colors.blue,
              ),
            ),
            
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}
