enum NetworkConnectionType { wifi, mobile, ethernet, bluetooth, none }

enum NetworkSignalStrength { excellent, good, fair, poor, none }

class NetworkStatus {
  final bool isConnected;
  final bool hasInternet;
  final NetworkConnectionType connectionType;
  final NetworkSignalStrength signalStrength;
  final String? networkName;
  final String? ipAddress;

  const NetworkStatus({
    required this.isConnected,
    required this.hasInternet,
    required this.connectionType,
    required this.signalStrength,
    this.networkName,
    this.ipAddress,
  });

  factory NetworkStatus.disconnected() {
    return const NetworkStatus(
      isConnected: false,
      hasInternet: false,
      connectionType: NetworkConnectionType.none,
      signalStrength: NetworkSignalStrength.none,
    );
  }

  NetworkStatus copyWith({
    bool? isConnected,
    bool? hasInternet,
    NetworkConnectionType? connectionType,
    NetworkSignalStrength? signalStrength,
    String? networkName,
    String? ipAddress,
  }) {
    return NetworkStatus(
      isConnected: isConnected ?? this.isConnected,
      hasInternet: hasInternet ?? this.hasInternet,
      connectionType: connectionType ?? this.connectionType,
      signalStrength: signalStrength ?? this.signalStrength,
      networkName: networkName ?? this.networkName,
      ipAddress: ipAddress ?? this.ipAddress,
    );
  }

  @override
  String toString() {
    return 'NetworkStatus(isConnected: $isConnected, hasInternet: $hasInternet, connectionType: $connectionType, signalStrength: $signalStrength, networkName: $networkName, ipAddress: $ipAddress)';
  }
}
