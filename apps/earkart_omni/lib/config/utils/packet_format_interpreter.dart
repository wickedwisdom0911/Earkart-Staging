import 'dart:convert';
import 'dart:typed_data';
import 'dart:developer' as dev;

class PacketFormatInterpreter {
  final int Stk = 0x4B; // Start Token ('K')
  final int Etk = 0x6B; // End Token ('k')

  /// Cache for storing incomplete packets between reads
  List<int> _cache = [];

  void _log(String message, {String name = 'PacketInterpreter'}) {
    dev.log(message, name: name, time: DateTime.now());
    // print('[$name] $message'); // Added print for immediate console visibility
  }

  /// Constructs a packet from a JSON payload
  Uint8List constructPacket(Map<String, dynamic> jsonPayload) {
    _log('=== Starting Packet Construction ===');

    // Ensure JSON is properly enclosed in curly braces
    List<int> jsonBytes = utf8.encode(jsonEncode(jsonPayload));
    // _log('JSON bytes: ${_bytesToHex(jsonBytes)}');

    // Create payload with null terminator
    List<int> payload = [...jsonBytes, 0x00];
    // _log('Payload with null terminator: ${_bytesToHex(payload)}');

    // Calculate length (big-endian)
    int lengthHigh = (payload.length >> 8) & 0xFF;
    int lengthLow = payload.length & 0xFF;
    // _log(
    //   'Payload length: ${payload.length} (High: 0x${lengthHigh.toRadixString(16)}, Low: 0x${lengthLow.toRadixString(16)})',
    // );

    int crc = calcCRC(payload);
    // _log('Calculated CRC: 0x${crc.toRadixString(16)}');

    List<int> packet = [Stk, 0x42, lengthHigh, lengthLow, ...payload, crc, Etk];

    // _log('Final packet: ${_bytesToHex(packet)}');
    _log('=== Packet Construction Complete ===\n');
    _log('[USB] Sent: ${jsonEncode(jsonPayload)}');

    return Uint8List.fromList(packet);
  }

  /// Calculate XOR-based CRC
  int calcCRC(List<int> buf) {
    int crc = 0;
    for (var byte in buf) {
      crc ^= byte;
    }
    // _log(
    //   'CRC calculation for ${_bytesToHex(buf)} = 0x${crc.toRadixString(16)}',
    // );
    return crc;
  }

  /// Constructs a packet to query the serial number
  /// Returns a properly formatted packet with a fixed payload for serial number query
  Uint8List sendSerialNumberQuery() {
    const int startToken = 0x4B; // 'K'
    const int packetID = 0x43; // 'C'
    const int endToken = 0x6B; // 'k'

    // Convert JSON string to bytes and add null terminator
    List<int> payload = [];
    payload.add(0x16); // Sync
    payload.add(0x03); // Sync parameters
    payload.add(0x01); // Sync parameters
    // when packetID is 0x43, payload must always be at least 10 bytes, fill the rest with 0x00
    payload.add(0x00);
    payload.add(0x00);
    payload.add(0x00);
    payload.add(0x00);
    payload.add(0x00);
    payload.add(0x00);
    payload.add(0x00);

    List<int> packet = []; // Create a growable list

    // Add packet components
    packet.add(startToken);
    packet.add(packetID);

    // Add length bytes (big-endian)
    int payloadLength = payload.length;
    packet.add((payloadLength >> 8) & 0xFF); // 0x00
    packet.add(payloadLength & 0xFF); // 0x0A

    // Add payload
    packet.addAll(payload);

    // Add CRC
    packet.add(calcCRC(payload));

    // Add end token
    packet.add(endToken);

    return Uint8List.fromList(packet);
  }

