import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
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

  @override
  void initState() {
    super.initState();
    _fetchJobs();
  }

  Future<void> _fetchJobs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final workerId = prefs.getInt('worker_id') ?? 1;

      final response = await http.get(Uri.parse('$baseUrl/api/mobile/jobs?worker_id=$workerId'));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _jobs = data['jobs'] ?? [];
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Active Jobs'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _fetchJobs),
        ],
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : _error.isNotEmpty
          ? Center(child: Text(_error))
          : _jobs.isEmpty
            ? const Center(child: Text('No active jobs currently.'))
            : ListView.builder(
                padding: const EdgeInsets.all(16.0),
                itemCount: _jobs.length,
                itemBuilder: (context, index) {
                  final j = _jobs[index];
                  final isSurvey = j['is_survey'] == true;
                  final isActionable = j['is_actionable'] == true;
                  final displayStatus = j['type'] ?? 'Unknown';
                  
                  // Determine badge colors based on actionable status or type
                  Color badgeBgColor;
                  Color badgeTextColor;
                  
                  if (!isActionable) {
                    badgeBgColor = Colors.orange[100]!;
                    badgeTextColor = Colors.orange[800]!;
                    if (displayStatus.contains('Finished') || displayStatus.contains('Completed')) {
                      badgeBgColor = Colors.grey[200]!;
                      badgeTextColor = Colors.grey[800]!;
                    }
                  } else {
                    badgeBgColor = isSurvey ? Colors.amber[100]! : Colors.blue[100]!;
                    badgeTextColor = isSurvey ? Colors.amber[800]! : Colors.blue[800]!;
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
                              content: Text('This job is currently: $displayStatus. Waiting for admin approval or already finished.'),
                              backgroundColor: Colors.orange[800],
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
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
    );
  }
}
