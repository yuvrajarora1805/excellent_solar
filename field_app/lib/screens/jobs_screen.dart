import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../main.dart' show baseUrl;
import 'job_detail_screen.dart';

class MyJobsListScreen extends StatefulWidget {
  const MyJobsListScreen({super.key});

  @override
  State<MyJobsListScreen> createState() => _MyJobsListScreenState();
}

class _MyJobsListScreenState extends State<MyJobsListScreen> {
  List<dynamic> _jobs = [];
  bool _isLoading = true;
  String _error = '';
  String _role = 'ADMIN';

  @override
  void initState() {
    super.initState();
    _fetchJobs();
  }

  Future<void> _fetchJobs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final workerId = prefs.getInt('worker_id') ?? 1;
      final role = prefs.getString('worker_role') ?? 'ADMIN';

      final response = await ApiService.get(Uri.parse('$baseUrl/api/mobile/jobs?worker_id=$workerId'));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _jobs = data['jobs'] ?? [];
          _role = role;
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = 'Failed to load jobs';
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

  Widget _buildJobList(List<dynamic> filteredJobs) {
    if (filteredJobs.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24.0),
          child: Text('No assigned jobs in this section.', style: TextStyle(color: Colors.grey)),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16.0),
      itemCount: filteredJobs.length,
      itemBuilder: (context, index) {
        final j = filteredJobs[index];
        final isSurvey = j['is_survey'] == true;
        final isActionable = j['is_actionable'] == true;
        final displayStatus = j['type'] ?? 'Unknown';
        final section = j['section'] ?? 'SURVEY';

        Color badgeBgColor;
        Color badgeTextColor;

        if (!isActionable) {
          badgeBgColor = Colors.orange.shade100;
          badgeTextColor = Colors.orange.shade800;
          if (displayStatus.contains('Completed') || displayStatus.contains('Finished')) {
            badgeBgColor = Colors.grey.shade200;
            badgeTextColor = Colors.grey.shade800;
          }
        } else {
          badgeBgColor = section == 'SURVEY' ? Colors.amber.shade100 : Colors.blue.shade100;
          badgeTextColor = section == 'SURVEY' ? Colors.amber.shade900 : Colors.blue.shade900;
        }

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          elevation: 0,
          shape: RoundedRectangleBorder(
            side: const BorderSide(color: Color(0xFFE5E7EB)),
            borderRadius: BorderRadius.circular(8),
          ),
          child: InkWell(
            onTap: () {
              if (!isActionable) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('This job is currently: $displayStatus. Waiting for approval or completed.'),
                    backgroundColor: Colors.orange.shade800,
                  ),
                );
                return;
              }

              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => JobDetailScreen(
                  jobId: j['id']?.toString() ?? 'Unknown',
                  customerName: j['customer_name'] ?? 'Unknown',
                  isSurvey: isSurvey,
                )),
              );
            },
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        j['customer_name'] ?? 'Unknown',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: badgeBgColor,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          displayStatus,
                          style: TextStyle(
                            color: badgeTextColor,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined, size: 16, color: Colors.grey),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          j['address'] ?? 'No Address',
                          style: const TextStyle(color: Colors.grey),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.calendar_today, size: 14, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(
                        'Date: ${j['date'] ?? j['created_at'] ?? 'N/A'}',
                        style: TextStyle(color: Colors.grey.shade700, fontSize: 13, fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );

      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final surveyJobs = _jobs.filter((j) => j['section'] == 'SURVEY').toList();
    final installJobs = _jobs.filter((j) => j['section'] == 'INSTALLATION').toList();

    String uRole = _role.toUpperCase().trim();
    bool isInstaller = uRole == 'INSTALLATION' || uRole == 'WORKER';
    bool isSales = uRole == 'SALES' || uRole == 'MARKETING';
    
    List<Widget> tabs = [];
    List<Widget> tabViews = [];

    if (!isInstaller) {
      tabs.add(const Tab(icon: Icon(Icons.architecture), text: 'Site Survey'));
      tabViews.add(_buildJobList(surveyJobs));
    }

    if (!isSales) {
      tabs.add(const Tab(icon: Icon(Icons.build), text: 'Installation'));
      tabViews.add(_buildJobList(installJobs));
    }

    tabs.add(const Tab(icon: Icon(Icons.list_alt), text: 'All Jobs'));
    tabViews.add(_buildJobList(_jobs));

    return DefaultTabController(
      length: tabs.length,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('My Assigned Jobs'),
          actions: [
            IconButton(icon: const Icon(Icons.refresh), onPressed: _fetchJobs),
          ],
          bottom: TabBar(
            isScrollable: tabs.length > 3,
            tabs: tabs,
          ),
        ),
        body: _isLoading 
          ? const Center(child: CircularProgressIndicator())
          : _error.isNotEmpty
            ? Center(child: Text(_error))
            : TabBarView(
                children: tabViews,
              ),
      ),
    );
  }
}

extension ListFilterExtension on List {
  List<dynamic> filter(bool Function(dynamic) test) {
    return where(test).toList();
  }
}
