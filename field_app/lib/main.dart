import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'services/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:io';
import 'dart:ui';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_background_service_android/flutter_background_service_android.dart';
import 'package:permission_handler/permission_handler.dart';
import 'screens/login_screen.dart';
import 'screens/jobs_screen.dart';
import 'screens/tickets_screen.dart';
import 'screens/booking_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/discom_screen.dart';
import 'screens/orders_screen.dart';
import 'screens/scan_inventory_screen.dart';

const String baseUrl = 'https://es.omvky.com';


@pragma('vm:entry-point')
void onStart(ServiceInstance service) async {
  DartPluginRegistrant.ensureInitialized();
  
  if (service is AndroidServiceInstance) {
    service.on('setAsForeground').listen((event) {
      service.setAsForegroundService();
    });
    service.on('setAsBackground').listen((event) {
      service.setAsBackgroundService();
    });
  }

  service.on('stopService').listen((event) {
    service.stopSelf();
  });

  final flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();
  const AndroidInitializationSettings initializationSettingsAndroid = AndroidInitializationSettings('@mipmap/launcher_icon');
  const InitializationSettings initializationSettings = InitializationSettings(android: initializationSettingsAndroid);
  await flutterLocalNotificationsPlugin.initialize(initializationSettings);

  // Poll every 15 seconds
  Timer.periodic(const Duration(seconds: 15), (timer) async {
    if (service is AndroidServiceInstance) {
      if (await service.isForegroundService()) {
        service.setForegroundNotificationInfo(
          title: "Field App is running",
          content: "Last checked: ${DateTime.now().toString().split('.')[0]}",
        );
      }
    }

    final prefs = await SharedPreferences.getInstance();
    final workerId = prefs.getInt('worker_id');
    final token = prefs.getString('jwt_token');
    if (workerId == null || token == null || token.isEmpty) return;

    try {
      int lastJobCount = prefs.getInt('last_job_count') ?? 0;
      int lastTicketCount = prefs.getInt('last_ticket_count') ?? 0;

      // Poll Jobs
      final jobsResponse = await ApiService.get(Uri.parse('$baseUrl/api/mobile/jobs?worker_id=$workerId'));
      if (jobsResponse.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(jobsResponse.body);
        final List<dynamic> jobs = data['jobs'] ?? [];
        if (lastJobCount != 0 && jobs.length > lastJobCount) {
          const AndroidNotificationDetails androidPlatformChannelSpecifics = AndroidNotificationDetails(
            'job_channel', 'Job Notifications',
            importance: Importance.max, priority: Priority.high, showWhen: false);
          const NotificationDetails platformChannelSpecifics = NotificationDetails(android: androidPlatformChannelSpecifics);
          await flutterLocalNotificationsPlugin.show(0, 'New Job Assigned!', 'You have a new task assigned to your queue.', platformChannelSpecifics);
        }
        await prefs.setInt('last_job_count', jobs.length);
      }

      // Poll Tickets
      final ticketsResponse = await ApiService.get(Uri.parse('$baseUrl/api/mobile/tickets?worker_id=$workerId'));
      if (ticketsResponse.statusCode == 200) {
        final Map<String, dynamic> tdata = jsonDecode(ticketsResponse.body);
        final List<dynamic> tickets = tdata['tickets'] ?? [];
        if (lastTicketCount != 0 && tickets.length > lastTicketCount) {
          const AndroidNotificationDetails androidPlatformChannelSpecifics = AndroidNotificationDetails(
            'ticket_channel', 'Ticket Notifications',
            importance: Importance.max, priority: Priority.high, showWhen: false);
          const NotificationDetails platformChannelSpecifics = NotificationDetails(android: androidPlatformChannelSpecifics);
          await flutterLocalNotificationsPlugin.show(1, 'New Support Ticket!', 'A new service ticket has been raised.', platformChannelSpecifics);
        }
        await prefs.setInt('last_ticket_count', tickets.length);
      }
    } catch (e) {
      debugPrint('Background polling error: $e');
    }
  });
}

