import 'dart:convert';
import 'dart:typed_data';
import 'dart:developer' as dev;

/// Packet format interpreter for USB communication with audio devices.
///
/// This class handles the construction and parsing of packets according to the
/// device protocol. It includes a USB buffer fix that adds a null byte after
/// packets that are exactly 512 bytes long to prevent them from getting stuck
/// in USB endpoint buffers.
///
/// Protocol format: [STK][ID][LEN_HIGH][LEN_LOW][PAYLOAD][CRC][ETK]
/// Where:
/// - STK: Start token (0x4B / 'K')
/// - ID: Packet identifier
/// - LEN_HIGH/LEN_LOW: Payload length in big-endian format
/// - PAYLOAD: JSON data with null terminator
/// - CRC: XOR-based checksum of payload
/// - ETK: End token (0x6B / 'k')
///
/// USB Buffer Fix: When a packet is exactly 512 bytes, a null byte (0x00) is
/// added after the end token to prevent the packet from getting stuck in USB
/// endpoint buffers. This null byte is not part of the protocol and is ignored
/// during parsing.
class PacketFormatInterpreter {
  final int Stk = 0x4B; // Start Token ('K')
  final int Etk = 0x6B; // End Token ('k')

  /// Cache for storing incomplete packets between reads
  List<int> _cache = [];

  void _log(String message, {String name = 'PacketInterpreter'}) {
    dev.log(message, name: name, time: DateTime.now());
  }

  /// Constructs a packet from a JSON payload
  Uint8List constructPacket(Map<String, dynamic> jsonPayload) {
    // Ensure JSON is properly enclosed in curly braces
    List<int> jsonBytes = utf8.encode(jsonEncode(jsonPayload));

    // Create payload with null terminator
    List<int> payload = [...jsonBytes, 0x00];

    // Calculate length (big-endian)
    int lengthHigh = (payload.length >> 8) & 0xFF;
    int lengthLow = payload.length & 0xFF;

    int crc = calcCRC(payload);

    List<int> packet = [Stk, 0x42, lengthHigh, lengthLow, ...payload, crc, Etk];

    // Apply USB 512-byte buffer fix
    _applyUsbBufferFix(packet, context: 'JSON packet');

    _log('[USB] Sent: ${jsonEncode(jsonPayload)}');

    return Uint8List.fromList(packet);
  }

  /// Calculate XOR-based CRC
  int calcCRC(List<int> buf) {
    int crc = 0;
    for (var byte in buf) {
      crc ^= byte;
    }
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

    // Apply USB 512-byte buffer fix
    _applyUsbBufferFix(packet, context: 'serial number query packet');

    return Uint8List.fromList(packet);
  }

