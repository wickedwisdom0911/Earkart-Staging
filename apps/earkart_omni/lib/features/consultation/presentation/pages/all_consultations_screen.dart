import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/widgets/glassmorphism_app_bar.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.state.dart';
import 'package:earkart_omni/models/consultation/consultation.entity.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';

class AllConsultationsScreen extends StatefulWidget {
  const AllConsultationsScreen({super.key});
  static const routeName = "/all-consultations";

  @override
  State<AllConsultationsScreen> createState() => _AllConsultationsScreenState();
}

class _AllConsultationsScreenState extends State<AllConsultationsScreen> {
  @override
  void initState() {
    super.initState();
    // Fetch consultations when screen loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ConsultationCubit>().getConsultationsByCentreId();
    });
  }

  Future<void> _onRefresh() async {
    context.read<ConsultationCubit>().getConsultationsByCentreId();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: GlassmorphismAppBar(title: const Text('All Consultations')),
      backgroundColor: Constants.bg,
      body: RefreshIndicator(
        onRefresh: _onRefresh,
        color: Constants.secondaryColor,
        backgroundColor: Colors.white,
        child: BlocBuilder<ConsultationCubit, ConsultationState>(
          builder: (context, state) {
            if (state is ConsultationLoading) {
              return const Center(child: CircularProgressIndicator());
            }

            if (state is AllConsultationsError) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.error_outline,
                        size: 64,
                        color: Colors.red.shade300,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Error loading consultations',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: Colors.grey.shade800,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        state.message,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade600,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: _onRefresh,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Constants.secondaryColor,
                          foregroundColor: Colors.white,
                        ),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              );
            }

            if (state is AllConsultationsSuccess) {
              if (state.consultations.isEmpty) {
                return Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.calendar_today_outlined,
                          size: 64,
                          color: Colors.grey.shade400,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No consultations found',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: Colors.grey.shade800,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Consultations will appear here once they are created',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey.shade600,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                );
              }

              return ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: state.consultations.length,
                separatorBuilder:
                    (context, index) => const SizedBox(height: 16),
                itemBuilder: (context, index) {
                  final consultation = state.consultations[index];
                  return DetailedConsultationCard(consultation: consultation);
                },
              );
            }

            return const Center(child: CircularProgressIndicator());
          },
        ),
      ),
    );
  }
}

class DetailedConsultationCard extends StatelessWidget {
  final ConsultationEntity consultation;

  const DetailedConsultationCard({super.key, required this.consultation});

  String _formatDate(DateTime? date) {
    if (date == null) return 'No date';
    return DateFormat('MMM dd, yyyy').format(date);
  }

  String _formatTime(DateTime? date) {
    if (date == null) return '';
    return DateFormat('hh:mm a').format(date);
  }

  Color _getStatusColor(SessionStatus? status) {
    switch (status) {
      case SessionStatus.completed:
        return Colors.green;
      case SessionStatus.inProgress:
        return Colors.orange;
      case SessionStatus.cancelled:
        return Colors.red;
      case SessionStatus.failed:
        return Colors.red.shade700;
      case SessionStatus.pending:
        return Colors.blue;
      default:
        return Constants.secondaryColor;
    }
  }

  String _getStatusText(SessionStatus? status) {
    if (status == null) return 'Unknown';
    return status.name
        .split(RegExp(r'(?=[A-Z])'))
        .join(' ')
        .toLowerCase()
        .split(' ')
        .map((word) => word[0].toUpperCase() + word.substring(1))
        .join(' ');
  }

  bool _hasTestReports() {
    return (consultation.audiometryReport != null &&
            consultation.audiometryReport!.isNotEmpty) ||
        (consultation.tympanometryReport != null &&
            consultation.tympanometryReport!.isNotEmpty) ||
        (consultation.oaeReport != null &&
            consultation.oaeReport!.isNotEmpty) ||
        (consultation.otoscopyReport != null &&
            consultation.otoscopyReport!.isNotEmpty) ||
        (consultation.etfReport != null &&
            consultation.etfReport!.isNotEmpty) ||
        (consultation.sisiReport != null &&
            consultation.sisiReport!.isNotEmpty) ||
        (consultation.speechReport != null &&
            consultation.speechReport!.isNotEmpty) ||
        (consultation.reflexesReport != null &&
            consultation.reflexesReport!.isNotEmpty) ||
        (consultation.toneReport != null &&
            consultation.toneReport!.isNotEmpty);
  }

