import 'dart:io';
import 'dart:ui' as ui;
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../services/api_service.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../main.dart' show baseUrl;
import 'product_picker_screen.dart';
import 'quotation_screen.dart';
class OnGridBookingForm extends StatefulWidget {
  const OnGridBookingForm({super.key});

  @override
  State<OnGridBookingForm> createState() => _OnGridBookingFormState();
}

class _OnGridBookingFormState extends State<OnGridBookingForm> {
  final _formKey = GlobalKey<FormState>();

  // Customer fields
  final _customerNameCtrl = TextEditingController();
  final _mobileNumberCtrl = TextEditingController();
  final _emailIdCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  final _districtCtrl = TextEditingController();
  final _stateCtrl = TextEditingController();

  // Technical fields
  String connectionPhase = 'Single Phase';
  final _pspclSubDivisionCtrl = TextEditingController();
  final _pspclAccountNoCtrl = TextEditingController();
  final _sanctionedLoadCtrl = TextEditingController();
  final _proposedLoadCtrl = TextEditingController();

  // Payments
  final _bookingAmountCtrl = TextEditingController();
  final _materialAdvanceCtrl = TextEditingController();
  final _balanceAmountCtrl = TextEditingController();
  final _totalAmountCtrl = TextEditingController();

  @override
  void dispose() {
    _customerNameCtrl.dispose();
    _mobileNumberCtrl.dispose();
    _emailIdCtrl.dispose();
    _addressCtrl.dispose();
    _cityCtrl.dispose();
    _districtCtrl.dispose();
    _stateCtrl.dispose();
    _pspclSubDivisionCtrl.dispose();
    _pspclAccountNoCtrl.dispose();
    _sanctionedLoadCtrl.dispose();
    _proposedLoadCtrl.dispose();
    _bookingAmountCtrl.dispose();
    _materialAdvanceCtrl.dispose();
    _balanceAmountCtrl.dispose();
    _totalAmountCtrl.dispose();
    super.dispose();
  }

  // Geotag Photo
  File? _sitePhoto;
  String _geotagLocation = '';
  bool _isGettingLocation = false;
  bool _isSubmitting = false;

  // Selected inventory
  List<SelectedProduct> _selectedProducts = [];

