import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';


class ApiService {
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
    return await http.get(url, headers: await _getHeaders());
  }

  static Future<http.Response> post(Uri url, {Map<String, String>? headers, Object? body}) async {
    final bodyData = (body is Map || body is List) ? jsonEncode(body) : body;
    return await http.post(url, headers: await _getHeaders(headers), body: bodyData);
  }

  static Future<http.Response> put(Uri url, {Map<String, String>? headers, Object? body}) async {
    final bodyData = (body is Map || body is List) ? jsonEncode(body) : body;
    return await http.put(url, headers: await _getHeaders(headers), body: bodyData);
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
