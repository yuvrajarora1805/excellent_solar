import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import '../services/api_service.dart';
import 'package:image_picker/image_picker.dart';

import 'package:geolocator/geolocator.dart';
import 'package:image/image.dart' as img;
import '../main.dart' show baseUrl;

class JobDetailScreen extends StatefulWidget {
  final String jobId;
  final String customerName;
  final bool isSurvey;

  const JobDetailScreen({
    super.key,
    required this.jobId,
    required this.customerName,
    this.isSurvey = true,
  });

  @override
  State<JobDetailScreen> createState() => _JobDetailScreenState();
}

class _JobDetailScreenState extends State<JobDetailScreen> {
  // Installation checkpoints
  bool serviceWireStatus = false;
  bool wifiConfigured = false;

  // Survey variables
  String roofType = 'Concrete';
  String roofCondition = 'Good';
  final _availableAreaCtrl = TextEditingController();
  final _roofLengthCtrl = TextEditingController();
  final _roofWidthCtrl = TextEditingController();
  final _estimatedCapacityCtrl = TextEditingController();
  bool shadingPresent = false;
  bool extraStructureNeeded = false;

  bool _isSaving = false;
  bool _isUploading = false;
  
  Map<String, String> uploadedDocs = {};
  Map<String, String> geotags = {};
  Map<String, String> docStatuses = {};
  Map<String, String> docRejectReasons = {};
  bool _isMarkedDone = false;
  final ImagePicker _picker = ImagePicker();

  @override
  void dispose() {
    _availableAreaCtrl.dispose();
    _roofLengthCtrl.dispose();
    _roofWidthCtrl.dispose();
    _estimatedCapacityCtrl.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    _fetchDocuments();
  }

