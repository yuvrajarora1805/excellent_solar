import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';
import '../main.dart' show baseUrl;

// ─── Data Models ───────────────────────────────────────────────────────────
class Project {
  final int id;
  final String idStr;
  final String customerName;
  final String customerMobile;
  final String customerCity;
  final String customerAddress;
  final String capacityKw;

  Project({
    required this.id,
    required this.idStr,
    required this.customerName,
    required this.customerMobile,
    required this.customerCity,
    required this.customerAddress,
    required this.capacityKw,
  });

  factory Project.fromJson(Map<String, dynamic> j) {
    return Project(
      id: j['id'] ?? 0,
      idStr: j['id_str'] ?? '',
      customerName: j['customer_name'] ?? '',
      customerMobile: j['customer_mobile'] ?? '',
      customerCity: j['customer_city'] ?? '',
      customerAddress: j['customer_address'] ?? '',
      capacityKw: j['capacity_kw']?.toString() ?? '',
    );
  }
}

class InventoryProduct {
  final int id;
  final String productCode;
  final String name;
  final String category;
  final String brand;
  final String specification;
  final String unit;
  final int availableStock;

  InventoryProduct({
    required this.id,
    required this.productCode,
    required this.name,
    required this.category,
    required this.brand,
    required this.specification,
    required this.unit,
    required this.availableStock,
  });

  factory InventoryProduct.fromJson(Map<String, dynamic> j) {
    int stock = 0;
    if (j['available_stock'] != null) {
      stock = int.tryParse(j['available_stock'].toString()) ?? 0;
    } else if (j['current_stock'] != null) {
      stock = int.tryParse(j['current_stock'].toString()) ?? 0;
    }
    return InventoryProduct(
      id: j['id'] ?? 0,
      productCode: j['product_code'] ?? '',
      name: j['name'] ?? '',
      category: j['category'] ?? '',
      brand: j['brand'] ?? '',
      specification: j['specification'] ?? '',
      unit: j['unit'] ?? 'Piece',
      availableStock: stock,
    );
  }
}

class LineItem {
  String description;
  String quantity;
  String brand;
  String unit; // "Description" column in the table

  LineItem({
    this.description = '',
    this.quantity = '0',
    this.brand = '',
    this.unit = '',
  });
}

// ─── Main Screen ────────────────────────────────────────────────────────────
class QuotationScreen extends StatefulWidget {
  final String customerName;
  final String mobileNumber;
  final String capacityKw;
  final int? projectId;

  const QuotationScreen({
    super.key,
    this.customerName = '',
    this.mobileNumber = '',
    this.capacityKw = '',
    this.projectId,
  });

  @override
  State<QuotationScreen> createState() => _QuotationScreenState();
}

class _QuotationScreenState extends State<QuotationScreen> {
  // Controllers
  late TextEditingController _locationCtrl;
  late TextEditingController _capacityCtrl;
  late TextEditingController _rateCtrl;
  late TextEditingController _totalCostCtrl;
  late TextEditingController _gstCtrl;

  String _systemType = 'ONGRID_SOLAR';
  bool _isGenerating = false;

  // Inventory & Projects
  List<InventoryProduct> _inventoryProducts = [];
  bool _loadingInventory = true;
  
  List<Project> _projects = [];
  bool _loadingProjects = true;
  Project? _selectedProject;

  // Default items — same as the web
  List<LineItem> _items = [
    LineItem(description: 'SOLAR PANELS', quantity: '0', brand: 'WAAREE TOPCON', unit: '615 W'),
    LineItem(description: 'INVERTER', quantity: '0', brand: 'WAAREE/LUMINOUS', unit: '8 YEARS WARRANTY'),
    LineItem(description: 'EARTHING', quantity: '0', brand: '3 METER', unit: 'COPPER BONDED WITH CHEMICAL'),
    LineItem(description: 'LIGHTNING ARRESTER', quantity: '0', brand: '1 METER', unit: 'COPPER BONDED'),
    LineItem(description: 'STRUCTURE', quantity: '0', brand: '70 MM HEIGHT', unit: 'ALUMINIUM'),
    LineItem(description: 'EARTHING WIRE', quantity: '0', brand: 'HAVELLS', unit: '4 MM & 6MM'),
    LineItem(description: 'SERVICE WIRE', quantity: '0', brand: 'AS PER PSPCL', unit: '150 MM ALUMINIUM'),
    LineItem(description: 'DC WIRE', quantity: '0', brand: 'WAAREE/HAVELLS', unit: '6 MM'),
    LineItem(description: 'ACDB', quantity: '0', brand: 'HAVELLS', unit: ''),
    LineItem(description: 'DCDB', quantity: '0', brand: 'N.A', unit: ''),
  ];