  /// Process incoming data and parse valid packets
  List<int>? onListenerDataReady(List<int> buffer) {
    if (buffer.isEmpty) {
      return null;
    }

    try {
      List<int> combinedBuffer = [..._cache, ...buffer];
      _cache.clear();

      var position = 0;
      do {
        int bytesToStk = 0;
        int packetLength = 0;

        // Find start token
        while (position < combinedBuffer.length &&
            combinedBuffer[position] != Stk) {
          position++;
          bytesToStk++;
        }

        if (position >= combinedBuffer.length) {
          _cache = List<int>.from(combinedBuffer);
          return null;
        }

        // Check if we have enough bytes for the length field
        if (position + 4 > combinedBuffer.length) {
          _cache = List<int>.from(combinedBuffer.sublist(position));
          return null;
        }

        // Get payload length
        int payloadLength =
            (combinedBuffer[position + 2] << 8) | combinedBuffer[position + 3];

        if (position + payloadLength + 6 > combinedBuffer.length) {
          _cache = List<int>.from(combinedBuffer.sublist(position));
          return null;
        }

        // Check for end token
        if (combinedBuffer[position + payloadLength + 5] != Etk) {
          _cache = List<int>.from(combinedBuffer.sublist(position));
          return null;
        }

        Map<String, dynamic> result = isBufferValid(
          combinedBuffer.sublist(position),
        );

        position += bytesToStk;

        if (result['valid'] == true) {
          packetLength = result['packetLength'];

          var packet = combinedBuffer.sublist(
            position,
            position + packetLength,
          );

          // Return first valid packet immediately
          return onIncomingData(packet);
        } else {
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
    try {
      if (buffer.isEmpty || buffer.length < 4) {
        return {'valid': false, 'packetLength': 0};
      }

      // Get payload length (big-endian)
      int payloadLength = (buffer[2] << 8) | buffer[3];

      if (payloadLength < 0 || payloadLength > 65535) {
        return {'valid': false, 'packetLength': 0};
      }

      int totalLength = payloadLength + 6;

      if (totalLength > buffer.length) {
        return {'valid': false, 'packetLength': 0};
      }

      if (buffer[0] != Stk || buffer[totalLength - 1] != Etk) {
        return {'valid': false, 'packetLength': 0};
      }

      try {
        List<int> payload = buffer.sublist(4, 4 + payloadLength);

        int expectedCrc = buffer[totalLength - 2];
        int calculatedCrc = calcCRC(payload);

        if (calculatedCrc != expectedCrc) {
          return {'valid': false, 'packetLength': 0};
        }
      } catch (e) {
        _log('Error during CRC validation: $e');
        return {'valid': false, 'packetLength': 0};
      }

      return {'valid': true, 'packetLength': totalLength};
    } catch (e) {
      _log('Error in buffer validation: $e');
      return {'valid': false, 'packetLength': 0};
    }
  }

  /// Handle incoming validated packet
  List<int> onIncomingData(List<int> packet) {
    // Extract and log the received payload
    List<int>? payload = extractPayload(packet);
    if (payload != null) {
      try {
        String payloadString = utf8.decode(payload);
        _log('[USB] Received: $payloadString');
      } catch (e) {
        _log(
          '[USB] Received: ${payload.map((b) => '0x${b.toRadixString(16).padLeft(2, '0')}').join(' ')}',
        );
      }
    }
    return packet;
  }

  /// Extract only the payload data from a valid packet, removing protocol overhead
  /// Returns null if the packet is invalid or too short
  List<int>? extractPayload(List<int> packet) {
    try {
      // Check minimum packet length (STK + ID + LEN_LOW + LEN_HIGH + payload + CRC + ETK)
      if (packet.length < 7) {
        return null;
      }

      // Verify start and end tokens
      if (packet[0] != Stk) {
        return null;
      }

      if (packet[packet.length - 1] != Etk) {
        return null;
      }

      // Extract payload length (big endian)
      int payloadLength = (packet[2] << 8) | packet[3]; // Changed to big-endian

      // Verify packet length matches expected total length
      int expectedTotalLength =
          payloadLength + 6; // Header(4) + CRC(1) + ETK(1)

      // Check for USB buffer fix (null byte after 512-byte packets)
      bool hasUsbBufferFix =
          packet.length == expectedTotalLength + 1 &&
          packet[packet.length - 1] == 0x00;

      if (packet.length != expectedTotalLength && !hasUsbBufferFix) {
        return null;
      }

      // Extract just the payload (skipping header bytes and trailing CRC/ETK)
      if (4 + payloadLength > packet.length) {
        return null;
      }

      List<int> payload = packet.sublist(4, 4 + payloadLength);

      // Verify CRC before returning payload
      int expectedCrc = packet[packet.length - 2];
      int calculatedCrc = calcCRC(payload);

      if (calculatedCrc != expectedCrc) {
        return null;
      }

      return payload;
    } catch (e) {
      _log('Error extracting payload: $e');
      return null;
    }
  }

  /// Clear the internal cache of incomplete packets
  void clearCache() {
    _cache.clear();
  }

  /// Apply USB 512-byte buffer fix to prevent packets from getting stuck
  /// This adds a null byte after packets that are exactly 512 bytes long
  void _applyUsbBufferFix(List<int> packet, {String context = 'packet'}) {
    if (packet.length == 512) {
      packet.add(0x00); // Add null byte after the complete packet
    }
  }
}
