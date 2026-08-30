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

  void _addItem() {
    setState(() {
      _items.add(LineItem());
    });
  }

  void _removeItem(int idx) {
    setState(() => _items.removeAt(idx));
  }

  void _selectInventoryProduct(int idx, InventoryProduct product) {
    setState(() {
      _items[idx].description = product.name;
      _items[idx].brand = product.brand.isNotEmpty ? product.brand : product.category;
      _items[idx].unit = product.specification.isNotEmpty ? product.specification : product.unit;
    });
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
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        foregroundColor: Colors.white,
        title: Text(
          'Generate Solar Quotation',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: const Color(0xFF334155), height: 1),
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
                  ? const Padding(padding: EdgeInsets.all(8.0), child: Text('Loading projects...', style: TextStyle(color: Colors.white70)))
                  : _darkDropdown<Project?>(
                      label: 'Select Customer Project',
                      value: _selectedProject,
                      items: [
                        const DropdownMenuItem<Project?>(value: null, child: Text('Select a Customer Project...')),
                        ..._projects.map((p) => DropdownMenuItem<Project?>(
                          value: p,
                          child: Text('${p.idStr} - ${p.customerName}'),
                        ))
                      ],
                      onChanged: _onProjectSelected,
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

            // ── Material Table ───────────────────────────────────────────
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF334155)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Material Details Table',
                              style: GoogleFonts.inter(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                              ),
                            ),
                            Text(
                              _loadingInventory
                                  ? 'Loading inventory...'
                                  : 'Search ${_inventoryProducts.length} stock products',
                              style: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 12),
                            ),
                          ],
                        ),
                        ElevatedButton.icon(
                          onPressed: _addItem,
                          icon: const Icon(Icons.add, size: 16),
                          label: Text('Add Row', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF334155),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Column Headers
                  Container(
                    margin: const EdgeInsets.only(top: 12),
                    color: const Color(0xFF6B9E38),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    child: Row(children: [
                      SizedBox(
                        width: 28,
                        child: Text('#', style: GoogleFonts.inter(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 11)),
                      ),
                      Expanded(
                        flex: 4,
                        child: Text('MATERIAL DETAIL', style: GoogleFonts.inter(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 11)),
                      ),
                      Expanded(
                        flex: 2,
                        child: Text('QTY', textAlign: TextAlign.center, style: GoogleFonts.inter(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 11)),
                      ),
                      Expanded(
                        flex: 2,
                        child: Text('BRAND', textAlign: TextAlign.center, style: GoogleFonts.inter(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 11)),
                      ),
                      Expanded(
                        flex: 2,
                        child: Text('DESCRIPTION', textAlign: TextAlign.center, style: GoogleFonts.inter(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 11)),
                      ),
                      const SizedBox(width: 28),
                    ]),
                  ),

                  // Rows
                  ..._items.asMap().entries.map((entry) {
                    final idx = entry.key;
                    final item = entry.value;
                    return _MaterialRow(
                      idx: idx,
                      item: item,
                      inventoryProducts: _inventoryProducts,
                      loadingInventory: _loadingInventory,
                      onDelete: () => _removeItem(idx),
                      onSelectProduct: (prod) => _selectInventoryProduct(idx, prod),
                      onChanged: () => setState(() {}),
                    );
                  }),
                  const SizedBox(height: 8),
                ],
              ),
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
                    color: const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFF334155)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('TOTAL PROJECT COST', style: GoogleFonts.inter(
                        color: const Color(0xFF94A3B8),
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
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Icon(Icons.picture_as_pdf, size: 22),
              label: Text(
                _isGenerating ? 'Generating PDF...' : 'GENERATE & EXPORT PDF QUOTATION',
                style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w900),
              ),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: const Color(0xFF6B9E38),
                foregroundColor: Colors.white,
                disabledBackgroundColor: const Color(0xFF334155),
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
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF334155)),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Icon(icon, color: titleColor ?? const Color(0xFF38BDF8), size: 18),
            const SizedBox(width: 8),
            Text(
              title,
              style: GoogleFonts.inter(
                color: titleColor ?? Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
          ]),
          const SizedBox(height: 14),
          Divider(color: const Color(0xFF334155), height: 1),
          const SizedBox(height: 14),
          ...children,
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Row(
      children: [
        Text('$label: ', style: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 13)),
        Text(value, style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
      ],
    );
  }

  Widget _darkTextField({
    required String label,
    required TextEditingController controller,
    String hint = '',
    TextInputType keyboardType = TextInputType.text,
    ValueChanged<String>? onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          onChanged: onChanged,
          style: GoogleFonts.inter(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: GoogleFonts.inter(color: const Color(0xFF475569), fontSize: 13),
            filled: true,
            fillColor: const Color(0xFF0F172A),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Color(0xFF334155)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Color(0xFF334155)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Color(0xFF38BDF8), width: 1.5),
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
        Text(label, style: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFF0F172A),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFF334155)),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<T>(
              value: value,
              items: items.map((item) => DropdownMenuItem<T>(
                value: item.value,
                child: DefaultTextStyle(
                  style: GoogleFonts.inter(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
                  child: item.child!,
                ),
              )).toList(),
              onChanged: onChanged,
              dropdownColor: const Color(0xFF1E293B),
              style: GoogleFonts.inter(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
              isDense: true,
              isExpanded: true,
            ),
          ),
        ),
      ],
    );
  }
}