  Future<void> _fetchDocuments() async {
    try {
      final response = await ApiService.get(Uri.parse('$baseUrl/api/mobile/jobs/${widget.jobId}/documents'));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final docs = data['documents'] as List<dynamic>;
        
        setState(() {
          for (var doc in docs) {
            final category = doc['category'] as String;
            uploadedDocs[category] = doc['url'];
            docStatuses[category] = doc['status'] ?? 'PENDING';
            if (doc['rejection_reason'] != null) {
              docRejectReasons[category] = doc['rejection_reason'];
            }
          }
        });
      }
    } catch (e) {
      print("Error fetching docs: $e");
    }
  }

  Future<void> _markJobDone() async {
    setState(() => _isSaving = true);
    try {
      final response = await ApiService.post(
        Uri.parse('$baseUrl/api/mobile/update-status'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'type': 'JOB',
          'id': int.tryParse(widget.jobId),
          'status': 'COMPLETED',
          'notes': 'Marked as completed by field worker via mobile app.',
        }),
      );
      if (response.statusCode == 200) {
        setState(() => _isMarkedDone = true);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('✅ Job marked as completed!'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to update job status.')));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Connection error.')));
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _saveChecklist() async {
    setState(() => _isSaving = true);
    try {
      final checklistData = {
        'serviceWireStatus': serviceWireStatus,
        'wifiConfigured': wifiConfigured,
        'roof_type': roofType,
        'roof_condition': roofCondition,
        'available_area': double.tryParse(_availableAreaCtrl.text),
        'roof_length': double.tryParse(_roofLengthCtrl.text),
        'roof_width': double.tryParse(_roofWidthCtrl.text),
        'estimated_capacity': double.tryParse(_estimatedCapacityCtrl.text),
        'shading': shadingPresent,
        'extra_structure': extraStructureNeeded,
      };

      final response = await ApiService.post(
        Uri.parse('$baseUrl/api/mobile/jobs/checklist'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'job_id': widget.jobId,
          'checklist_data': checklistData,
        }),
      );

      if (response.statusCode == 200) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Checklist saved!')));
      } else {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to save checklist.')));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Connection error')));
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  void _onCheckChanged(Function(bool) updateFn, bool? val) {
    if (val != null) {
      updateFn(val);
      _saveChecklist();
    }
  }

  Future<void> _uploadFile(String docKey, bool useCamera, String title) async {
    File? fileToUpload;
    String geotagText = "GPS LOCATION OFF";
    
    if (useCamera) {
      // 1. Check Location Permissions
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Location services are disabled.')));
        return;
      }
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) return;
      }

      Position? position;
      try {
        position = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
      } catch (e) {
        // Ignore
      }

      final XFile? photo = await _picker.pickImage(source: ImageSource.camera);
      if (photo != null) {
        setState(() => _isUploading = true);
        
        try {
          final bytes = await photo.readAsBytes();
          img.Image? originalImage = img.decodeImage(bytes);
          
          if (originalImage != null) {
            // Resize to save bandwidth and normalize font sizes
            if (originalImage.width > 1200) {
              originalImage = img.copyResize(originalImage, width: 1200);
            }

            String latLon = position != null ? "Lat: ${position.latitude.toStringAsFixed(5)}, Lon: ${position.longitude.toStringAsFixed(5)}" : "GPS LOCATION OFF";
            
            final now = DateTime.now();
            final minute = now.minute.toString().padLeft(2, '0');
            String timeStamp = "${now.day}/${now.month}/${now.year}, ${now.hour}:$minute";
            
            String textToDraw = "$title\n$latLon\n$timeStamp";
            geotagText = "$latLon\nCaptured: $timeStamp";
            
            // Draw background rectangle at bottom
            int rectHeight = 200;
            img.fillRect(
              originalImage, 
              x1: 0, 
              y1: originalImage.height - rectHeight, 
              x2: originalImage.width, 
              y2: originalImage.height, 
              color: img.ColorRgba8(0, 0, 0, 180)
            );
            
            // Draw yellow text
            img.drawString(
              originalImage, 
              textToDraw, 
              font: img.arial48, 
              x: 20, 
              y: originalImage.height - 180, 
              color: img.ColorRgb8(255, 215, 0)
            );

            final watermarkedBytes = img.encodeJpg(originalImage, quality: 85);
            
            final tempDir = Directory.systemTemp;
            final tempFile = File('${tempDir.path}/watermarked_${DateTime.now().millisecondsSinceEpoch}.jpg');
            await tempFile.writeAsBytes(watermarkedBytes);
            fileToUpload = tempFile;
          } else {
             fileToUpload = File(photo.path);
          }
        } catch (e) {
          // Fallback to raw photo if watermarking fails
          fileToUpload = File(photo.path);
        }
      }
    } else {
      // Pick from gallery (images)
      final XFile? picked = await _picker.pickImage(source: ImageSource.gallery);
      if (picked != null) {
        fileToUpload = File(picked.path);
        geotagText = "Uploaded from gallery";
      }
    }

    if (fileToUpload == null) {
      if (useCamera) setState(() => _isUploading = false);
      return;
    }

    if (!useCamera) setState(() => _isUploading = true);

    try {
      var request = await ApiService.multipartRequest('POST', Uri.parse('$baseUrl/api/mobile/upload'));
      request.fields['job_id'] = widget.jobId;
      request.fields['document_type'] = docKey;
      request.files.add(await http.MultipartFile.fromPath('file', fileToUpload.path));

      var response = await request.send();
      if (response.statusCode == 200) {
        final respStr = await response.stream.bytesToString();
        final decoded = jsonDecode(respStr);
        setState(() {
          uploadedDocs[docKey] = decoded['url'];
          geotags[docKey] = geotagText;
          docStatuses[docKey] = 'PENDING';
          docRejectReasons.remove(docKey);
        });
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Upload successful!')));
      } else {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Upload failed!')));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Upload error!')));
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  Widget _buildUploadRow(String title, String docKey) {
    bool isUploaded = uploadedDocs.containsKey(docKey);
    String status = docStatuses[docKey] ?? 'PENDING';
    String? rejectReason = docRejectReasons[docKey];
    String? geotagInfo = geotags[docKey];
    String imageUrl = isUploaded ? "$baseUrl${uploadedDocs[docKey]}" : "";

    bool isRejected = status == 'REJECTED';
    bool isApproved = status == 'APPROVED';
    bool canUpload = !isUploaded || isRejected;

    Color borderColor = isApproved ? Colors.green.shade400 : (isRejected ? Colors.red.shade400 : (isUploaded ? Colors.green.shade200 : Colors.grey.shade300));
    Color bgColor = isApproved ? Colors.green.withOpacity(0.05) : (isRejected ? Colors.red.withOpacity(0.05) : (isUploaded ? Colors.green.withOpacity(0.02) : Colors.grey.withOpacity(0.02)));

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8.0),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor, width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      Icon(
                        isApproved ? Icons.verified : (isRejected ? Icons.cancel : (isUploaded ? Icons.check_circle : Icons.upload_file)),
                        color: isApproved ? Colors.green.shade600 : (isRejected ? Colors.red : (isUploaded ? Colors.green : Colors.grey)),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          title,
                          style: GoogleFonts.hankenGrotesk(
                            fontSize: 15,
                            fontWeight: isUploaded ? FontWeight.w600 : FontWeight.normal,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                if (canUpload)
                  Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.camera_alt, color: Colors.blue),
                        onPressed: () => _uploadFile(docKey, true, title),
                        tooltip: 'Take Photo',
                      ),
                      IconButton(
                        icon: const Icon(Icons.folder, color: Colors.orange),
                        onPressed: () => _uploadFile(docKey, false, title),
                        tooltip: 'Choose File',
                      ),
                    ],
                  )
              ],
            ),
            if (isRejected && rejectReason != null)
              Padding(
                padding: const EdgeInsets.only(top: 8.0, bottom: 4.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.warning_amber_rounded, color: Colors.red, size: 16),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        "Rejected: $rejectReason\nPlease re-upload.",
                        style: TextStyle(color: Colors.red.shade700, fontSize: 13, fontWeight: FontWeight.w500),
                      ),
                    ),
                  ],
                ),
              ),
            if (isUploaded) ...[
              const Divider(height: 16),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      imageUrl,
                      width: 64,
                      height: 64,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Container(
                        width: 64,
                        height: 64,
                        color: Colors.grey.shade200,
                        child: const Icon(Icons.broken_image, color: Colors.grey),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (geotagInfo != null) ...[
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Icon(
                                Icons.location_on,
                                size: 16,
                                color: geotagInfo.contains("GPS LOCATION OFF") ? Colors.red : Colors.green,
                              ),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  geotagInfo.split('\n')[0],
                                  style: GoogleFonts.hankenGrotesk(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                    color: Colors.grey.shade800,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          if (geotagInfo.split('\n').length > 1) ...[
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(Icons.access_time, size: 16, color: Colors.grey),
                                const SizedBox(width: 4),
                                Text(
                                  geotagInfo.split('\n')[1],
                                  style: GoogleFonts.hankenGrotesk(
                                    fontSize: 11,
                                    color: Colors.grey.shade600,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ] else ...[
                          Row(
                            children: [
                              const Icon(Icons.info_outline, size: 16, color: Colors.grey),
                              const SizedBox(width: 4),
                              Text(
                                "Document uploaded successfully",
                                style: GoogleFonts.hankenGrotesk(fontSize: 12, color: Colors.grey.shade600),
                              ),
                            ],
                          ),
                        ]
                      ],
                    ),
                  ),
                ],
              ),
            ]
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.isSurvey ? 'Survey Details' : 'Installation Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh Statuses',
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Refreshing statuses...')));
              _fetchDocuments();
            },
          ),
          if (_isSaving || _isUploading)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
            )
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            widget.customerName,
            style: GoogleFonts.hankenGrotesk(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text('Job ID: ${widget.jobId}', style: const TextStyle(fontFamily: 'JetBrains Mono', color: Colors.grey)),
          const Divider(height: 24),

          if (widget.isSurvey) ...[
            // DOCUMENTS ATTACHMENT UPLOADS
            Text('Document & Photo Uploads', style: GoogleFonts.hankenGrotesk(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            
            _buildUploadRow('PSPCL Electricity Bill', 'pspclBill'),
            _buildUploadRow('Customer / Site Photo', 'photoUploaded'),
            _buildUploadRow('Aadhaar Card Copy', 'aadhaarCard'),
            _buildUploadRow('Cancelled Cheque', 'cancelledCheque'),
            _buildUploadRow('Signed Agreement', 'agreementSigned'),

            const SizedBox(height: 24),

            // SITE SURVEY PHOTOS
            Text('Site Survey Photos', style: GoogleFonts.hankenGrotesk(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 4),
            Text('Take geotagged photos at the site.', style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
            const SizedBox(height: 8),
            _buildUploadRow('Roof / Installation Area', 'survey_roof'),
            _buildUploadRow('Front of Site / Building', 'survey_front'),
            _buildUploadRow('Electricity Meter', 'survey_meter'),
            _buildUploadRow('Earthing / Wiring Setup', 'survey_earthing'),

            const SizedBox(height: 24),
            Text('Survey Details', style: GoogleFonts.hankenGrotesk(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: roofType,
              decoration: const InputDecoration(labelText: 'Roof Type', border: OutlineInputBorder()),
              items: ['Flat', 'Tilted', 'Asbestos Sheet', 'Metal Sheet', 'Concrete', 'Tile']
                  .map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
              onChanged: (v) { if (v != null) setState(() => roofType = v); _saveChecklist(); },
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: roofCondition,
              decoration: const InputDecoration(labelText: 'Roof Condition', border: OutlineInputBorder()),
              items: ['Excellent', 'Good', 'Fair', 'Poor']
                  .map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
              onChanged: (v) { if (v != null) setState(() => roofCondition = v); _saveChecklist(); },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _availableAreaCtrl,
              decoration: const InputDecoration(labelText: 'Available Area (sq ft)', border: OutlineInputBorder()),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: TextFormField(controller: _roofLengthCtrl, decoration: const InputDecoration(labelText: 'Length (ft)', border: OutlineInputBorder()), keyboardType: TextInputType.number)),
                const SizedBox(width: 12),
                Expanded(child: TextFormField(controller: _roofWidthCtrl, decoration: const InputDecoration(labelText: 'Width (ft)', border: OutlineInputBorder()), keyboardType: TextInputType.number)),
              ],
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _estimatedCapacityCtrl,
              decoration: const InputDecoration(labelText: 'Estimated Capacity (kW)', border: OutlineInputBorder()),
              keyboardType: TextInputType.number,
            ),
            SwitchListTile(
              title: const Text('Shading Present?'),
              value: shadingPresent,
              onChanged: (v) => _onCheckChanged((val) => setState(() => shadingPresent = val), v),
            ),
            SwitchListTile(
              title: const Text('Extra Structure Needed?'),
              value: extraStructureNeeded,
              onChanged: (v) => _onCheckChanged((val) => setState(() => extraStructureNeeded = val), v),
            ),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: _saveChecklist,
              child: const Text('Save Survey Details'),
            ),
          ] else ...[
            // INSTALLATION PHOTOS
            Text('Installation Photos', style: GoogleFonts.hankenGrotesk(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 4),
            Text('Take required installation photos.', style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
            const SizedBox(height: 8),
            _buildUploadRow('Installed Set Photo', 'installed_set_photo'),
            _buildUploadRow('Earthing Photo', 'earthing_photo'),
            _buildUploadRow('Finishing Photo', 'finishing_photo'),
            _buildUploadRow('Final Photo with Customer', 'customer_final_photo'),
            
            const SizedBox(height: 24),
            // INSTALLATION CHECKPOINTS
            Text('Installation Quality Checks', style: GoogleFonts.hankenGrotesk(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            CheckboxListTile(
              title: const Text('Check WiFi Attached (Yes / No)'),
              subtitle: Text(wifiConfigured ? 'Yes (WiFi Attached)' : 'No (WiFi Not Attached)'),
              value: wifiConfigured,
              onChanged: (val) => _onCheckChanged((v) => setState(() => wifiConfigured = v), val),
            ),
          ],

          const SizedBox(height: 32),

          // MARK AS DONE BUTTON
          SizedBox(
            width: double.infinity,
            child: _isMarkedDone
                ? Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.green.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.green.shade300),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.check_circle, color: Colors.green),
                        const SizedBox(width: 8),
                        Text('Job Completed!', style: GoogleFonts.hankenGrotesk(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 16)),
                      ],
                    ),
                  )
                : ElevatedButton.icon(
                    onPressed: _isSaving ? null : _markJobDone,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green.shade600,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: _isSaving
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Icon(Icons.check_circle_outline),
                    label: Text(_isSaving ? 'Saving...' : 'Mark Job as Done', style: GoogleFonts.hankenGrotesk(fontWeight: FontWeight.bold, fontSize: 16)),
                  ),
          ),
          const SizedBox(height: 36),
        ],
      ),
    );
  }
}