  Future<void> _capturePhoto() async {
    // Validate: customer name must be filled before geotagging
    if (_customerNameCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('⚠️ Please enter the Customer Name before capturing a geotagged photo.'),
          backgroundColor: Colors.orange,
          duration: Duration(seconds: 3),
        ),
      );
      return;
    }

    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.camera);

    if (image != null) {
      setState(() {
        _isGettingLocation = true;
      });

      // 1. Get Location First
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      LocationPermission permission;
      String latlong = "GPS LOCATION OFF";

      if (serviceEnabled) {
        permission = await Geolocator.checkPermission();
        if (permission == LocationPermission.denied) {
          permission = await Geolocator.requestPermission();
        }
        if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
          try {
            Position position = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
            latlong = 'Lat: ${position.latitude.toStringAsFixed(5)}, Lng: ${position.longitude.toStringAsFixed(5)}';
          } catch (e) {
            latlong = 'Location Error';
          }
        }
      }

      // 2. Load Image to Memory & Resize (max 1200px, same as web geotag app)
      const int maxSize = 1200;
      final Uint8List bytes = await image.readAsBytes();
      final ui.Codec sizeCodec = await ui.instantiateImageCodec(bytes);
      final ui.FrameInfo sizeFrame = await sizeCodec.getNextFrame();
      final int origW = sizeFrame.image.width;
      final int origH = sizeFrame.image.height;

      int targetW = origW;
      int targetH = origH;
      if (origW > origH) {
        if (origW > maxSize) { targetH = (origH * maxSize ~/ origW); targetW = maxSize; }
      } else {
        if (origH > maxSize) { targetW = (origW * maxSize ~/ origH); targetH = maxSize; }
      }

      final ui.Codec codec = await ui.instantiateImageCodec(bytes, targetWidth: targetW, targetHeight: targetH);
      final ui.FrameInfo frameInfo = await codec.getNextFrame();
      final ui.Image rawImage = frameInfo.image;

      // 3. Create Canvas
      final ui.PictureRecorder recorder = ui.PictureRecorder();
      final Canvas canvas = Canvas(recorder, Rect.fromLTWH(0, 0, rawImage.width.toDouble(), rawImage.height.toDouble()));

      // Draw original image
      canvas.drawImage(rawImage, Offset.zero, Paint());

      // 4. Draw Watermark Text
      final double fontSize = rawImage.width * 0.035 > 16 ? rawImage.width * 0.035 : 16;
      final textStyle = ui.TextStyle(
        color: const Color(0xFFFFFFFF),
        fontSize: fontSize,
        fontWeight: FontWeight.bold,
        shadows: [
          const Shadow(color: Color(0xFF000000), blurRadius: 6, offset: Offset(2, 2)),
          const Shadow(color: Color(0xFF000000), blurRadius: 6, offset: Offset(-2, -2)),
        ],
      );
      
      final paragraphStyle = ui.ParagraphStyle(textAlign: TextAlign.left);
      final paragraphBuilder = ui.ParagraphBuilder(paragraphStyle)
        ..pushStyle(textStyle)
        ..addText('Customer: ${_customerNameCtrl.text.isEmpty ? "Unknown" : _customerNameCtrl.text}\n')
        ..addText('$latlong\n')
        ..addText('Date: ${DateTime.now().toString().split('.')[0]}');
        
      final paragraph = paragraphBuilder.build();
      paragraph.layout(ui.ParagraphConstraints(width: rawImage.width.toDouble() - 30));
      
      // Draw at the bottom left
      final double yPos = rawImage.height - (fontSize * 4.5);
      canvas.drawParagraph(paragraph, Offset(15, yPos));

      // 5. Save Watermarked Image as PNG
      final ui.Image watermarkedImage = await recorder.endRecording().toImage(rawImage.width, rawImage.height);
      final ByteData? byteData = await watermarkedImage.toByteData(format: ui.ImageByteFormat.png);
      final Uint8List pngBytes = byteData!.buffer.asUint8List();
      
      final directory = await getTemporaryDirectory();
      final String tempPath = '${directory.path}/watermark_${DateTime.now().millisecondsSinceEpoch}.png';
      File watermarkedFile = File(tempPath);
      await watermarkedFile.writeAsBytes(pngBytes);

      setState(() {
        _sitePhoto = watermarkedFile;
        _geotagLocation = latlong;
        _isGettingLocation = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('New On-Grid Booking'),
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
            Text(
              'Excellent Solar KKP On-Grid Booking Form',
              style: GoogleFonts.hankenGrotesk(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const Divider(),
            const SizedBox(height: 8),

            // CUSTOMER PROFILE
            const Text(
              '1. Customer Profile',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _customerNameCtrl,
              decoration: const InputDecoration(
                labelText: 'Customer Name *',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _mobileNumberCtrl,
              decoration: const InputDecoration(
                labelText: 'Mobile Number *',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.phone,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _emailIdCtrl,
              decoration: const InputDecoration(
                labelText: 'Email (Optional)',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _addressCtrl,
              maxLines: 2,
              decoration: const InputDecoration(
                labelText: 'Address *',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _cityCtrl,
              decoration: const InputDecoration(
                labelText: 'City *',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _districtCtrl,
              decoration: const InputDecoration(
                labelText: 'District *',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _stateCtrl,
              decoration: const InputDecoration(
                labelText: 'State *',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 24),

            // SITE PHOTO & GEOTAG
            const Text(
              '2. Site Verification (Geotag)',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 8),
            Container(
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade400),
                borderRadius: BorderRadius.circular(8),
              ),
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  if (_sitePhoto != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 16.0),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.file(_sitePhoto!, height: 150, width: double.infinity, fit: BoxFit.cover),
                      ),
                    ),
                  if (_isGettingLocation)
                    const CircularProgressIndicator()
                  else if (_geotagLocation.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 16.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.location_on, color: Colors.green),
                          const SizedBox(width: 8),
                          Expanded(child: Text(_geotagLocation, style: const TextStyle(fontWeight: FontWeight.bold))),
                        ],
                      ),
                    ),
                  ElevatedButton.icon(
                    onPressed: _capturePhoto,
                    icon: const Icon(Icons.camera_alt),
                    label: Text(_sitePhoto == null ? 'Capture Site Photo & Geotag' : 'Retake Photo'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // TECHNICAL DETAILS
            const Text(
              '3. Connection & Grid Details',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _pspclSubDivisionCtrl,
              decoration: const InputDecoration(
                labelText: 'PSPCL Sub-Division *',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _pspclAccountNoCtrl,
              decoration: const InputDecoration(
                labelText: 'PSPCL Account No. *',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: connectionPhase,
                    decoration: const InputDecoration(
                      labelText: 'Phase Type',
                      border: OutlineInputBorder(),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'Single Phase', child: Text('Single Phase')),
                      DropdownMenuItem(value: '3 Phase', child: Text('3 Phase')),
                    ],
                    onChanged: (val) => setState(() => connectionPhase = val!),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _sanctionedLoadCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Sanctioned Load (kW)',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _proposedLoadCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Proposed Load (kW)',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // HARDWARE CONFIG
            const Text(
              '4. Solar Hardware Configuration',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 8),
            
            // Selected products list
            if (_selectedProducts.isNotEmpty)
              Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Selected Items:', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blue)),
                    const SizedBox(height: 8),
                    ..._selectedProducts.map((s) => Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text('${s.product.name} (${s.product.brand})', style: const TextStyle(fontSize: 13)),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.blue.shade50,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text('${s.quantity} ${s.product.unit}', 
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.blue)),
                          ),
                        ],
                      ),
                    )),
                  ],
                ),
              ),

            // Select Inventory button
            SizedBox(
              width: double.infinity,
              height: 50,
              child: OutlinedButton.icon(
                onPressed: () async {
                  final result = await Navigator.push<List<SelectedProduct>>(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ProductPickerScreen(initialSelection: _selectedProducts),
                    ),
                  );
                  if (result != null) {
                    setState(() {
                      _selectedProducts = result;
                    });
                  }
                },
                icon: const Icon(Icons.inventory_2),
                label: Text(_selectedProducts.isEmpty ? 'Select Products from Inventory' : 'Modify Selected Products'),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.blue),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // ADVANCE & BOOKING PRICING
            const Text(
              '5. Payment Schedule Details',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _bookingAmountCtrl,
              decoration: const InputDecoration(
                labelText: '1st Booking Amount (₹)',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _materialAdvanceCtrl,
              decoration: const InputDecoration(
                labelText: '2nd Material Advance (₹)',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _balanceAmountCtrl,
              decoration: const InputDecoration(
                labelText: '3rd Installation Balance (₹)',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _totalAmountCtrl,
              decoration: const InputDecoration(
                labelText: 'Total Price (₹)',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 24),

            // SUBMIT ACTIONS
            OutlinedButton.icon(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => QuotationScreen(
                      customerName: _customerNameCtrl.text,
                      mobileNumber: _mobileNumberCtrl.text,
                      capacityKw: _proposedLoadCtrl.text,
                    ),
                  ),
                );
              },
              icon: const Icon(Icons.picture_as_pdf, color: Colors.amber),
              label: const Text('Generate PDF Quotation for Selected Products', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.amber)),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Colors.amber, width: 1.5),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF7C5800),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              onPressed: _isSubmitting ? null : () async {
                if (_formKey.currentState!.validate()) {
                  if (_sitePhoto == null) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Please capture a site photo!')),
                    );
                    return;
                  }
                  
                  setState(() => _isSubmitting = true);
                  try {
                    var request = await ApiService.multipartRequest('POST', Uri.parse('$baseUrl/api/mobile/bookings'));
                    
                    // Add text fields
                    request.fields['customerName'] = _customerNameCtrl.text;
                    request.fields['mobileNumber'] = _mobileNumberCtrl.text;
                    request.fields['emailId'] = _emailIdCtrl.text;
                    request.fields['address'] = _addressCtrl.text;
                    request.fields['connectionType'] = 'On-Grid';
                    request.fields['pspclSubDivision'] = _pspclSubDivisionCtrl.text;
                    request.fields['pspclAccountNo'] = _pspclAccountNoCtrl.text;
                    request.fields['connectionPhase'] = connectionPhase;
                    request.fields['sanctionedLoad'] = _sanctionedLoadCtrl.text;
                    request.fields['proposedLoad'] = _proposedLoadCtrl.text;
                    request.fields['panelType'] = 'Top-con';
                    request.fields['panelMake'] = '';
                    request.fields['panelWattage'] = '0.0';
                    request.fields['inverterCapacityMake'] = '';
                    request.fields['numberOfPanels'] = '0';
                    request.fields['bookingAmount'] = _bookingAmountCtrl.text;
                    request.fields['materialAdvance'] = _materialAdvanceCtrl.text;
                    request.fields['balanceAmount'] = _balanceAmountCtrl.text;
                    request.fields['totalAmount'] = _totalAmountCtrl.text;
                    request.fields['geotag'] = _geotagLocation;

                    // Include the logged-in worker's ID for created_by
                    final prefs = await SharedPreferences.getInstance();
                    final workerId = prefs.getInt('worker_id') ?? 1;
                    request.fields['workerId'] = workerId.toString();

                    // Send selected inventory reservations as JSON
                    if (_selectedProducts.isNotEmpty) {
                      request.fields['reservations'] = jsonEncode(
                        _selectedProducts.map((s) => s.toJson()).toList(),
                      );
                    }

                    // Add image file
                    if (_sitePhoto != null) {
                      request.files.add(await http.MultipartFile.fromPath('sitePhoto', _sitePhoto!.path));
                    }

                    var streamedResponse = await request.send();
                    var response = await http.Response.fromStream(streamedResponse);

                    if (response.statusCode == 200 || response.statusCode == 201) {
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Booking created successfully!')),
                        );
                        // Reset the form instead of popping since this is a main tab
                        _formKey.currentState?.reset();
                        setState(() {
                          _sitePhoto = null;
                          _geotagLocation = '';
                          _selectedProducts.clear();
                        });
                      }
                    } else {
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Failed to create booking.')),
                        );
                      }
                    }
                  } catch (e) {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Connection error')),
                      );
                    }
                  } finally {
                    if (mounted) setState(() => _isSubmitting = false);
                  }
                }
              },
              child: _isSubmitting 
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('Save and Create Booking Record'),
            ),
            const SizedBox(height: 48),
          ],
        ),
       ),
      ),
    );
  }
}
