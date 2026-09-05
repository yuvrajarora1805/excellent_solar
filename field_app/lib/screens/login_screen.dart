import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../main.dart' show baseUrl, MainNavigationScreen; // To access baseUrl and MainNavigationScreen

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String _errorMsg = '';

  Future<void> _login() async {
    setState(() {
      _isLoading = true;
      _errorMsg = '';
    });

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/mobile/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': _emailController.text.trim(),
          'password': _passwordController.text,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setInt('worker_id', data['user']['id']);
        await prefs.setString('worker_name', data['user']['name'] ?? 'User');
        await prefs.setString('worker_email', data['user']['email'] ?? '');
        await prefs.setString('worker_role', data['user']['role'] ?? 'ADMIN');
        await prefs.setString('worker_mobile', data['user']['mobile'] ?? '');
        if (data.containsKey('token')) {
          await prefs.setString('jwt_token', data['token']);
        }

        if (!mounted) return;
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const MainNavigationScreen()),
          (route) => false,
        );
      } else {
        print('LOGIN FAILED: Status Code ${response.statusCode}, Body: ${response.body}');
        setState(() {
          _errorMsg = 'Invalid email or password.';
        });
      }
    } catch (e) {
      print('LOGIN EXCEPTION: $e');
      setState(() {
        _errorMsg = 'Connection error. Please try again.';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Icon(Icons.solar_power, size: 80, color: Color(0xFF7C5800)),
                const SizedBox(height: 16),
                const Text(
                  'Excellent Solar',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Color(0xFF7C5800)),
                ),
                const Text(
                  'Field Worker Portal',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 16, color: Colors.grey),
                ),
                const SizedBox(height: 48),
                if (_errorMsg.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 16),
                    color: Colors.red.shade50,
                    child: Text(_errorMsg, style: TextStyle(color: Colors.red.shade700)),
                  ),
                TextField(
                  controller: _emailController,
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.email),
                  ),
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _passwordController,
                  decoration: const InputDecoration(
                    labelText: 'Password',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.lock),
                  ),
                  obscureText: true,
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _isLoading ? null : _login,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: const Color(0xFF7C5800),
                    foregroundColor: Colors.white,
                  ),
                  child: _isLoading 
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Login', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
