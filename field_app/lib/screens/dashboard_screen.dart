import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../main.dart' show baseUrl;

class FieldDashboardScreen extends StatefulWidget {
  const FieldDashboardScreen({super.key});

  @override
  State<FieldDashboardScreen> createState() => _FieldDashboardScreenState();
}

class _FieldDashboardScreenState extends State<FieldDashboardScreen> {
  int _pendingSurveys = 0;
  int _activeInstalls = 0;
  int _completedJobs = 0;
  int _openTickets = 0;
  int _closedTickets = 0;
  int _totalJobs = 0;

  int _totalDiscom = 0;
  int _pendingJe = 0;
  int _pendingSdo = 0;
  int _pendingXen = 0;
  int _pendingSecondApproval = 0;

  bool _isLoading = true;
  String _role = 'ADMIN';

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  Future<void> _fetchStats() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final workerId = prefs.getInt('worker_id') ?? 1;
      _role = prefs.getString('worker_role') ?? 'ADMIN';

      final response = await ApiService.get(Uri.parse('$baseUrl/api/mobile/dashboard?worker_id=$workerId'));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          setState(() {
            _pendingSurveys = data['stats']['pendingSurveys'] ?? 0;
            _activeInstalls = data['stats']['activeInstalls'] ?? 0;
            _completedJobs = data['stats']['completedJobs'] ?? 0;
            _openTickets = data['stats']['openTickets'] ?? 0;
            _closedTickets = data['stats']['closedTickets'] ?? 0;
            _totalJobs = data['stats']['totalJobs'] ?? 0;

            _totalDiscom = data['stats']['totalDiscom'] ?? 0;
            _pendingJe = data['stats']['pendingJe'] ?? 0;
            _pendingSdo = data['stats']['pendingSdo'] ?? 0;
            _pendingXen = data['stats']['pendingXen'] ?? 0;
            _pendingSecondApproval = data['stats']['pendingSecondApproval'] ?? 0;

            _isLoading = false;
          });
        }
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  String _getRoleTitle() {
    switch (_role.toUpperCase()) {
      case 'DISCOM':
      case 'DISCOM_OPERATOR':
        return 'DISCOM Operations Portal';
      case 'INSTALLATION':
      case 'WORKER':
        return 'Installer Field Portal';
      case 'SALES':
      case 'MARKETING':
        return 'Sales & Marketing Portal';
      default:
        return 'Solar Executive Portal';
    }
  }

  String _getRoleSubtitle() {
    switch (_role.toUpperCase()) {
      case 'DISCOM':
      case 'DISCOM_OPERATOR':
        return 'Manage DISCOM applications, verifications & document uploads.';
      case 'INSTALLATION':
      case 'WORKER':
        return 'Capture site surveys, complete installations & handle tickets.';
      case 'SALES':
      case 'MARKETING':
        return 'Register new customer bookings, track leads & check stock.';
      default:
        return 'System-wide metrics across DISCOM, Installs, Sales & Tickets.';
    }
  }

  @override
  Widget build(BuildContext context) {
    bool isDiscomRole = _role == 'DISCOM' || _role == 'DISCOM_OPERATOR';
    bool isInstallerRole = _role == 'INSTALLATION' || _role == 'WORKER';
    bool isSalesRole = _role == 'SALES' || _role == 'MARKETING';
    bool isAdmin = _role == 'ADMIN';

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Excellent Solar',
          style: GoogleFonts.hankenGrotesk(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchStats,
          ),
        ],
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator()) 
        : SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // User greeting & role badge
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _getRoleTitle(),
                            style: GoogleFonts.hankenGrotesk(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _getRoleSubtitle(),
                            style: const TextStyle(color: Colors.grey, fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.blue.shade200),
                      ),
                      child: Text(
                        _role,
                        style: TextStyle(color: Colors.blue.shade800, fontWeight: FontWeight.bold, fontSize: 11),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // DISCOM METRICS GRID (For DISCOM & ADMIN)
                if (isDiscomRole || isAdmin) ...[
                  Text(
                    'DISCOM Application Overview',
                    style: GoogleFonts.hankenGrotesk(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 1.5,
                    children: [
                      _buildStatCard('Total Applications', _totalDiscom.toString(), Colors.purple.shade700),
                      _buildStatCard('Pending JE', _pendingJe.toString(), Colors.orange.shade700),
                      _buildStatCard('Pending SDO', _pendingSdo.toString(), Colors.indigo.shade700),
                      _buildStatCard('Pending XEN', _pendingXen.toString(), Colors.teal.shade700),
                      _buildStatCard('Pending 2nd Approval', _pendingSecondApproval.toString(), Colors.amber.shade800),
                    ],
                  ),
                  const SizedBox(height: 24),
                ],

                // INSTALLER METRICS GRID (For INSTALLATION, WORKER & ADMIN)
                if (isInstallerRole || isAdmin) ...[
                  Text(
                    'Field & Installation Work',
                    style: GoogleFonts.hankenGrotesk(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 1.5,
                    children: [
                      _buildStatCard('Pending Surveys', _pendingSurveys.toString(), Colors.amber.shade700),
                      _buildStatCard('Active Installs', _activeInstalls.toString(), Colors.green.shade700),
                      _buildStatCard('Completed Jobs', _completedJobs.toString(), Colors.blue.shade700),
                      _buildStatCard('Open Tickets', _openTickets.toString(), Colors.red.shade700),
                      _buildStatCard('Closed Tickets', _closedTickets.toString(), Colors.grey.shade700),
                    ],
                  ),
                  const SizedBox(height: 24),
                ],

                // SALES & MARKETING METRICS GRID (For SALES, MARKETING & ADMIN)
                if (isSalesRole || (isAdmin && !isDiscomRole && !isInstallerRole)) ...[
                  Text(
                    'Sales & Bookings Performance',
                    style: GoogleFonts.hankenGrotesk(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 1.5,
                    children: [
                      _buildStatCard('Total Projects / Bookings', _totalJobs.toString(), Colors.indigo.shade700),
                      _buildStatCard('Surveys Pending', _pendingSurveys.toString(), Colors.amber.shade700),
                      _buildStatCard('Active Installs', _activeInstalls.toString(), Colors.green.shade700),
                      _buildStatCard('Completed Projects', _completedJobs.toString(), Colors.blue.shade700),
                    ],
                  ),
                ],

                const SizedBox(height: 24),
              ],
            ),
          ),
    );
  }

  Widget _buildStatCard(String title, String val, Color col) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        side: const BorderSide(color: Color(0xFFE5E7EB)),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(title, style: const TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.w500)),
            Text(
              val,
              style: TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.bold,
                color: col,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