  bool _hasReports() {
    return (consultation.audiometryReport != null &&
            consultation.audiometryReport!.isNotEmpty) ||
        (consultation.tympanometryReport != null &&
            consultation.tympanometryReport!.isNotEmpty) ||
        (consultation.oaeReport != null &&
            consultation.oaeReport!.isNotEmpty) ||
        (consultation.otoscopyReport != null &&
            consultation.otoscopyReport!.isNotEmpty) ||
        (consultation.etfReport != null &&
            consultation.etfReport!.isNotEmpty) ||
        (consultation.sisiReport != null &&
            consultation.sisiReport!.isNotEmpty) ||
        (consultation.speechReport != null &&
            consultation.speechReport!.isNotEmpty) ||
        (consultation.reflexesReport != null &&
            consultation.reflexesReport!.isNotEmpty) ||
        (consultation.toneReport != null &&
            consultation.toneReport!.isNotEmpty);
  }

  List<Widget> _buildReportButtons(BuildContext context) {
    final buttons = <Widget>[];

    if (consultation.audiometryReport != null &&
        consultation.audiometryReport!.isNotEmpty) {
      buttons.add(
        _buildReportButton(
          context,
          'Audiometry',
          Icons.hearing,
          consultation.audiometryReport!,
        ),
      );
    }

    if (consultation.tympanometryReport != null &&
        consultation.tympanometryReport!.isNotEmpty) {
      buttons.add(
        _buildReportButton(
          context,
          'Tympanometry',
          Icons.graphic_eq,
          consultation.tympanometryReport!,
        ),
      );
    }

    if (consultation.oaeReport != null && consultation.oaeReport!.isNotEmpty) {
      buttons.add(
        _buildReportButton(
          context,
          'OAE',
          Icons.audiotrack,
          consultation.oaeReport!,
        ),
      );
    }

    if (consultation.otoscopyReport != null &&
        consultation.otoscopyReport!.isNotEmpty) {
      buttons.add(
        _buildReportButton(
          context,
          'Otoscopy',
          Icons.visibility,
          consultation.otoscopyReport!,
        ),
      );
    }

    if (consultation.etfReport != null && consultation.etfReport!.isNotEmpty) {
      buttons.add(
        _buildReportButton(
          context,
          'ETF',
          Icons.medical_services_outlined,
          consultation.etfReport!,
        ),
      );
    }

    if (consultation.sisiReport != null &&
        consultation.sisiReport!.isNotEmpty) {
      buttons.add(
        _buildReportButton(
          context,
          'SISI',
          Icons.medical_services_outlined,
          consultation.sisiReport!,
        ),
      );
    }

    if (consultation.speechReport != null &&
        consultation.speechReport!.isNotEmpty) {
      buttons.add(
        _buildReportButton(
          context,
          'Speech',
          Icons.record_voice_over,
          consultation.speechReport!,
        ),
      );
    }

    if (consultation.reflexesReport != null &&
        consultation.reflexesReport!.isNotEmpty) {
      buttons.add(
        _buildReportButton(
          context,
          'Reflexes',
          Icons.medical_services_outlined,
          consultation.reflexesReport!,
        ),
      );
    }

    if (consultation.toneReport != null &&
        consultation.toneReport!.isNotEmpty) {
      buttons.add(
        _buildReportButton(
          context,
          'Tone',
          Icons.music_note,
          consultation.toneReport!,
        ),
      );
    }

    return buttons;
  }