Future<void> initializeService() async {
  final service = FlutterBackgroundService();
  
  const AndroidNotificationChannel channel = AndroidNotificationChannel(
    'my_foreground', 
    'MY FOREGROUND SERVICE',
    description: 'This channel is used for important notifications.',
    importance: Importance.low,
  );
  
  const AndroidNotificationChannel jobChannel = AndroidNotificationChannel(
    'job_channel', 
    'Job Notifications',
    description: 'Notifications for new job assignments.',
    importance: Importance.max,
  );

  const AndroidNotificationChannel ticketChannel = AndroidNotificationChannel(
    'ticket_channel', 
    'Ticket Notifications',
    description: 'Notifications for new support tickets.',
    importance: Importance.max,
  );

  final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();
  
  if (Platform.isAndroid) {
    final androidImpl = flutterLocalNotificationsPlugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
    await androidImpl?.createNotificationChannel(channel);
    await androidImpl?.createNotificationChannel(jobChannel);
    await androidImpl?.createNotificationChannel(ticketChannel);
  }

  await service.configure(
    androidConfiguration: AndroidConfiguration(
      onStart: onStart,
      autoStart: true,
      isForegroundMode: true,
      notificationChannelId: 'my_foreground',
      initialNotificationTitle: 'Field App Background Sync',
      initialNotificationContent: 'Initializing...',
      foregroundServiceNotificationId: 888,
    ),
    iosConfiguration: IosConfiguration(
      autoStart: true,
      onForeground: onStart,
      onBackground: (ServiceInstance service) { return true; },
    ),
  );
  
  await service.startService();
}

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeService();
  
  // Check session
  final prefs = await SharedPreferences.getInstance();
  final workerId = prefs.getInt('worker_id');
  final token = prefs.getString('jwt_token');
  
  Widget initialScreen = const LoginScreen();
  if (workerId != null && token != null && token.isNotEmpty) {
    initialScreen = const MainNavigationScreen();
  }
  
  runApp(ExcellentSolarFieldApp(initialScreen: initialScreen));
}

class ExcellentSolarFieldApp extends StatelessWidget {
  final Widget initialScreen;
  const ExcellentSolarFieldApp({super.key, required this.initialScreen});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
      title: 'Excellent Solar Field App',
      themeMode: ThemeMode.light,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF7C5800), // Coal-Yellow Accent
          primary: const Color(0xFF7C5800),
          secondary: const Color(0xFF5D5E64),
          surface: const Color(0xFFF8F9FA),
          background: const Color(0xFFF8F9FA),
        ),
        textTheme: GoogleFonts.interTextTheme(
          Theme.of(context).textTheme,
        ),
      ),
      home: initialScreen,
      debugShowCheckedModeBanner: false,
    );
  }
}


