import 'package:flutter/material.dart';

class ReportPTAWidget extends StatelessWidget {
  const ReportPTAWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            const SizedBox(height: 16),
            _buildPatientInfo(),
            const SizedBox(height: 16),
            _buildAudiogramCharts(),
            const SizedBox(height: 16),
            _buildPTATable(),
            const SizedBox(height: 16),
            _buildDiagnosisSection(),
            const SizedBox(height: 16),
            _buildFooter(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          // Logo placeholder
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: Colors.blue[100],
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.hearing, size: 40, color: Colors.blue),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'earKART',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.blue[900],
                  ),
                ),
                const Text(
                  'REDEFINING HEARING CARE',
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue[200],
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  'Clinic Name',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                Text('+91 XXXXXXXXXX', style: TextStyle(fontSize: 12)),
                Text('Address', style: TextStyle(fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPatientInfo() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Pure Tone Audiogram',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildInfoField(
                  'ID',
                  '...............................................',
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildInfoField(
                  'Date',
                  '...................................',
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                flex: 2,
                child: _buildInfoField(
                  'Name',
                  '............................................................................................',
                ),
              ),
              const SizedBox(width: 16),
              Expanded(child: _buildInfoField('Age', '.....................')),
              const SizedBox(width: 16),
              Expanded(
                child: _buildInfoField('Sex', '........................'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          _buildInfoField(
            'Address',
            '................................................................................................................................',
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _buildInfoField(
                  'Contact No.',
                  '...................................................',
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildInfoField(
                  'Referred by',
                  '..............................................',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoField(String label, String dots) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.baseline,
      textBaseline: TextBaseline.alphabetic,
      children: [
        Text(
          '$label : ',
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
        ),
        Expanded(
          child: Text(
            dots,
            style: TextStyle(fontSize: 12, color: Colors.grey[600]),
          ),
        ),
      ],
    );
  }

  Widget _buildAudiogramCharts() {
    return Row(
      children: [
        Expanded(child: _buildAudiogramChart('Right Ear')),
        const SizedBox(width: 16),
        Expanded(child: _buildAudiogramChart('Left Ear')),
      ],
    );
  }

  Widget _buildAudiogramChart(String title) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          // Frequency labels
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: const [
              Text('125', style: TextStyle(fontSize: 10)),
              Text('250', style: TextStyle(fontSize: 10)),
              Text('500', style: TextStyle(fontSize: 10)),
              Text('1000', style: TextStyle(fontSize: 10)),
              Text('2000', style: TextStyle(fontSize: 10)),
              Text('4000', style: TextStyle(fontSize: 10)),
              Text('8000', style: TextStyle(fontSize: 10)),
              Text('12000', style: TextStyle(fontSize: 10)),
            ],
          ),
          const SizedBox(height: 4),
          // Audiogram grid
          Container(
            height: 200,
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey[400]!),
            ),
            child: CustomPaint(
              painter: AudiogramGridPainter(),
              size: const Size(double.infinity, 200),
            ),
          ),
          const SizedBox(height: 4),
          // Frequency range labels
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: const [
              Text('750', style: TextStyle(fontSize: 10)),
              Text('1500', style: TextStyle(fontSize: 10)),
              Text('3000', style: TextStyle(fontSize: 10)),
              Text('6000', style: TextStyle(fontSize: 10)),
              Text('10000', style: TextStyle(fontSize: 10)),
            ],
          ),
          const SizedBox(height: 4),
          const Text(
            'Frequency (Hz)',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  Widget _buildPTATable() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // PTA Table
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.blue[900],
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text(
                  'PTA',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.blue[900],
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'Symbols',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // PTA Values
              Container(
                width: 100,
                child: Column(
                  children: [
                    _buildPTARow('', 'Rt', 'Lt'),
                    _buildPTARow('AC', '', ''),
                    _buildPTARow('BC', '', ''),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              // Symbols legend
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey[300]!),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Unmasked',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      _buildSymbolsLegend(),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPTARow(String label, String rt, String lt) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(border: Border.all(color: Colors.grey[300]!)),
      child: Row(
        children: [
          SizedBox(
            width: 30,
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: Text(
              rt,
              textAlign: TextAlign.center,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: Text(
              lt,
              textAlign: TextAlign.center,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSymbolsLegend() {
    return const Text(
      'AC: O (Right) X (Left)\n'
      'BC: < (Right) > (Left)\n'
      'MCL: MR (Right) ML (Left)\n'
      'UCL: UR (Right) UL (Left)\n'
      'SF: SR (Right) SL (Left)\n'
      'SF-A: AR (Right) AL (Left)\n'
      'No Response: ↓',
      style: TextStyle(fontSize: 12),
    );
  }

  Widget _buildDiagnosisSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildDiagnosisBox('Audiological\nDiagnosis :'),
        const SizedBox(height: 16),
        _buildDiagnosisBox('Suggestive of :'),
        const SizedBox(height: 16),
        _buildDiagnosisBox('Recommendation :'),
      ],
    );
  }

  Widget _buildDiagnosisBox(String label) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Container(
              height: 60,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey[300]!),
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFooter() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              const Icon(Icons.phone, color: Colors.blue),
              const SizedBox(width: 8),
              const Text('+91 9289097578'),
              const SizedBox(width: 32),
              const Icon(Icons.web, color: Colors.blue),
              const SizedBox(width: 8),
              const Text('www.earkart.in'),
              const SizedBox(width: 32),
              const Icon(Icons.email, color: Colors.blue),
              const SizedBox(width: 8),
              const Text('info@earkart.in'),
            ],
          ),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.blue),
              borderRadius: BorderRadius.circular(4),
            ),
            child: const Column(
              children: [
                Text(
                  'Audiologist Name',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.blue,
                  ),
                ),
                Text('RCI No.', style: TextStyle(color: Colors.blue)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class AudiogramGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint =
        Paint()
          ..color = Colors.grey[400]!
          ..strokeWidth = 1.0;

    // Draw horizontal lines (hearing levels)
    for (int i = 0; i <= 12; i++) {
      final y = (i / 12) * size.height;
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }

    // Draw vertical lines (frequencies)
    for (int i = 0; i <= 8; i++) {
      final x = (i / 8) * size.width;
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }

    // Draw hearing level labels on the left
    final textPainter = TextPainter(textDirection: TextDirection.ltr);

    for (int i = 0; i <= 12; i++) {
      final level = (i * 10) - 10;
      final y = (i / 12) * size.height;

      textPainter.text = TextSpan(
        text: '$level',
        style: const TextStyle(fontSize: 10, color: Colors.black),
      );
      textPainter.layout();
      textPainter.paint(canvas, Offset(-30, y - 6));
    }

    // Add "Hearing Level (dB HL)" label
    canvas.save();
    canvas.translate(0, size.height / 2);
    canvas.rotate(-1.5708); // -90 degrees in radians

    textPainter.text = const TextSpan(
      text: 'Hearing Level (dB HL)',
      style: TextStyle(
        fontSize: 12,
        color: Colors.black,
        fontWeight: FontWeight.w500,
      ),
    );
    textPainter.layout();
    textPainter.paint(canvas, Offset(-textPainter.width / 2, -40));

    canvas.restore();
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => false;
}