  Widget _buildReportButton(
    BuildContext context,
    String label,
    IconData icon,
    String pdfUrl,
  ) {
    return InkWell(
      onTap: () => _viewPdfReport(context, label, pdfUrl),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: Constants.secondaryColor.withOpacity(0.3),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: Constants.secondaryColor.withOpacity(0.1),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: Constants.secondaryColor),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Constants.secondaryColor,
              ),
            ),
            const SizedBox(width: 4),
            Icon(Icons.picture_as_pdf, size: 14, color: Colors.red.shade400),
          ],
        ),
      ),
    );
  }

  Future<void> _viewPdfReport(
    BuildContext context,
    String reportName,
    String pdfUrl,
  ) async {
    // Ensure URL has proper protocol
    String url = pdfUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://$url';
    }

    // Navigate to PDF viewer screen
    if (context.mounted) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => PdfViewerScreen(pdfUrl: url, title: reportName),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row with patient info and status
          Row(
            children: [
              CircleAvatar(
                radius: 24,
                backgroundColor: Constants.accentColor,
                child: Icon(
                  Icons.person,
                  color: Constants.secondaryColor,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      consultation.patient?.name ?? 'Unknown Patient',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    if (consultation.patient?.contactNumber != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        consultation.patient!.contactNumber,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: _getStatusColor(consultation.status).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  _getStatusText(consultation.status),
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: _getStatusColor(consultation.status),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Date and time
          Row(
            children: [
              Icon(Icons.calendar_today, size: 16, color: Colors.grey.shade600),
              const SizedBox(width: 8),
              Text(
                _formatDate(consultation.createdAt),
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade700,
                  fontWeight: FontWeight.w500,
                ),
              ),
              if (consultation.createdAt != null) ...[
                const SizedBox(width: 16),
                Icon(Icons.access_time, size: 16, color: Colors.grey.shade600),
                const SizedBox(width: 8),
                Text(
                  _formatTime(consultation.createdAt),
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade700,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 16),
          // Additional details row
          Wrap(
            spacing: 16,
            runSpacing: 12,
            children: [
              // Audiologist
              if (consultation.audiologist?.user?.name != null)
                _buildDetailChip(
                  icon: Icons.person_outline,
                  label: 'Audiologist',
                  value: consultation.audiologist!.user!.name,
                ),
              // Centre
              if (consultation.centre != null)
                _buildDetailChip(
                  icon: Icons.business_outlined,
                  label: 'Centre',
                  value: consultation.centre!.entName,
                ),
            ],
          ),
          // Tests performed indicators (only show if report URL exists)
          if (_hasTestReports()) ...[
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (consultation.audiometryReport != null &&
                    consultation.audiometryReport!.isNotEmpty)
                  _buildTestBadge('Audiometry', Icons.hearing),
                if (consultation.tympanometryReport != null &&
                    consultation.tympanometryReport!.isNotEmpty)
                  _buildTestBadge('Tympanometry', Icons.graphic_eq),
                if (consultation.oaeReport != null &&
                    consultation.oaeReport!.isNotEmpty)
                  _buildTestBadge('OAE', Icons.audiotrack),
                if (consultation.otoscopyReport != null &&
                    consultation.otoscopyReport!.isNotEmpty)
                  _buildTestBadge('Otoscopy', Icons.visibility),
                if (consultation.etfReport != null &&
                    consultation.etfReport!.isNotEmpty)
                  _buildTestBadge('ETF', Icons.medical_services_outlined),
                if (consultation.sisiReport != null &&
                    consultation.sisiReport!.isNotEmpty)
                  _buildTestBadge('SISI', Icons.medical_services_outlined),
                if (consultation.speechReport != null &&
                    consultation.speechReport!.isNotEmpty)
                  _buildTestBadge('Speech', Icons.record_voice_over),
                if (consultation.reflexesReport != null &&
                    consultation.reflexesReport!.isNotEmpty)
                  _buildTestBadge('Reflexes', Icons.medical_services_outlined),
                if (consultation.toneReport != null &&
                    consultation.toneReport!.isNotEmpty)
                  _buildTestBadge('Tone', Icons.music_note),
              ],
            ),
          ],
          // Notes preview
          if (consultation.notes != null && consultation.notes!.isNotEmpty) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.note_outlined,
                    size: 16,
                    color: Colors.grey.shade600,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      consultation.notes!.length > 100
                          ? '${consultation.notes!.substring(0, 100)}...'
                          : consultation.notes!,
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey.shade700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          // Reports section
          if (_hasReports()) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Constants.accentColor,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: Constants.secondaryColor.withOpacity(0.2),
                  width: 1,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.description_outlined,
                        size: 16,
                        color: Constants.secondaryColor,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Reports',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.grey.shade800,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _buildReportButtons(context),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDetailChip({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: Constants.secondaryColor),
        const SizedBox(width: 6),
        Text(
          '$label: ',
          style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: Colors.grey.shade800,
          ),
        ),
      ],
    );
  }

  Widget _buildTestBadge(String label, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Constants.accentColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Constants.secondaryColor.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: Constants.secondaryColor),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: Constants.secondaryColor,
            ),
          ),
        ],
      ),
    );
  }
}