  /// Process incoming data and parse valid packets
  List<int>? onListenerDataReady(List<int> buffer) {
    print('\n=== Starting Data Processing ===');
    // _log('Received buffer: ${_bytesToHex(buffer)}');
    // _log('Buffer length: ${buffer.length} bytes');

    if (_cache.isNotEmpty) {
      // _log('Current cache: ${_bytesToHex(_cache)}');
      _log('Cache length: ${_cache.length} bytes');
    }

    if (buffer.isEmpty) {
      _log('Empty buffer received');
      return null;
    }

    try {
      List<int> combinedBuffer = [..._cache, ...buffer];
      // _log('Combined buffer with cache: ${_bytesToHex(combinedBuffer)}');
      // _log('Combined buffer length: ${combinedBuffer.length} bytes');
      _cache.clear();
      _log('Cache cleared');

      var position = 0;
      do {
        // _log('\nProcessing at position: $position');
        int bytesToStk = 0;
        int packetLength = 0;

        // Find start token
        while (position < combinedBuffer.length &&
            combinedBuffer[position] != Stk) {
          position++;
          bytesToStk++;
        }

        // _log('Bytes to STK: $bytesToStk');
        // _log('Found STK at position: $position');

        if (position >= combinedBuffer.length) {
          _log('No STK found, caching entire buffer');
          _cache = List<int>.from(combinedBuffer);
          _log('New cache content: ${_bytesToHex(_cache)}');
          return null;
        }

        // Check if we have enough bytes for the length field
        if (position + 4 > combinedBuffer.length) {
          // _log('Insufficient bytes for length field, caching from STK');
          _cache = List<int>.from(combinedBuffer.sublist(position));
          // _log('Cached data: ${_bytesToHex(_cache)}');
          return null;
        }

        // Get payload length
        int payloadLength =
            (combinedBuffer[position + 2] << 8) | combinedBuffer[position + 3];
        _log('Payload length from packet: $payloadLength bytes');
        _log('Total expected packet length: ${payloadLength + 6} bytes');

        if (position + payloadLength + 6 > combinedBuffer.length) {
          _log('Insufficient bytes for complete packet, caching from STK');
          _log('Position: $position, Buffer length: ${combinedBuffer.length}');
          _cache = List<int>.from(combinedBuffer.sublist(position));
          // _log('Cached data: ${_bytesToHex(_cache)}');
          return null;
        }

        // Check for end token
        if (combinedBuffer[position + payloadLength + 5] != Etk) {
          // _log('No ETK found at expected position, caching from STK');
          _cache = List<int>.from(combinedBuffer.sublist(position));
          // _log('Cached data: ${_bytesToHex(_cache)}');
          return null;
        }

        Map<String, dynamic> result = isBufferValid(
          combinedBuffer.sublist(position),
        );

        position += bytesToStk;

        if (result['valid'] == true) {
          packetLength = result['packetLength'];
          _log('Valid packet found, length: $packetLength');

          var packet = combinedBuffer.sublist(
            position,
            position + packetLength,
          );
          // _log('Extracted valid packet: ${_bytesToHex(packet)}');

          // Return first valid packet immediately
          return onIncomingData(packet);
        } else {
          _log('Invalid packet at position $position');
          position++;
        }
      } while (position < combinedBuffer.length);
    } catch (e) {
      _log('Critical error in packet processing: $e');
      _cache.clear();
    }

    return null;
  }

  /// Validate buffer and return packet information
  Map<String, dynamic> isBufferValid(List<int> buffer) {
    _log('=== Starting Buffer Validation ===');
    // _log('Buffer to validate: ${_bytesToHex(buffer)}');
    // _log('Buffer length: ${buffer.length} bytes');

    try {
      if (buffer.isEmpty || buffer.length < 4) {
        _log('Buffer too short (${buffer.length} bytes), minimum 4 required');
        return {'valid': false, 'packetLength': 0};
      }

      // Get payload length (big-endian)
      int payloadLength = (buffer[2] << 8) | buffer[3];
      //       _log('''
      // Decoded length details:
      // - Raw bytes: High=0x${buffer[2].toRadixString(16)}, Low=0x${buffer[3].toRadixString(16)}
      // - Calculated length: $payloadLength
      // ''');

      if (payloadLength < 0 || payloadLength > 65535) {
        _log('Invalid payload length: $payloadLength');
        return {'valid': false, 'packetLength': 0};
      }

      int totalLength = payloadLength + 6;
      _log('Expected total packet length: $totalLength');

      if (totalLength > buffer.length) {
        _log('Buffer too short: has ${buffer.length}, needs $totalLength');
        return {'valid': false, 'packetLength': 0};
      }

      if (buffer[0] != Stk || buffer[totalLength - 1] != Etk) {
        _log('''
Invalid tokens:
- STK: Expected=0x4B, Got=0x${buffer[0].toRadixString(16)}
- ETK: Expected=0x6B, Got=0x${buffer[totalLength - 1].toRadixString(16)}
''');
        return {'valid': false, 'packetLength': 0};
      }

      try {
        List<int> payload = buffer.sublist(4, 4 + payloadLength);
        // _log('Extracted payload: ${_bytesToHex(payload)}');
        // _log('Payload length: ${payload.length} bytes');

        int expectedCrc = buffer[totalLength - 2];
        int calculatedCrc = calcCRC(payload);
        //         _log('''
        // CRC Validation:
        // - Expected: 0x${expectedCrc.toRadixString(16)}
        // - Calculated: 0x${calculatedCrc.toRadixString(16)}
        // ''');

        if (calculatedCrc != expectedCrc) {
          _log('CRC mismatch');
          return {'valid': false, 'packetLength': 0};
        }
      } catch (e) {
        _log('Error during CRC validation: $e');
        return {'valid': false, 'packetLength': 0};
      }

      _log('Buffer validation successful');
      _log('=== Validation Complete ===\n');
      return {'valid': true, 'packetLength': totalLength};
    } catch (e) {
      _log('Error in buffer validation: $e');
      return {'valid': false, 'packetLength': 0};
    }
  }