// ─── Material Row Widget ────────────────────────────────────────────────────
class _MaterialRow extends StatefulWidget {
  final int idx;
  final LineItem item;
  final List<InventoryProduct> inventoryProducts;
  final bool loadingInventory;
  final VoidCallback onDelete;
  final ValueChanged<InventoryProduct> onSelectProduct;
  final VoidCallback onChanged;

  const _MaterialRow({
    required this.idx,
    required this.item,
    required this.inventoryProducts,
    required this.loadingInventory,
    required this.onDelete,
    required this.onSelectProduct,
    required this.onChanged,
  });

  @override
  State<_MaterialRow> createState() => _MaterialRowState();
}

class _MaterialRowState extends State<_MaterialRow> {
  late TextEditingController _descCtrl;
  late TextEditingController _qtyCtrl;
  late TextEditingController _brandCtrl;
  late TextEditingController _unitCtrl;
  late TextEditingController _searchCtrl;
  bool _showDropdown = false;
  List<InventoryProduct> _filtered = [];

  @override
  void initState() {
    super.initState();
    _descCtrl = TextEditingController(text: widget.item.description);
    _qtyCtrl = TextEditingController(text: widget.item.quantity);
    _brandCtrl = TextEditingController(text: widget.item.brand);
    _unitCtrl = TextEditingController(text: widget.item.unit);
    _searchCtrl = TextEditingController();
  }