  @override
  void initState() {
    super.initState();
    _locationCtrl = TextEditingController(text: 'JALALABAD');
    _capacityCtrl = TextEditingController(text: widget.capacityKw.isNotEmpty ? widget.capacityKw : '200');
    _rateCtrl = TextEditingController(text: '23.50');
    _totalCostCtrl = TextEditingController();
    _gstCtrl = TextEditingController(text: '8.9');
    _fetchInventory();
    _fetchProjects();
  }

  @override
  void dispose() {
    _locationCtrl.dispose();
    _capacityCtrl.dispose();
    _rateCtrl.dispose();
    _totalCostCtrl.dispose();
    _gstCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchInventory() async {
    try {
      final response = await ApiService.get(Uri.parse('$baseUrl/api/inventory/products'));
      if (response.statusCode == 200) {
        final dynamic decoded = jsonDecode(response.body);
        List<dynamic> data;
        if (decoded is List) {
          data = decoded;
        } else if (decoded is Map && decoded['products'] != null) {
          data = decoded['products'] as List;
        } else {
          data = [];
        }
        setState(() {
          _inventoryProducts = data.map((e) => InventoryProduct.fromJson(e)).toList();
          _loadingInventory = false;
        });
      } else {
        setState(() => _loadingInventory = false);
      }
    } catch (e) {
      setState(() => _loadingInventory = false);
    }
  }

  Future<void> _fetchProjects() async {
    try {
      final response = await ApiService.get(Uri.parse('$baseUrl/api/projects?limit=1000'));
      if (response.statusCode == 200) {
        final dynamic decoded = jsonDecode(response.body);
        List<dynamic> data = [];
        if (decoded is Map && decoded['projects'] != null) {
          data = decoded['projects'] as List;
        } else if (decoded is List) {
          data = decoded;
        }
        setState(() {
          _projects = data.map((e) => Project.fromJson(e)).toList();
          _loadingProjects = false;

          // Auto-select project if passed in
          if (widget.projectId != null) {
            final match = _projects.where((p) => p.id == widget.projectId).toList();
            if (match.isNotEmpty) {
              _onProjectSelected(match.first);
            }
          } else if (widget.customerName.isNotEmpty) {
            final match = _projects.where((p) => p.customerName.toLowerCase() == widget.customerName.toLowerCase()).toList();
            if (match.isNotEmpty) {
              _onProjectSelected(match.first);
            }
          }
        });
      } else {
        setState(() => _loadingProjects = false);
      }
    } catch (e) {
      setState(() => _loadingProjects = false);
    }
  }

  void _onProjectSelected(Project? p) {
    setState(() {
      _selectedProject = p;
      if (p != null) {
        final addressParts = [p.customerAddress, p.customerCity].where((e) => e.isNotEmpty).join(', ');
        if (addressParts.isNotEmpty) _locationCtrl.text = addressParts;
        if (p.capacityKw.isNotEmpty && p.capacityKw != '0') _capacityCtrl.text = p.capacityKw;
      }
    });
  }

  int get _calculatedTotal {
    final cap = double.tryParse(_capacityCtrl.text) ?? 0;
    final rate = double.tryParse(_rateCtrl.text) ?? 0;
    return (cap * 1000 * rate).round();
  }

  int get _finalTotal {
    final override = int.tryParse(_totalCostCtrl.text);
    return override ?? _calculatedTotal;
  }

  void _showAddItemDialog() {
    InventoryProduct? selectedProduct;
    final qtyCtrl = TextEditingController(text: '1');
    final brandCtrl = TextEditingController();
    final specCtrl = TextEditingController();
    TextEditingController? searchController;
    
    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: const Color(0xFFFFFFFF),
              title: Text('Add Material', style: GoogleFonts.inter(color: Color(0xDD000000), fontWeight: FontWeight.bold)),
              content: SizedBox(
                width: MediaQuery.of(context).size.width * 0.9,
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Autocomplete<InventoryProduct>(
                        displayStringForOption: (p) {
                          if (p.name.isNotEmpty) return p.name;
                          return p.productCode;
                        },
                        optionsBuilder: (textEditingValue) {
                          if (textEditingValue.text.isEmpty) return const Iterable<InventoryProduct>.empty();
                          final q = textEditingValue.text.toLowerCase();
                          return _inventoryProducts.where((p) => p.name.toLowerCase().contains(q) || p.productCode.toLowerCase().contains(q)).take(15);
                        },
                        onSelected: (p) {
                          setDialogState(() {
                            selectedProduct = p;
                            brandCtrl.text = p.brand.isNotEmpty ? p.brand : (p.category.isNotEmpty ? p.category : (p.productCode.isNotEmpty ? p.productCode : 'EXCELLENT'));
                            specCtrl.text = p.specification.isNotEmpty ? p.specification : p.unit;
                          });
                        },
                        fieldViewBuilder: (context, controller, focusNode, onEditingComplete) {
                          searchController = controller;
                          return _darkTextField(
                            label: 'Product Name / Description *',
                            controller: controller,
                            focusNode: focusNode,
                            hint: 'Type product name...',
                            onChanged: (val) {
                              if (val.isEmpty) setDialogState(() => selectedProduct = null);
                            }
                          );
                        },
                        optionsViewBuilder: (context, onSelected, options) {
                          return Align(
                            alignment: Alignment.topLeft,
                            child: Material(
                              color: const Color(0xFFF8F9FA),
                              elevation: 4,
                              borderRadius: BorderRadius.circular(8),
                              child: ConstrainedBox(
                                constraints: BoxConstraints(maxHeight: 250, maxWidth: MediaQuery.of(context).size.width * 0.7),
                                child: ListView.builder(
                                  padding: EdgeInsets.zero,
                                  shrinkWrap: true,
                                  itemCount: options.length,
                                  itemBuilder: (context, index) {
                                    final p = options.elementAt(index);
                                    return ListTile(
                                      title: Text(p.name, style: GoogleFonts.inter(color: Color(0xDD000000), fontSize: 13, fontWeight: FontWeight.bold)),
                                      subtitle: Text('${p.productCode} • ${p.brand}', style: GoogleFonts.inter(color: const Color(0xFF757575), fontSize: 11)),
                                      onTap: () => onSelected(p),
                                    );
                                  },
                                ),
                              ),
                            ),
                          );
                        }
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: _darkTextField(
                              label: 'Brand',
                              controller: brandCtrl,
                              hint: 'e.g. WAAREE',
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _darkTextField(
                              label: 'Quantity *',
                              controller: qtyCtrl,
                              keyboardType: TextInputType.number,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      _darkTextField(
                        label: 'Description / Spec',
                        controller: specCtrl,
                        hint: 'e.g. 540W Mono PERC',
                      ),
                    ],
                  ),
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text('Cancel', style: GoogleFonts.inter(color: const Color(0xFF757575))),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF7C5800), foregroundColor: const Color(0xFFF8F9FA)),
                  onPressed: () {
                    final desc = searchController?.text ?? '';
                    if (desc.isEmpty) return;
                    setState(() {
                      _items.add(LineItem(
                        description: desc,
                        quantity: qtyCtrl.text.isEmpty ? '1' : qtyCtrl.text,
                        brand: brandCtrl.text,
                        unit: specCtrl.text,
                      ));
                    });
                    Navigator.pop(context);
                  },
                  child: Text('Add to Quotation', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                ),
              ],
            );
          }
        );
      }
    );
  }

  void _removeItem(int idx) {
    setState(() => _items.removeAt(idx));
  }

  Future<void> _generatePdf() async {
    setState(() => _isGenerating = true);
    try {
      final payload = {
        'customer_name': widget.customerName,
        'mobile': widget.mobileNumber,
        'capacity_kw': _capacityCtrl.text,
        'system_type': _systemType,
        'location': _locationCtrl.text,
        'rate_per_watt': _rateCtrl.text,
        'gst_percentage': double.tryParse(_gstCtrl.text) ?? 8.9,
        'total_amount': _finalTotal,
        'remarks': _locationCtrl.text,
        'project_id': _selectedProject?.id ?? widget.projectId,
        'status': 'DRAFT',
        'items': _items.map((item) => {
          'description': item.description,
          'quantity': item.quantity,
          'brand': item.brand,
          'unit': item.unit,
          'unit_price': 0,
          'line_total': 0,
          'discount_amount': 0,
          'tax_amount': 0,
        }).toList(),
      };

      final response = await ApiService.post(
        Uri.parse('$baseUrl/api/mobile/quotations'),
        body: jsonEncode(payload),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final pdfPath = data['pdf_url'];
        final fullPdfUrl = '$baseUrl$pdfPath?print=true';

        if (await canLaunchUrl(Uri.parse(fullPdfUrl))) {
          await launchUrl(Uri.parse(fullPdfUrl), mode: LaunchMode.externalApplication);
        }

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('✅ Quotation created! PDF opened.')),
          );
        }
      } else {
        final err = jsonDecode(response.body);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('❌ ${err['error'] ?? 'Failed to generate quotation'}')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      setState(() => _isGenerating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        backgroundColor: const Color(0xFFFFFFFF),
        foregroundColor: Color(0xDD000000),
        title: Text(
          'Generate Solar Quotation',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: const Color(0xFFE0E0E0), height: 1),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── Customer & Project Info ──────────────────────────────────
            _sectionCard(
              title: 'Customer & Project Details',
              icon: Icons.person_outline,
              children: [
                _loadingProjects 
                  ? const Padding(padding: EdgeInsets.all(8.0), child: Text('Loading projects...', style: TextStyle(color: Color(0x8A000000))))
                  : Autocomplete<Project>(
                      displayStringForOption: (Project option) => '${option.idStr} - ${option.customerName}',
                      optionsBuilder: (TextEditingValue textEditingValue) {
                        if (textEditingValue.text.isEmpty) {
                          return const Iterable<Project>.empty();
                        }
                        return _projects.where((Project option) {
                          return option.customerName.toLowerCase().contains(textEditingValue.text.toLowerCase()) ||
                                 option.idStr.toLowerCase().contains(textEditingValue.text.toLowerCase());
                        });
                      },
                      onSelected: _onProjectSelected,
                      fieldViewBuilder: (context, controller, focusNode, onEditingComplete) {
                        // Pre-fill if a project is already selected
                        if (_selectedProject != null && controller.text.isEmpty) {
                          controller.text = '${_selectedProject!.idStr} - ${_selectedProject!.customerName}';
                        }
                        return _darkTextField(
                          label: 'Search Customer or Project ID',
                          controller: controller,
                          focusNode: focusNode,
                          hint: 'Type customer name...',
                          onChanged: (val) {
                            if (val.isEmpty && _selectedProject != null) {
                              setState(() => _selectedProject = null);
                            }
                          }
                        );
                      },
                      optionsViewBuilder: (context, onSelected, options) {
                        return Align(
                          alignment: Alignment.topLeft,
                          child: Material(
                            color: const Color(0xFFFFFFFF),
                            elevation: 4,
                            borderRadius: BorderRadius.circular(8),
                            child: ConstrainedBox(
                              constraints: BoxConstraints(maxHeight: 250, maxWidth: MediaQuery.of(context).size.width - 64),
                              child: ListView.builder(
                                padding: EdgeInsets.zero,
                                shrinkWrap: true,
                                itemCount: options.length,
                                itemBuilder: (BuildContext context, int index) {
                                  final Project option = options.elementAt(index);
                                  return ListTile(
                                    title: Text(option.customerName, style: GoogleFonts.inter(color: Color(0xDD000000), fontWeight: FontWeight.bold)),
                                    subtitle: Text(option.idStr, style: GoogleFonts.inter(color: const Color(0xFF757575))),
                                    onTap: () => onSelected(option),
                                  );
                                },
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                const SizedBox(height: 12),
                if (_selectedProject != null) ...[
                  _infoRow('Customer Name', _selectedProject!.customerName),
                  const SizedBox(height: 8),
                  _infoRow('Mobile', _selectedProject!.customerMobile.isNotEmpty ? _selectedProject!.customerMobile : 'N/A'),
                  const SizedBox(height: 16),
                ] else if (widget.customerName.isNotEmpty) ...[
                  _infoRow('Customer Name', widget.customerName),
                  const SizedBox(height: 8),
                  _infoRow('Mobile', widget.mobileNumber.isNotEmpty ? widget.mobileNumber : 'N/A'),
                  const SizedBox(height: 16),
                ],

                _darkTextField(label: 'Location / City *', controller: _locationCtrl, hint: 'e.g. JALALABAD'),
                const SizedBox(height: 12),
                Row(children: [
                  Expanded(
                    child: _darkDropdown(
                      label: 'System Type',
                      value: _systemType,
                      items: const [
                        DropdownMenuItem(value: 'ONGRID_SOLAR', child: Text('ONGRID SOLAR')),
                        DropdownMenuItem(value: 'OFFGRID_SOLAR', child: Text('OFFGRID SOLAR')),
                        DropdownMenuItem(value: 'HYBRID_SOLAR', child: Text('HYBRID SOLAR')),
                      ],
                      onChanged: (v) => setState(() => _systemType = v!),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _darkTextField(
                      label: 'Capacity (kW)',
                      controller: _capacityCtrl,
                      hint: 'e.g. 200',
                      keyboardType: TextInputType.number,
                    ),
                  ),
                ]),
              ],
            ),

            const SizedBox(height: 16),

            // ── Material Cards ───────────────────────────────────────────
            _sectionCard(
              title: 'Material Details',
              icon: Icons.inventory_2_outlined,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _loadingInventory
                          ? 'Loading inventory...'
                          : '${_inventoryProducts.length} stock products available',
                      style: GoogleFonts.inter(color: const Color(0xFF757575), fontSize: 12),
                    ),
                    ElevatedButton.icon(
                      onPressed: _showAddItemDialog,
                      icon: const Icon(Icons.add, size: 16),
                      label: Text('Add Item', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFE0E0E0),
                        foregroundColor: Color(0xDD000000),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                
                if (_items.isEmpty)
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Text('No materials added yet.', style: GoogleFonts.inter(color: const Color(0xFF757575))),
                    ),
                  )
                else
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _items.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final item = _items[index];
                      return Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8F9FA),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFE0E0E0)),
                        ),
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            CircleAvatar(
                              radius: 12,
                              backgroundColor: const Color(0xFFE0E0E0),
                              child: Text('${index + 1}', style: GoogleFonts.inter(color: Color(0xDD000000), fontSize: 10, fontWeight: FontWeight.bold)),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.description,
                                    style: GoogleFonts.inter(color: Color(0xDD000000), fontWeight: FontWeight.bold, fontSize: 13),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Qty: ${item.quantity} | Brand: ${item.brand.isEmpty ? "-" : item.brand} | Spec: ${item.unit.isEmpty ? "-" : item.unit}',
                                    style: GoogleFonts.inter(color: const Color(0xFF757575), fontSize: 12),
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline, color: Color(0xFFEF4444), size: 20),
                              onPressed: () => _removeItem(index),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
              ],
            ),

            const SizedBox(height: 16),

            // ── Pricing Summary ──────────────────────────────────────────
            _sectionCard(
              title: 'Commercial Pricing & GST Details',
              icon: Icons.receipt_long,
              titleColor: Colors.amber.shade300,
              children: [
                Row(children: [
                  Expanded(child: _darkTextField(
                    label: 'Rate / Watt (₹)',
                    controller: _rateCtrl,
                    hint: '23.50',
                    keyboardType: TextInputType.number,
                    onChanged: (_) => setState(() {}),
                  )),
                  const SizedBox(width: 12),
                  Expanded(child: _darkTextField(
                    label: 'GST Extra %',
                    controller: _gstCtrl,
                    hint: '8.9',
                    keyboardType: TextInputType.number,
                  )),
                ]),
                const SizedBox(height: 12),
                _darkTextField(
                  label: 'Total Project Cost (₹) — leave blank to auto-calculate',
                  controller: _totalCostCtrl,
                  hint: 'Auto: ₹${_calculatedTotal.toStringAsFixed(0)}',
                  keyboardType: TextInputType.number,
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8F9FA),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFE0E0E0)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('TOTAL PROJECT COST', style: GoogleFonts.inter(
                        color: const Color(0xFF757575),
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      )),
                      Text(
                        '₹${_finalTotal.toStringAsFixed(0)}',
                        style: GoogleFonts.inter(
                          color: Colors.amber.shade300,
                          fontWeight: FontWeight.w900,
                          fontSize: 20,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // ── Generate PDF Button ──────────────────────────────────────
            ElevatedButton.icon(
              onPressed: _isGenerating ? null : _generatePdf,
              icon: _isGenerating
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Color(0xDD000000), strokeWidth: 2))
                  : const Icon(Icons.picture_as_pdf, size: 22),
              label: Text(
                _isGenerating ? 'Generating PDF...' : 'GENERATE & EXPORT PDF QUOTATION',
                style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w900),
              ),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: const Color(0xFF6B9E38),
                foregroundColor: Color(0xDD000000),
                disabledBackgroundColor: const Color(0xFFE0E0E0),
                elevation: 4,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  Widget _sectionCard({
    required String title,
    required IconData icon,
    required List<Widget> children,
    Color? titleColor,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFFFFFFF),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE0E0E0)),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Icon(icon, color: titleColor ?? const Color(0xFF7C5800), size: 18),
            const SizedBox(width: 8),
            Text(
              title,
              style: GoogleFonts.inter(
                color: titleColor ?? Color(0xDD000000),
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
          ]),
          const SizedBox(height: 14),
          Divider(color: const Color(0xFFE0E0E0), height: 1),
          const SizedBox(height: 14),
          ...children,
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Row(
      children: [
        Text('$label: ', style: GoogleFonts.inter(color: const Color(0xFF757575), fontSize: 13)),
        Text(value, style: GoogleFonts.inter(color: Color(0xDD000000), fontWeight: FontWeight.bold, fontSize: 13)),
      ],
    );
  }

  Widget _darkTextField({
    required String label,
    required TextEditingController controller,
    String hint = '',
    TextInputType keyboardType = TextInputType.text,
    ValueChanged<String>? onChanged,
    FocusNode? focusNode,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.inter(color: const Color(0xFF757575), fontSize: 12, fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        TextField(
          controller: controller,
          focusNode: focusNode,
          keyboardType: keyboardType,
          onChanged: onChanged,
          style: GoogleFonts.inter(color: Color(0xDD000000), fontSize: 14, fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: GoogleFonts.inter(color: const Color(0xFF9E9E9E), fontSize: 13),
            filled: true,
            fillColor: const Color(0xFFF8F9FA),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Color(0xFFE0E0E0)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Color(0xFFE0E0E0)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Color(0xFF7C5800), width: 1.5),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            isDense: true,
          ),
        ),
      ],
    );
  }

  Widget _darkDropdown<T>({
    required String label,
    required T value,
    required List<DropdownMenuItem<T>> items,
    required ValueChanged<T?> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.inter(color: const Color(0xFF757575), fontSize: 12, fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFFF8F9FA),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFFE0E0E0)),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<T>(
              value: value,
              items: items.map((item) => DropdownMenuItem<T>(
                value: item.value,
                child: DefaultTextStyle(
                  style: GoogleFonts.inter(color: Color(0xDD000000), fontSize: 13, fontWeight: FontWeight.w600),
                  child: item.child!,
                ),
              )).toList(),
              onChanged: onChanged,
              dropdownColor: const Color(0xFFFFFFFF),
              style: GoogleFonts.inter(color: Color(0xDD000000), fontSize: 13, fontWeight: FontWeight.w600),
              isDense: true,
              isExpanded: true,
            ),
          ),
        ),
      ],
    );
  }

}