  /// Handle incoming validated packet
  List<int> onIncomingData(List<int> packet) {
    // _log('''
    // === Processing Valid Packet ===
    // - Full packet: ${_bytesToHex(packet)}
    // - Length: ${packet.length}
    // ''');
    _log('=== Processing Complete ===\n');
    return packet;
  }

  /// Extract only the payload data from a valid packet, removing protocol overhead
  /// Returns null if the packet is invalid or too short
  List<int>? extractPayload(List<int> packet) {
    try {
      _log('Attempting to extract payload from packet');

      // Check minimum packet length (STK + ID + LEN_LOW + LEN_HIGH + payload + CRC + ETK)
      if (packet.length < 7) {
        print('Packet too short: ${packet.length} bytes');
        return null;
      }

      // Verify start and end tokens
      if (packet[0] != Stk) {
        print('Invalid start token: 0x${packet[0].toRadixString(16)}');
        return null;
      }

      if (packet[packet.length - 1] != Etk) {
        print(
          'Invalid end token: 0x${packet[packet.length - 1].toRadixString(16)}',
        );
        return null;
      }

      // Extract payload length (big endian)
      int payloadLength = (packet[2] << 8) | packet[3]; // Changed to big-endian
      print('Decoded payload length: $payloadLength');

      // Verify packet length matches expected total length
      int expectedTotalLength =
          payloadLength + 6; // Header(4) + CRC(1) + ETK(1)
      print(
        'Expected total length: $expectedTotalLength, Actual length: ${packet.length}',
      );

      if (packet.length != expectedTotalLength) {
        print(
          'Length mismatch: Expected $expectedTotalLength, got ${packet.length}',
        );
        return null;
      }

      // Extract just the payload (skipping header bytes and trailing CRC/ETK)
      if (4 + payloadLength > packet.length) {
        print('Payload bounds would exceed packet length');
        return null;
      }

      List<int> payload = packet.sublist(4, 4 + payloadLength);
      // print(
      //   'Extracted payload: ${payload.map((byte) => '0x${byte.toRadixString(16).padLeft(2, '0')}').join(' ')}',
      // );

      // Verify CRC before returning payload
      int expectedCrc = packet[packet.length - 2];
      int calculatedCrc = calcCRC(payload);
      // print(
      //   'CRC check - Expected: 0x${expectedCrc.toRadixString(16)}, Calculated: 0x${calculatedCrc.toRadixString(16)}',
      // );

      if (calculatedCrc != expectedCrc) {
        print('CRC mismatch');
        return null;
      }

      print('Successfully extracted payload of length: ${payload.length}');
      return payload;
    } catch (e) {
      print('Error extracting payload: $e');
      return null;
    }
  }

  /// Helper method to convert bytes to readable hex string
  String _bytesToHex(List<int> bytes) {
    if (bytes.isEmpty) return "[]";
    return '[${bytes.map((b) => '0x${b.toRadixString(16).padLeft(2, '0')}').join(', ')}]';
  }

  /// Clear the internal cache of incomplete packets
  void clearCache() {
    _cache.clear();
    _log('Cache cleared');
  }
}