class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _selectedIndex = 0;
  List<Widget> _screens = [];
  List<NavigationDestination> _destinations = [];
  String _role = '';

  @override
  void initState() {
    super.initState();
    _loadRole();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkPermissions();
    });
  }

  Future<void> _checkPermissions() async {
    final prefs = await SharedPreferences.getInstance();
    final bool dismissed = prefs.getBool('permission_dismissed') ?? false;
    if (dismissed) return;
    
    // Immediately mark as dismissed/requested so we don't ask on every single startup
    await prefs.setBool('permission_dismissed', true);

    bool hasNotification = await Permission.notification.isGranted;
    bool hasBatteryIgnore = await Permission.ignoreBatteryOptimizations.isGranted;

    if (!hasNotification) await Permission.notification.request();
    if (!hasBatteryIgnore) await Permission.ignoreBatteryOptimizations.request();

    hasNotification = await Permission.notification.isGranted;
    hasBatteryIgnore = await Permission.ignoreBatteryOptimizations.isGranted;

    if (!hasNotification || !hasBatteryIgnore) {
      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Permissions Recommended'),
            content: const Text(
                'Excellent Solar Field App works best with background execution and notifications to alert you of new jobs immediately. Please enable them in your device settings.'),
            actions: [
              TextButton(
                onPressed: () {
                  prefs.setBool('permission_dismissed', true);
                  Navigator.pop(context);
                },
                child: const Text('Ignore'),
              ),
              TextButton(
                onPressed: () {
                  Navigator.pop(context);
                  openAppSettings();
                },
                child: const Text('Open Settings'),
              ),
            ],
          ),
        );
      }
    }
  }

  Future<void> _loadRole() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _role = (prefs.getString('worker_role') ?? 'ADMIN').toUpperCase().trim();
      debugPrint('Loaded role: $_role');
      _buildNavItems();
    });
  }

  void _buildNavItems() {
    _screens = [
      const FieldDashboardScreen(),
    ];
    _destinations = [
      const NavigationDestination(
        icon: Icon(Icons.dashboard_outlined),
        selectedIcon: Icon(Icons.dashboard),
        label: 'Dashboard',
      ),
    ];

    String uRole = _role.toUpperCase();

    // Primary items for BottomNav
    if (uRole == 'ADMIN' || uRole == 'INSTALLATION' || uRole == 'WORKER' || uRole == 'SALES' || uRole == 'MARKETING') {
      _screens.add(const MyJobsListScreen());
      _destinations.add(const NavigationDestination(
        icon: Icon(Icons.assignment_turned_in_outlined),
        selectedIcon: Icon(Icons.assignment_turned_in),
        label: 'Jobs',
      ));
    }

    if (uRole == 'ADMIN' || uRole == 'INSTALLATION' || uRole == 'WORKER') {
      _screens.add(const MyTicketsListScreen());
      _destinations.add(const NavigationDestination(
        icon: Icon(Icons.confirmation_number_outlined),
        selectedIcon: Icon(Icons.confirmation_number),
        label: 'Tickets',
      ));
    }
    
    // We only keep up to 4 items in the bottom nav to avoid clutter
    if ((uRole == 'ADMIN' || uRole == 'ORDER_MANAGER' || uRole == 'ORDER') && _destinations.length < 4) {
      _screens.add(const OrdersScreen());
      _destinations.add(const NavigationDestination(
        icon: Icon(Icons.local_shipping_outlined),
        selectedIcon: Icon(Icons.local_shipping),
        label: 'Orders',
      ));
    } else if (uRole == 'ADMIN' || uRole == 'ORDER_MANAGER' || uRole == 'ORDER') {
      // If we don't put Orders in Bottom Nav, we still need it in the app's _screens list?
      // Wait, if it's in the Drawer, how does it navigate?
      // If we use Drawer, it's better to just navigate by pushing a route, OR keeping all screens in _screens, 
      // but only showing the first N in BottomNavigationBar.
    }
  }

  List<Widget> _allScreens = [];
  List<NavigationDestination> _bottomNavDestinations = [];
  bool _useDrawer = false;

  void _buildNavItemsV2() {
    String uRole = _role.toUpperCase();
    _useDrawer = (uRole == 'ADMIN');

    _allScreens = [const FieldDashboardScreen()];
    _bottomNavDestinations = [
      const NavigationDestination(
        icon: Icon(Icons.dashboard_outlined),
        selectedIcon: Icon(Icons.dashboard),
        label: 'Dashboard',
      )
    ];

    void addNav(Widget screen, NavigationDestination dest, bool forceBottomNav) {
      _allScreens.add(screen);
      if (!_useDrawer || forceBottomNav) {
        _bottomNavDestinations.add(dest);
      }
    }

    if (uRole == 'ADMIN' || uRole == 'INSTALLATION' || uRole == 'WORKER' || uRole == 'SALES' || uRole == 'MARKETING') {
      addNav(const MyJobsListScreen(), const NavigationDestination(
        icon: Icon(Icons.assignment_turned_in_outlined),
        selectedIcon: Icon(Icons.assignment_turned_in),
        label: 'Jobs',
      ), _useDrawer && _bottomNavDestinations.length < 4);
    }

    if (uRole == 'ADMIN' || uRole == 'INSTALLATION' || uRole == 'WORKER') {
      addNav(const MyTicketsListScreen(), const NavigationDestination(
        icon: Icon(Icons.confirmation_number_outlined),
        selectedIcon: Icon(Icons.confirmation_number),
        label: 'Tickets',
      ), _useDrawer && _bottomNavDestinations.length < 4);
    }

    if (uRole == 'ADMIN' || uRole == 'ORDER_MANAGER' || uRole == 'ORDER') {
      addNav(const OrdersScreen(), const NavigationDestination(
        icon: Icon(Icons.local_shipping_outlined),
        selectedIcon: Icon(Icons.local_shipping),
        label: 'Orders',
      ), _useDrawer && _bottomNavDestinations.length < 4);
    }

    if (uRole == 'ADMIN' || uRole == 'DISCOM' || uRole == 'DISCOM_OPERATOR') {
      addNav(const DiscomListScreen(), const NavigationDestination(
        icon: Icon(Icons.electrical_services_outlined),
        selectedIcon: Icon(Icons.electrical_services),
        label: 'DISCOM',
      ), false);
    }

    if (uRole == 'ADMIN' || uRole == 'INVENTORY_MANAGER' || uRole == 'INVENTORY') {
      addNav(const ScanInventoryScreen(), const NavigationDestination(
        icon: Icon(Icons.inventory_2_outlined),
        selectedIcon: Icon(Icons.inventory_2),
        label: 'Inventory',
      ), false);
    }

    if (uRole == 'ADMIN' || uRole == 'SALES' || uRole == 'MARKETING') {
      addNav(const OnGridBookingForm(), const NavigationDestination(
        icon: Icon(Icons.add_circle_outline),
        selectedIcon: Icon(Icons.add_circle),
        label: 'Booking',
      ), false);
    }

    addNav(const ProfileScreen(), const NavigationDestination(
      icon: Icon(Icons.person_outline),
      selectedIcon: Icon(Icons.person),
      label: 'Profile',
    ), !_useDrawer);
  }

  void _navigateToScreen(int index) {
    setState(() {
      _selectedIndex = index;
    });
    if (_useDrawer) {
      Navigator.pop(context); // Close drawer
    }
  }

  int _getScreenIndex(Type type) {
    return _allScreens.indexWhere((screen) => screen.runtimeType == type);
  }

  @override
  Widget build(BuildContext context) {
    _buildNavItemsV2();

    if (_allScreens.isEmpty) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    String uRole = _role.toUpperCase();

    return Scaffold(
      appBar: _useDrawer ? AppBar(
        title: const Text('Excellent Solar', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        elevation: 0,
      ) : null,
      drawer: _useDrawer ? Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: const BoxDecoration(color: Color(0xFF7C5800)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  const CircleAvatar(
                    backgroundColor: Colors.white,
                    radius: 30,
                    child: Icon(Icons.solar_power, color: Color(0xFF7C5800), size: 36),
                  ),
                  const SizedBox(height: 12),
                  const Text('Field Operations', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  Text('Role: $_role', style: const TextStyle(color: Colors.white70, fontSize: 14)),
                ],
              ),
            ),
            ListTile(
              leading: const Icon(Icons.dashboard),
              title: const Text('Dashboard'),
              onTap: () => _navigateToScreen(_getScreenIndex(FieldDashboardScreen)),
            ),
            ListTile(
              leading: const Icon(Icons.assignment_turned_in),
              title: const Text('Jobs'),
              onTap: () => _navigateToScreen(_getScreenIndex(MyJobsListScreen)),
            ),
            ListTile(
              leading: const Icon(Icons.confirmation_number),
              title: const Text('Tickets'),
              onTap: () => _navigateToScreen(_getScreenIndex(MyTicketsListScreen)),
            ),
            ListTile(
              leading: const Icon(Icons.local_shipping),
              title: const Text('Orders'),
              onTap: () => _navigateToScreen(_getScreenIndex(OrdersScreen)),
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.electrical_services),
              title: const Text('DISCOM Management'),
              onTap: () => _navigateToScreen(_getScreenIndex(DiscomListScreen)),
            ),
            ListTile(
              leading: const Icon(Icons.inventory_2),
              title: const Text('Scan Inventory'),
              onTap: () => _navigateToScreen(_getScreenIndex(ScanInventoryScreen)),
            ),
            ListTile(
              leading: const Icon(Icons.add_circle),
              title: const Text('New Customer Booking'),
              onTap: () => _navigateToScreen(_getScreenIndex(OnGridBookingForm)),
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.person),
              title: const Text('My Profile & Settings'),
              onTap: () => _navigateToScreen(_getScreenIndex(ProfileScreen)),
            ),
          ],
        ),
      ) : null,
      body: SafeArea(child: _allScreens[_selectedIndex]),
      bottomNavigationBar: (!_useDrawer || _selectedIndex < _bottomNavDestinations.length) 
        ? NavigationBar(
            selectedIndex: _useDrawer ? _selectedIndex : _selectedIndex, // Always sync
            onDestinationSelected: (index) {
              setState(() {
                _selectedIndex = index;
              });
            },
            destinations: _bottomNavDestinations,
          ) 
        : null,
    );
  }
}

