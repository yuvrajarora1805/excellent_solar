import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/material.dart';
import '../main.dart' show navigatorKey;
import '../screens/login_screen.dart';

class ApiService {
  static void _handle401() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    
    final context = navigatorKey.currentContext;
    if (context != null) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (context) => const LoginScreen()),
        (route) => false,
      );
    }
  }

  static Future<http.Response> _checkResponse(http.Response response) async {
    if (response.statusCode == 401) {
      _handle401();
    }
    return response;
  }
  static Future<Map<String, String>> _getHeaders([Map<String, String>? extraHeaders]) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('jwt_token') ?? '';
    final headers = <String, String>{
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    };
    if (extraHeaders != null) {
      headers.addAll(extraHeaders);
    }
    return headers;
  }

  static Future<http.Response> get(Uri url) async {
    final response = await http.get(url, headers: await _getHeaders());
    return await _checkResponse(response);
  }

  static Future<http.Response> post(Uri url, {Map<String, String>? headers, Object? body}) async {
    final bodyData = (body is Map || body is List) ? jsonEncode(body) : body;
    final response = await http.post(url, headers: await _getHeaders(headers), body: bodyData);
    return await _checkResponse(response);
  }

  static Future<http.Response> put(Uri url, {Map<String, String>? headers, Object? body}) async {
    final bodyData = (body is Map || body is List) ? jsonEncode(body) : body;
    final response = await http.put(url, headers: await _getHeaders(headers), body: bodyData);
    return await _checkResponse(response);
  }


  static Future<http.MultipartRequest> multipartRequest(String method, Uri url) async {
    final request = http.MultipartRequest(method, url);
    request.headers.addAll(await _getHeaders());
    return request;
  }

  static Future<http.StreamedResponse> sendMultipart(http.MultipartRequest request) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('jwt_token') ?? '';
    request.headers['Authorization'] = 'Bearer $token';
    return await request.send();
  }
}
