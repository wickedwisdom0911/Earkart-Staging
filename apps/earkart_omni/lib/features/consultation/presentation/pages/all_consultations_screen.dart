import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/widgets/glassmorphism_app_bar.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.state.dart';
import 'package:earkart_omni/features/consultation/presentation/widgets/pdf_viewer_widget.dart';
import 'package:earkart_omni/models/consultation/consultation.entity.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

class AllConsultationsScreen extends StatefulWidget {
  const AllConsultationsScreen({super.key});
  static const routeName = "/all-consultations";

  @override
  State<AllConsultationsScreen> createState() => _AllConsultationsScreenState();
}

class _AllConsultationsScreenState extends State<AllConsultationsScreen> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    // Fetch consultations when screen loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ConsultationCubit>().getConsultationsByCentreId(refresh: true);
    });
    // Listen to scroll events for pagination
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent * 0.8) {
      // Load more when user scrolls to 80% of the list
      context.read<ConsultationCubit>().loadMoreConsultations();
    }
  }

  Future<void> _onRefresh() async {
    context.read<ConsultationCubit>().getConsultationsByCentreId(refresh: true);
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
                  padding: const EdgeInsets.all(32.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.red.shade50,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.error_outline_rounded,
                          size: 48,
                          color: Colors.red.shade400,
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'Unable to Load Consultations',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w600,
                          color: Colors.grey.shade900,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        state.message,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade600,
                          height: 1.5,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 32),
                      OutlinedButton.icon(
                        onPressed: _onRefresh,
                        icon: const Icon(Icons.refresh_rounded, size: 18),
                        label: const Text('Try Again'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Constants.secondaryColor,
                          side: BorderSide(color: Constants.secondaryColor.withOpacity(0.3)),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 24,
                            vertical: 14,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
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
                    padding: const EdgeInsets.all(32.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: Constants.accentColor,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.calendar_today_outlined,
                            size: 56,
                            color: Constants.secondaryColor.withOpacity(0.6),
                          ),
                        ),
                        const SizedBox(height: 24),
                        Text(
                          'No Consultations Yet',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w600,
                            color: Colors.grey.shade900,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Consultations will appear here once they are created',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey.shade600,
                            height: 1.5,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                );
              }

              return ListView.separated(
                controller: _scrollController,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                itemCount: state.consultations.length +
                    (state.isLoadingMore ? 1 : 0),
                separatorBuilder: (context, index) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  if (index >= state.consultations.length) {
                    return const Center(
                      child: Padding(
                        padding: EdgeInsets.symmetric(vertical: 24.0),
                        child: CircularProgressIndicator(
                          color: Constants.secondaryColor,
                          strokeWidth: 2.5,
                        ),
                      ),
                    );
                  }
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
          Icons.hearing_rounded,
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
          Icons.graphic_eq_rounded,
          consultation.tympanometryReport!,
        ),
      );
    }

    if (consultation.oaeReport != null && consultation.oaeReport!.isNotEmpty) {
      buttons.add(
        _buildReportButton(
          context,
          'OAE',
          Icons.audiotrack_rounded,
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
          Icons.visibility_rounded,
          consultation.otoscopyReport!,
        ),
      );
    }

    if (consultation.etfReport != null && consultation.etfReport!.isNotEmpty) {
      buttons.add(
        _buildReportButton(
          context,
          'ETF',
          Icons.medical_services_rounded,
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
          Icons.medical_services_rounded,
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
          Icons.record_voice_over_rounded,
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
          Icons.medical_services_rounded,
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
          Icons.music_note_rounded,
          consultation.toneReport!,
        ),
      );
    }

    return buttons;
  }

  List<Widget> _buildTestBadges() {
    final badges = <Widget>[];
    
    if (consultation.audiometryReport != null &&
        consultation.audiometryReport!.isNotEmpty) {
      badges.add(_buildTestBadge('Audiometry', Icons.hearing_rounded));
    }
    if (consultation.tympanometryReport != null &&
        consultation.tympanometryReport!.isNotEmpty) {
      badges.add(_buildTestBadge('Tympanometry', Icons.graphic_eq_rounded));
    }
    if (consultation.oaeReport != null &&
        consultation.oaeReport!.isNotEmpty) {
      badges.add(_buildTestBadge('OAE', Icons.audiotrack_rounded));
    }
    if (consultation.otoscopyReport != null &&
        consultation.otoscopyReport!.isNotEmpty) {
      badges.add(_buildTestBadge('Otoscopy', Icons.visibility_rounded));
    }
    if (consultation.etfReport != null &&
        consultation.etfReport!.isNotEmpty) {
      badges.add(_buildTestBadge('ETF', Icons.medical_services_rounded));
    }
    if (consultation.sisiReport != null &&
        consultation.sisiReport!.isNotEmpty) {
      badges.add(_buildTestBadge('SISI', Icons.medical_services_rounded));
    }
    if (consultation.speechReport != null &&
        consultation.speechReport!.isNotEmpty) {
      badges.add(_buildTestBadge('Speech', Icons.record_voice_over_rounded));
    }
    if (consultation.reflexesReport != null &&
        consultation.reflexesReport!.isNotEmpty) {
      badges.add(_buildTestBadge('Reflexes', Icons.medical_services_rounded));
    }
    if (consultation.toneReport != null &&
        consultation.toneReport!.isNotEmpty) {
      badges.add(_buildTestBadge('Tone', Icons.music_note_rounded));
    }
    
    return badges;
  }

  Widget _buildReportButton(
    BuildContext context,
    String label,
    IconData icon,
    String pdfUrl,
  ) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _viewPdfReport(context, label, pdfUrl),
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: Constants.secondaryColor.withOpacity(0.08),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: Constants.secondaryColor.withOpacity(0.15),
              width: 1,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 16,
                color: Constants.secondaryColor,
              ),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: Constants.secondaryColor,
                ),
              ),
              const SizedBox(width: 6),
              Icon(
                Icons.picture_as_pdf_rounded,
                size: 14,
                color: Colors.red.shade400,
              ),
            ],
          ),
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
    final statusColor = _getStatusColor(consultation.status);
    
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Colors.grey.shade100,
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Patient info and status
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: Constants.accentColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.person_rounded,
                  color: Constants.secondaryColor,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      consultation.patient?.name ?? 'Unknown Patient',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey.shade900,
                        letterSpacing: -0.3,
                      ),
                    ),
                    if (consultation.patient?.contactNumber != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        consultation.patient!.contactNumber,
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey.shade600,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  _getStatusText(consultation.status),
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: statusColor,
                    letterSpacing: 0.2,
                  ),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Divider
          Divider(
            height: 1,
            thickness: 1,
            color: Colors.grey.shade100,
          ),
          
          const SizedBox(height: 16),
          
          // Date and time row
          Row(
            children: [
              _buildInfoItem(
                icon: Icons.calendar_today_rounded,
                text: _formatDate(consultation.createdAt),
              ),
              if (consultation.createdAt != null) ...[
                const SizedBox(width: 20),
                _buildInfoItem(
                  icon: Icons.access_time_rounded,
                  text: _formatTime(consultation.createdAt),
                ),
              ],
            ],
          ),
          
          // Additional info (audiologist/centre)
          if (consultation.audiologist?.user?.name != null ||
              consultation.centre != null) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 16,
              runSpacing: 12,
              children: [
                if (consultation.audiologist?.user?.name != null)
                  _buildInfoItem(
                    icon: Icons.person_outline_rounded,
                    text: consultation.audiologist!.user!.name,
                  ),
                if (consultation.centre != null)
                  _buildInfoItem(
                    icon: Icons.business_outlined,
                    text: consultation.centre!.entName,
                  ),
              ],
            ),
          ],
          
          // Test reports section
          if (_hasTestReports()) ...[
            const SizedBox(height: 16),
            Divider(
              height: 1,
              thickness: 1,
              color: Colors.grey.shade100,
            ),
            const SizedBox(height: 16),
            Text(
              'Test Reports',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade700,
                letterSpacing: 0.2,
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _buildTestBadges(),
            ),
          ],
          
          // PDF Reports section
          if (_hasReports()) ...[
            const SizedBox(height: 16),
            Divider(
              height: 1,
              thickness: 1,
              color: Colors.grey.shade100,
            ),
            const SizedBox(height: 16),
            Text(
              'View Reports',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade700,
                letterSpacing: 0.2,
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _buildReportButtons(context),
            ),
          ],
        ],
      ),
    );
  }
  
  Widget _buildInfoItem({required IconData icon, required String text}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          icon,
          size: 16,
          color: Colors.grey.shade500,
        ),
        const SizedBox(width: 6),
        Text(
          text,
          style: TextStyle(
            fontSize: 13,
            color: Colors.grey.shade700,
            height: 1.4,
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
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 14,
            color: Constants.secondaryColor.withOpacity(0.8),
          ),
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