// ----------------------------------------------------
// 1. FIELD DASHBOARD SCREEN
// ----------------------------------------------------
// FieldDashboardScreen has been moved to lib/screens/dashboard_screen.dart

// ----------------------------------------------------
// 3. COMPLETE BOOKING FORM (MATCHES THE SCREENSHOT)
// ----------------------------------------------------
// OnGridBookingForm has been moved to lib/screens/booking_screen.dart

// ----------------------------------------------------
// 4. JOB DETAIL & CHECKLIST SCREEN
// ----------------------------------------------------
class JobDetailScreen extends StatefulWidget {
  const JobDetailScreen({super.key});

  @override
  State<JobDetailScreen> createState() => _JobDetailScreenState();
}

class _JobDetailScreenState extends State<JobDetailScreen> {
  // Document checklists state
  bool pspclBill = false;
  bool photoUploaded = false;
  bool aadhaarCard = false;
  bool cancelledCheque = false;
  bool agreementSigned = false;

  // Installation checkpoints
  bool serviceWireStatus = false;
  bool wifiConfigured = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Job Details & PSPCL Checks'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Raj Kumar - Ludhiana West',
            style: GoogleFonts.hankenGrotesk(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          const Text('PSPCL App ID: App-908123', style: TextStyle(fontFamily: 'JetBrains Mono', color: Colors.grey)),
          const Divider(height: 24),

          // DOCUMENTS ATTACHMENT CHECKLIST
          Text('Documents Checklist', style: GoogleFonts.hankenGrotesk(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          CheckboxListTile(
            title: const Text('Recent PSPCL Electricity Bill'),
            value: pspclBill,
            onChanged: (val) => setState(() => pspclBill = val!),
          ),
          CheckboxListTile(
            title: const Text('Customer Photo (Site/Avatar)'),
            value: photoUploaded,
            onChanged: (val) => setState(() => photoUploaded = val!),
          ),
          CheckboxListTile(
            title: const Text('Aadhaar Card copy'),
            value: aadhaarCard,
            onChanged: (val) => setState(() => aadhaarCard = val!),
          ),
          CheckboxListTile(
            title: const Text('Cancelled Cheque details'),
            value: cancelledCheque,
            onChanged: (val) => setState(() => cancelledCheque = val!),
          ),
          CheckboxListTile(
            title: const Text('Booking Agreement'),
            value: agreementSigned,
            onChanged: (val) => setState(() => agreementSigned = val!),
          ),

          const SizedBox(height: 16),
          const Divider(),

          // EXPENSES AND STAFF DETAILS
          Text('Concerned JE & Office Details', style: GoogleFonts.hankenGrotesk(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          const TextField(
            decoration: InputDecoration(
              labelText: 'JE Name & Contact details',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          const TextField(
            decoration: InputDecoration(
              labelText: 'Expenses for SDO/XEN Meter approval',
              border: OutlineInputBorder(),
            ),
            keyboardType: TextInputType.number,
          ),

          const SizedBox(height: 16),
          const Divider(),

          // SURVEY & NETWORK INSTALLS
          Text('Site Setup Status', style: GoogleFonts.hankenGrotesk(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          SwitchListTile(
            title: const Text('Service Wire Installed'),
            value: serviceWireStatus,
            onChanged: (val) => setState(() => serviceWireStatus = val!),
          ),
          SwitchListTile(
            title: const Text('Inverter WiFi Configured & Active'),
            value: wifiConfigured,
            onChanged: (val) => setState(() => wifiConfigured = val!),
          ),

          const SizedBox(height: 24),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF7C5800),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('PSPCL Status and documents saved!')),
              );
              Navigator.pop(context);
            },
            child: const Text('Submit Progress Report'),
          ),
          const SizedBox(height: 36),
        ],
      ),
    );
  }
}

// ----------------------------------------------------
// 5. PROFILE SCREEN
// ----------------------------------------------------
// ProfileScreen has been moved to lib/screens/profile_screen.dart
