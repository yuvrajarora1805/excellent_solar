import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'quotation_screen.dart' show Project, InventoryProduct;

class ProjectSearchSheet extends StatefulWidget {
  final List<Project> projects;
  final ValueChanged<Project> onSelect;

  const ProjectSearchSheet({super.key, required this.projects, required this.onSelect});

  @override
  State<ProjectSearchSheet> createState() => _ProjectSearchSheetState();
}

class _ProjectSearchSheetState extends State<ProjectSearchSheet> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final filtered = widget.projects.where((p) =>
      p.customerName.toLowerCase().contains(_query.toLowerCase()) ||
      p.idStr.toLowerCase().contains(_query.toLowerCase())
    ).toList();

    return Container(
      color: const Color(0xFF1E293B),
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          TextField(
            style: GoogleFonts.inter(color: Colors.white),
            decoration: InputDecoration(
              hintText: 'Search Customer or Project ID...',
              hintStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8)),
              prefixIcon: const Icon(Icons.search, color: Color(0xFF94A3B8)),
              filled: true,
              fillColor: const Color(0xFF0F172A),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onChanged: (v) => setState(() => _query = v),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView.builder(
              itemCount: filtered.length,
              itemBuilder: (context, i) {
                final p = filtered[i];
                return ListTile(
                  title: Text(p.customerName, style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold)),
                  subtitle: Text(p.idStr, style: GoogleFonts.inter(color: const Color(0xFF94A3B8))),
                  onTap: () => widget.onSelect(p),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class ProductSearchSheet extends StatefulWidget {
  final List<InventoryProduct> products;
  final ValueChanged<InventoryProduct> onSelect;

  const ProductSearchSheet({super.key, required this.products, required this.onSelect});

  @override
  State<ProductSearchSheet> createState() => _ProductSearchSheetState();
}

class _ProductSearchSheetState extends State<ProductSearchSheet> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final filtered = widget.products.where((p) =>
      p.name.toLowerCase().contains(_query.toLowerCase()) ||
      p.brand.toLowerCase().contains(_query.toLowerCase()) ||
      p.category.toLowerCase().contains(_query.toLowerCase()) ||
      p.productCode.toLowerCase().contains(_query.toLowerCase())
    ).take(30).toList();

    return Container(
      color: const Color(0xFF1E293B),
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          TextField(
            style: GoogleFonts.inter(color: Colors.white),
            decoration: InputDecoration(
              hintText: 'Search Inventory Products...',
              hintStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8)),
              prefixIcon: const Icon(Icons.search, color: Color(0xFF94A3B8)),
              filled: true,
              fillColor: const Color(0xFF0F172A),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onChanged: (v) => setState(() => _query = v),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView.builder(
              itemCount: filtered.length,
              itemBuilder: (context, i) {
                final p = filtered[i];
                return ListTile(
                  title: Text(p.name, style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold)),
                  subtitle: Text('${p.productCode} • ${p.brand}', style: GoogleFonts.inter(color: const Color(0xFF94A3B8))),
                  onTap: () => widget.onSelect(p),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