// PDF Viewer Screen
class PdfViewerScreen extends StatefulWidget {
  final String pdfUrl;
  final String title;

  const PdfViewerScreen({super.key, required this.pdfUrl, required this.title});

  @override
  State<PdfViewerScreen> createState() => _PdfViewerScreenState();
}

class _PdfViewerScreenState extends State<PdfViewerScreen> {
  final GlobalKey<SfPdfViewerState> _pdfViewerKey = GlobalKey();
  bool _isLoading = true;
  String? _errorMessage;
  bool _isDisposed = false;

  @override
  void dispose() {
    _isDisposed = true;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: GlassmorphismAppBar(title: Text(widget.title)),
      body: SafeArea(
        child:
            _errorMessage != null
                ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.error_outline,
                          size: 64,
                          color: Colors.red.shade300,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Error loading PDF',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: Colors.grey.shade800,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _errorMessage!,
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey.shade600,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton(
                          onPressed: () {
                            setState(() {
                              _errorMessage = null;
                              _isLoading = true;
                            });
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Constants.secondaryColor,
                            foregroundColor: Colors.white,
                          ),
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                )
                : Builder(
                  builder: (context) {
                    try {
                      return SizedBox(
                        height: MediaQuery.of(context).size.height,
                        width: MediaQuery.of(context).size.width,
                        child: Stack(
                          children: [
                            SfPdfViewer.network(
                              widget.pdfUrl,
                              key: _pdfViewerKey,
                              onDocumentLoadFailed: (
                                PdfDocumentLoadFailedDetails details,
                              ) {
                                if (!_isDisposed && mounted) {
                                  setState(() {
                                    _isLoading = false;
                                    _errorMessage = details.error.toString();
                                  });
                                }
                              },
                              onDocumentLoaded: (
                                PdfDocumentLoadedDetails details,
                              ) {
                                if (!_isDisposed && mounted) {
                                  setState(() {
                                    _isLoading = false;
                                  });
                                }
                              },
                            ),
                            if (_isLoading)
                              Container(
                                color: Colors.white,
                                child: const Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      CircularProgressIndicator(),
                                      SizedBox(height: 16),
                                      Text(
                                        'Loading PDF...',
                                        style: TextStyle(
                                          fontSize: 14,
                                          color: Colors.grey,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                          ],
                        ),
                      );
                    } catch (e) {
                      // Handle plugin initialization errors
                      WidgetsBinding.instance.addPostFrameCallback((_) {
                        if (mounted && !_isDisposed) {
                          setState(() {
                            _isLoading = false;
                            _errorMessage =
                                'PDF viewer plugin not initialized. Please rebuild the app.\n\nError: ${e.toString()}';
                          });
                        }
                      });
                      return Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24.0),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.error_outline,
                                size: 64,
                                color: Colors.orange.shade300,
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'Plugin Not Initialized',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.grey.shade800,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Please rebuild the app completely (not just hot reload) for the PDF viewer to work.',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey.shade600,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),
                      );
                    }
                  },
                ),
      ),
    );
  }
}
