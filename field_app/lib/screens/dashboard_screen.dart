import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:path_provider/path_provider.dart';
import 'package:http/http.dart' as http;
import '../services/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
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
    _checkAppUpdate();
  }

  Future<void> _checkAppUpdate() async {
    try {
      final response = await ApiService.get(Uri.parse('$baseUrl/api/mobile/app-version'));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final latestVersion = data['latest_version'] ?? '1.2.0';
        const currentVersion = '1.2.0';





        if (latestVersion != currentVersion) {
          if (!mounted) return;
          showDialog(
            context: context,
            barrierDismissible: data['force_update'] != true,
            builder: (context) => AlertDialog(
              title: const Row(
                children: [
                  Icon(Icons.system_update, color: Colors.blue),
                  SizedBox(width: 8),
                  Text('New App Version'),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Version $latestVersion is available!', style: const TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  if (data['release_notes'] != null)
                    Text(data['release_notes'], style: const TextStyle(fontSize: 13, color: Colors.black87)),
                ],
              ),
              actions: [
                if (data['force_update'] != true)
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Later'),
                  ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.blue, foregroundColor: Colors.white),
                  onPressed: () {
                    Navigator.pop(context);
                    final String? apkUrl = data['apk_url'];
                    if (apkUrl != null && apkUrl.isNotEmpty) {
                      _downloadAndInstallApk(apkUrl);
                    }
                  },
                  child: const Text('Update Now'),
                ),
              ],
            ),
          );
        }
      }
    } catch (e) {
      // Ignore background check failure
    }
  }

  Future<void> _downloadAndInstallApk(String apkUrl) async {
    double progress = 0.0;
    StateSetter? dialogSetState;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setState) {
          dialogSetState = setState;
          return AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: const Row(
              children: [
                Icon(Icons.downloading, color: Colors.blue),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Downloading Update...',
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ),
              ],
            ),
            content: Container(
              width: double.maxFinite,
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: LinearProgressIndicator(
                      value: progress > 0 ? progress : null,
                      backgroundColor: Colors.grey.shade200,
                      color: Colors.blue.shade700,
                      minHeight: 10,
                    ),
                  ),
                  const SizedBox(height: 14),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      progress > 0
                          ? '${(progress * 100).toInt()}% downloaded • Installing v1.0.2...'
                          : 'Connecting & Starting download...',
                      maxLines: 1,
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.grey.shade800),
                    ),
                  ),
                ],
              ),
            ),
          );

        },
      ),
    );

    try {
      final client = http.Client();
      final request = http.Request('GET', Uri.parse(apkUrl));
      final response = await client.send(request);

      if (response.statusCode != 200) {
        throw Exception('Download failed with status ${response.statusCode}');
      }

      final contentLength = response.contentLength ?? 0;
      final tempDir = await getTemporaryDirectory();
      final apkFile = File('${tempDir.path}/field_app_update.apk');
      if (await apkFile.exists()) {
        await apkFile.delete();
      }

      final sink = apkFile.openWrite();
      int downloaded = 0;


      await for (var chunk in response.stream) {
        sink.add(chunk);
        downloaded += chunk.length;
        if (contentLength > 0 && dialogSetState != null) {
          dialogSetState!(() {
            progress = downloaded / contentLength;
          });
        }
      }

      await sink.flush();
      await sink.close();

      if (mounted && Navigator.canPop(context)) {
        Navigator.pop(context); // Close progress dialog
      }


      // Invoke Android System Package Installer
      const channel = MethodChannel('com.excellentsolar.field_app/installer');
      final bool installed = await channel.invokeMethod('installApk', {'filePath': apkFile.path});

      if (!installed && mounted) {
        // Fallback to url_launcher if native channel fails
        final uri = Uri.parse(apkUrl);
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      if (mounted && Navigator.canPop(context)) {
        Navigator.pop(context); // Close progress dialog
      }

      // Fallback to url_launcher
      try {
        final uri = Uri.parse(apkUrl);
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } catch (err) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to download update: $e')),
          );
        }
      }
    }
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
