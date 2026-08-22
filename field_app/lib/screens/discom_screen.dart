import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../main.dart' show baseUrl;
import 'discom_detail_screen.dart';

class DiscomListScreen extends StatefulWidget {
  const DiscomListScreen({super.key});

  @override
  State<DiscomListScreen> createState() => _DiscomListScreenState();
}

class _DiscomListScreenState extends State<DiscomListScreen> {
  List<dynamic> _applications = [];
  bool _isLoading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _fetchApplications();
  }

  Future<void> _fetchApplications() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });

    try {
      final prefs = await SharedPreferences.getInstance();
      final workerId = prefs.getInt('worker_id') ?? 1;

      final response = await http.get(Uri.parse('$baseUrl/api/mobile/discom?worker_id=$workerId'));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          setState(() {
            _applications = data['applications'] ?? [];
            _isLoading = false;
          });
        } else {
          setState(() {
            _error = data['error'] ?? 'Failed to load applications';
            _isLoading = false;
          });
        }
      } else {
        setState(() {
          _error = 'Server error. Please try again later.';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Connection error. Please try again.';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('DISCOM Applications'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _fetchApplications),
        ],
      ),
      body: _isLoading
        ? const Center(child: CircularProgressIndicator())
        : _error.isNotEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(_error, style: const TextStyle(color: Colors.red)),
                  const SizedBox(height: 16),
                  ElevatedButton(onPressed: _fetchApplications, child: const Text('Retry'))
                ],
              ),
            )
          : _applications.isEmpty
            ? const Center(child: Text('No active DISCOM applications.'))
            : ListView.builder(
                itemCount: _applications.length,
                itemBuilder: (context, index) {
                  final app = _applications[index];
                  return Card(
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    elevation: 1,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    child: ListTile(
                      contentPadding: const EdgeInsets.all(16),
                      title: Text(
                        app['customer_name'] ?? 'Unknown Customer',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      subtitle: Padding(
                        padding: const EdgeInsets.only(top: 8.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Project: ${app['project_id']}'),
                            const SizedBox(height: 4),
                            Text('Status: ${app['status']}', style: const TextStyle(color: Colors.blueGrey)),
                          ],
                        ),
                      ),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () async {
                        await Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => DiscomDetailScreen(application: app),
                          ),
                        );
                        // Refresh when coming back
                        _fetchApplications();
                      },
                    ),
                  );
                },
              ),
    );
  }
}