  @override
  void didUpdateWidget(_MaterialRow oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.item.description != widget.item.description) {
      _descCtrl.text = widget.item.description;
    }
    if (oldWidget.item.brand != widget.item.brand) {
      _brandCtrl.text = widget.item.brand;
    }
    if (oldWidget.item.unit != widget.item.unit) {
      _unitCtrl.text = widget.item.unit;
    }
  }

  @override
  void dispose() {
    _descCtrl.dispose();
    _qtyCtrl.dispose();
    _brandCtrl.dispose();
    _unitCtrl.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  void _onSearch(String query) {
    setState(() {
      _showDropdown = true;
      if (query.isEmpty) {
        _filtered = widget.inventoryProducts.take(20).toList();
      } else {
        final q = query.toLowerCase();
        _filtered = widget.inventoryProducts.where((p) =>
          p.name.toLowerCase().contains(q) ||
          p.brand.toLowerCase().contains(q) ||
          p.category.toLowerCase().contains(q) ||
          p.productCode.toLowerCase().contains(q) ||
          p.specification.toLowerCase().contains(q)
        ).take(15).toList();
      }
    });
  }

  void _selectProduct(InventoryProduct product) {
    _descCtrl.text = product.name;
    _brandCtrl.text = product.brand.isNotEmpty ? product.brand : product.category;
    _unitCtrl.text = product.specification.isNotEmpty ? product.specification : product.unit;
    _searchCtrl.clear();
    setState(() => _showDropdown = false);
    widget.item.description = product.name;
    widget.item.brand = _brandCtrl.text;
    widget.item.unit = _unitCtrl.text;
    widget.onSelectProduct(product);
  }

  @override
  Widget build(BuildContext context) {
    final isEven = widget.idx % 2 == 0;
    return Container(
      color: isEven ? const Color(0xFFFFFFE0).withOpacity(0.07) : Colors.transparent,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Row number
          SizedBox(
            width: 28,
            child: Padding(
              padding: const EdgeInsets.only(top: 10),
              child: Text(
                '${widget.idx + 1}',
                style: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontWeight: FontWeight.bold, fontSize: 12),
              ),
            ),
          ),

          // Material Detail Column (description + inventory search)
          Expanded(
            flex: 4,
            child: Column(
              children: [
                TextField(
                  controller: _descCtrl,
                  style: GoogleFonts.inter(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                  onChanged: (v) {
                    widget.item.description = v;
                    widget.onChanged();
                  },
                  decoration: _cellDecoration('e.g. SOLAR PANELS'),
                ),
                const SizedBox(height: 4),
                // Inventory Search
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    TextField(
                      controller: _searchCtrl,
                      style: GoogleFonts.inter(color: const Color(0xFF0F172A), fontSize: 11),
                      onChanged: _onSearch,
                      onTap: () {
                        setState(() {
                          _filtered = widget.inventoryProducts.take(20).toList();
                          _showDropdown = true;
                        });
                      },
                      decoration: InputDecoration(
                        hintText: widget.loadingInventory
                            ? '⏳ Loading inventory...'
                            : '🔍 Search inventory...',
                        hintStyle: GoogleFonts.inter(color: const Color(0xFF854D00), fontSize: 10),
                        filled: true,
                        fillColor: const Color(0xFFFEF9C3),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(4),
                          borderSide: const BorderSide(color: Color(0xFFEAB308)),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(4),
                          borderSide: const BorderSide(color: Color(0xFFEAB308), width: 1.5),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(4),
                          borderSide: const BorderSide(color: Color(0xFFD97706), width: 2),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                        isDense: true,
                        suffixIcon: _searchCtrl.text.isNotEmpty
                            ? GestureDetector(
                                onTap: () {
                                  _searchCtrl.clear();
                                  setState(() => _showDropdown = false);
                                },
                                child: const Icon(Icons.close, size: 14, color: Color(0xFF92400E)),
                              )
                            : null,
                      ),
                    ),
                    // Dropdown
                    if (_showDropdown && _filtered.isNotEmpty)
                      Positioned(
                        top: 32,
                        left: 0,
                        right: 0,
                        child: Material(
                          elevation: 8,
                          borderRadius: BorderRadius.circular(6),
                          color: Colors.white,
                          child: Container(
                            constraints: const BoxConstraints(maxHeight: 200),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: const Color(0xFF94A3B8)),
                            ),
                            child: ListView.separated(
                              padding: EdgeInsets.zero,
                              shrinkWrap: true,
                              itemCount: _filtered.length,
                              separatorBuilder: (_, __) => const Divider(height: 1, color: Color(0xFFE2E8F0)),
                              itemBuilder: (context, i) {
                                final p = _filtered[i];
                                return InkWell(
                                  onTap: () => _selectProduct(p),
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Expanded(
                                              child: Text(
                                                p.name,
                                                style: GoogleFonts.inter(
                                                  color: const Color(0xFF0F172A),
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 12,
                                                ),
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFE2E8F0),
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: Text(
                                                p.productCode,
                                                style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.bold),
                                              ),
                                            ),
                                          ],
                                        ),
                                        if (p.brand.isNotEmpty || p.category.isNotEmpty)
                                          Padding(
                                            padding: const EdgeInsets.only(top: 2),
                                            child: Text(
                                              '${p.brand.isNotEmpty ? "Brand: ${p.brand}" : ""}${p.brand.isNotEmpty && p.category.isNotEmpty ? " • " : ""}${p.category.isNotEmpty ? p.category : ""}',
                                              style: GoogleFonts.inter(color: const Color(0xFFB45309), fontSize: 10, fontWeight: FontWeight.w600),
                                            ),
                                          ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 6),

          // Quantity
          Expanded(
            flex: 2,
            child: TextField(
              controller: _qtyCtrl,
              keyboardType: TextInputType.number,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
              onChanged: (v) {
                widget.item.quantity = v;
                widget.onChanged();
              },
              decoration: _cellDecoration('0'),
            ),
          ),
          const SizedBox(width: 6),

          // Brand
          Expanded(
            flex: 2,
            child: TextField(
              controller: _brandCtrl,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(color: Colors.white, fontSize: 11),
              onChanged: (v) {
                widget.item.brand = v;
                widget.onChanged();
              },
              decoration: _cellDecoration('Brand'),
            ),
          ),
          const SizedBox(width: 6),

          // Unit/Description
          Expanded(
            flex: 2,
            child: TextField(
              controller: _unitCtrl,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(color: Colors.white, fontSize: 11),
              onChanged: (v) {
                widget.item.unit = v;
                widget.onChanged();
              },
              decoration: _cellDecoration('Spec.'),
            ),
          ),
          const SizedBox(width: 4),

          // Delete
          SizedBox(
            width: 28,
            child: IconButton(
              icon: const Icon(Icons.close, size: 16, color: Color(0xFFEF4444)),
              onPressed: widget.onDelete,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
          ),
        ],
      ),
    );
  }

  InputDecoration _cellDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: GoogleFonts.inter(color: const Color(0xFF475569), fontSize: 10),
      filled: true,
      fillColor: const Color(0xFF0F172A),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(4),
        borderSide: const BorderSide(color: Color(0xFF334155)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(4),
        borderSide: const BorderSide(color: Color(0xFF334155)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(4),
        borderSide: const BorderSide(color: Color(0xFF38BDF8), width: 1.5),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
      isDense: true,
    );
  }
}
