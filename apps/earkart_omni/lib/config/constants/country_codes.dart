class CountryCode {
  final String code;
  final String name;
  final String flag;

  const CountryCode({
    required this.code,
    required this.name,
    required this.flag,
  });
}

class CountryCodes {
  static const List<CountryCode> codes = [
    CountryCode(code: '+1', name: 'United States', flag: '🇺🇸'),
    CountryCode(code: '+1', name: 'Canada', flag: '🇨🇦'),
    CountryCode(code: '+91', name: 'India', flag: '🇮🇳'),
    CountryCode(code: '+44', name: 'United Kingdom', flag: '🇬🇧'),
    CountryCode(code: '+33', name: 'France', flag: '🇫🇷'),
    CountryCode(code: '+49', name: 'Germany', flag: '🇩🇪'),
    CountryCode(code: '+86', name: 'China', flag: '🇨🇳'),
    CountryCode(code: '+81', name: 'Japan', flag: '🇯🇵'),
    CountryCode(code: '+61', name: 'Australia', flag: '🇦🇺'),
    CountryCode(code: '+55', name: 'Brazil', flag: '🇧🇷'),
    CountryCode(code: '+7', name: 'Russia', flag: '🇷🇺'),
    CountryCode(code: '+34', name: 'Spain', flag: '🇪🇸'),
    CountryCode(code: '+39', name: 'Italy', flag: '🇮🇹'),
    CountryCode(code: '+31', name: 'Netherlands', flag: '🇳🇱'),
    CountryCode(code: '+41', name: 'Switzerland', flag: '🇨🇭'),
    CountryCode(code: '+46', name: 'Sweden', flag: '🇸🇪'),
    CountryCode(code: '+47', name: 'Norway', flag: '🇳🇴'),
    CountryCode(code: '+45', name: 'Denmark', flag: '🇩🇰'),
    CountryCode(code: '+358', name: 'Finland', flag: '🇫🇮'),
    CountryCode(code: '+82', name: 'South Korea', flag: '🇰🇷'),
    CountryCode(code: '+65', name: 'Singapore', flag: '🇸🇬'),
    CountryCode(code: '+852', name: 'Hong Kong', flag: '🇭🇰'),
    CountryCode(code: '+971', name: 'UAE', flag: '🇦🇪'),
    CountryCode(code: '+966', name: 'Saudi Arabia', flag: '🇸🇦'),
    CountryCode(code: '+27', name: 'South Africa', flag: '🇿🇦'),
    CountryCode(code: '+52', name: 'Mexico', flag: '🇲🇽'),
    CountryCode(code: '+54', name: 'Argentina', flag: '🇦🇷'),
    CountryCode(code: '+60', name: 'Malaysia', flag: '🇲🇾'),
    CountryCode(code: '+66', name: 'Thailand', flag: '🇹🇭'),
    CountryCode(code: '+84', name: 'Vietnam', flag: '🇻🇳'),
    CountryCode(code: '+63', name: 'Philippines', flag: '🇵🇭'),
    CountryCode(code: '+62', name: 'Indonesia', flag: '🇮🇩'),
    CountryCode(code: '+92', name: 'Pakistan', flag: '🇵🇰'),
    CountryCode(code: '+880', name: 'Bangladesh', flag: '🇧🇩'),
    CountryCode(code: '+94', name: 'Sri Lanka', flag: '🇱🇰'),
    CountryCode(code: '+977', name: 'Nepal', flag: '🇳🇵'),
    CountryCode(code: '+98', name: 'Iran', flag: '🇮🇷'),
    CountryCode(code: '+90', name: 'Turkey', flag: '🇹🇷'),
    CountryCode(code: '+30', name: 'Greece', flag: '🇬🇷'),
    CountryCode(code: '+351', name: 'Portugal', flag: '🇵🇹'),
    CountryCode(code: '+353', name: 'Ireland', flag: '🇮🇪'),
    CountryCode(code: '+48', name: 'Poland', flag: '🇵🇱'),
    CountryCode(code: '+420', name: 'Czech Republic', flag: '🇨🇿'),
    CountryCode(code: '+36', name: 'Hungary', flag: '🇭🇺'),
    CountryCode(code: '+40', name: 'Romania', flag: '🇷🇴'),
    CountryCode(code: '+380', name: 'Ukraine', flag: '🇺🇦'),
    CountryCode(code: '+20', name: 'Egypt', flag: '🇪🇬'),
    CountryCode(code: '+234', name: 'Nigeria', flag: '🇳🇬'),
    CountryCode(code: '+254', name: 'Kenya', flag: '🇰🇪'),
    CountryCode(code: '+233', name: 'Ghana', flag: '🇬🇭'),
    CountryCode(code: '+213', name: 'Algeria', flag: '🇩🇿'),
    CountryCode(code: '+212', name: 'Morocco', flag: '🇲🇦'),
  ];

  // Helper method to get country code by code string
  static CountryCode? getByCode(String code) {
    try {
      return codes.firstWhere((country) => country.code == code);
    } catch (e) {
      return null;
    }
  }

  // Helper method to get default country code (India)
  static CountryCode getDefault() {
    return getByCode('+91') ?? codes.first;
  }

  // Helper method to get all codes as strings
  static List<String> getCodes() {
    return codes.map((country) => country.code).toList();
  }

  // Helper method to convert to Map format for backward compatibility
  static List<Map<String, String>> toMapList() {
    return codes
        .map(
          (country) => {
            'code': country.code,
            'name': country.name,
            'flag': country.flag,
          },
        )
        .toList();
  }
}
