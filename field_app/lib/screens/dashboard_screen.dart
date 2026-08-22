import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
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
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      // Handle error gracefully, just keep showing zeros/loading if failed
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Excellent Solar',
          style: GoogleFonts.hankenGrotesk(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchStats, // Refresh manually
          ),
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {},
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
                // User greeting
                Text(
                  'Field Worker Portal',
                  style: GoogleFonts.hankenGrotesk(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Capture surveys, complete installations, and check off PSPCL details on site.',
                  style: TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 24),

                // Metrics Summary Grid
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 1.5,
                  children: [
                    if (_role == 'ADMIN' || _role == 'INSTALLATION') ...[
                      _buildStatCard('Pending Surveys', _pendingSurveys.toString(), Colors.amber),
                      _buildStatCard('Active Installs', _activeInstalls.toString(), Colors.green),
                      _buildStatCard('Completed Jobs', _completedJobs.toString(), Colors.blue),
                      _buildStatCard('Total Jobs', _totalJobs.toString(), Colors.indigo),
                      _buildStatCard('Open Tickets', _openTickets.toString(), Colors.red),
                      _buildStatCard('Closed Tickets', _closedTickets.toString(), Colors.grey),
                    ]
                  ],
                ),
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
        borderRadius: BorderRadius.circular(8),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(title, style: const TextStyle(fontSize: 12, color: Colors.grey)),
            Text(
              val,
              style: TextStyle(
                fontSize: 24,
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
