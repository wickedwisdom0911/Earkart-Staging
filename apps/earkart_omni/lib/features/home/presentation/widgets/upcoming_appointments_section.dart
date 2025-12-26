import 'package:earkart_omni/features/appointments/presentation/pages/appointments_screen.dart';
import 'package:earkart_omni/features/appointments/presentation/cubit/appointments.cubit.dart';
import 'package:earkart_omni/features/appointments/presentation/cubit/appointments.state.dart';
import 'package:earkart_omni/models/appointments/appointments.entity.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/features/home/presentation/widgets/error_state_widget.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

class UpcomingAppointmentsSection extends StatefulWidget {
  const UpcomingAppointmentsSection({super.key});

  @override
  State<UpcomingAppointmentsSection> createState() =>
      _UpcomingAppointmentsSectionState();
}

class _UpcomingAppointmentsSectionState
    extends State<UpcomingAppointmentsSection> {
  @override
  void initState() {
    super.initState();
    // Load appointments when the widget initializes
    context.read<AppointmentsCubit>().getAppointments();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.withAlpha(90), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                "Upcoming Appointments",
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
              OutlinedButton(
                onPressed: () {
                  Navigator.pushNamed(context, AppointmentsScreen.routeName);
                },
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  side: BorderSide(color: Colors.grey.shade300, width: 1),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  backgroundColor: Colors.transparent,
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'View All',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: Colors.grey.shade700,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(
                      Icons.arrow_forward_ios,
                      size: 12,
                      color: Colors.grey.shade600,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: BlocBuilder<AppointmentsCubit, AppointmentsState>(
              builder: (context, state) {
                return state.when(
                  initial: () => _buildLoadingState(),
                  loading: () => _buildLoadingState(),
                  success:
                      (appointments, total) =>
                          _buildAppointmentsList(appointments),
                  appointmentByIdSuccess: (appointment) => _buildLoadingState(),
                  createAppointmentSuccess:
                      (appointment) => _buildLoadingState(),
                  updateAppointmentSuccess:
                      (appointment) => _buildLoadingState(),
                  error: (message) => _buildErrorState(message),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return const Center(
      child: CircularProgressIndicator(
        valueColor: AlwaysStoppedAnimation<Color>(Constants.primaryColor),
      ),
    );
  }

  Widget _buildErrorState(String message) {
    return ErrorStateWidget(
      title: 'Failed to load appointments',
      message: message,
      onRetry: () {
        context.read<AppointmentsCubit>().getAppointments();
      },
      retryLabel: 'Retry',
    );
  }

  Widget _buildAppointmentsList(List<AppointmentEntity> appointments) {
    // Filter upcoming appointments (scheduled for today or future)
    final now = DateTime.now();
    final upcomingAppointments =
        appointments
            .where(
              (appointment) =>
                  appointment.scheduledStart.isAfter(now) ||
                  appointment.scheduledStart.isAtSameMomentAs(now),
            )
            .toList();

    // Sort by scheduled start time
    upcomingAppointments.sort(
      (a, b) => a.scheduledStart.compareTo(b.scheduledStart),
    );

    if (upcomingAppointments.isEmpty) {
      return _buildEmptyState();
    }

    return ListView.builder(
      itemCount: upcomingAppointments.length,
      itemBuilder: (context, index) {
        final appointment = upcomingAppointments[index];
        return _buildAppointmentCard(appointment);
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Container(
        padding: const EdgeInsets.all(40),
        width: double.infinity,
        decoration: BoxDecoration(
          color: Colors.grey.shade50,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.calendar_today_outlined,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No upcoming appointments',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Appointments will appear here when scheduled',
              style: TextStyle(fontSize: 14, color: Colors.grey[500]),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.pushNamed(context, AppointmentsScreen.routeName);
              },
              icon: const Icon(Icons.calendar_today, size: 16),
              label: const Text('View All Appointments'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Constants.primaryColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAppointmentCard(AppointmentEntity appointment) {
    final formattedDate = DateFormat(
      'MMM dd, yyyy',
    ).format(appointment.scheduledStart);
    final formattedTime = DateFormat(
      'HH:mm',
    ).format(appointment.scheduledStart);
    final duration = appointment.scheduledEnd.difference(
      appointment.scheduledStart,
    );
    final durationText = '${duration.inMinutes} min';

    return GestureDetector(
      onTap: () => _showAppointmentDetails(context, appointment),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.grey.shade50,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: _getStatusColor(appointment.status).withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                Icons.calendar_today_rounded,
                color: _getStatusColor(appointment.status),
                size: 20,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    appointment.patient?.name ?? 'Unknown Patient',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    appointment.centre?.entName ?? 'Medical Centre',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.access_time_rounded,
                        size: 14,
                        color: Colors.grey[500],
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '$formattedDate • $formattedTime ($durationText)',
                        style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: _getStatusColor(appointment.status).withOpacity(0.1),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(
                  color: _getStatusColor(appointment.status).withOpacity(0.3),
                  width: 1,
                ),
              ),
              child: Text(
                _formatStatus(appointment.status),
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: _getStatusColor(appointment.status),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showAppointmentDetails(
    BuildContext context,
    AppointmentEntity appointment,
  ) {
    showDialog(
      context: context,
      builder:
          (context) => Dialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 500, maxHeight: 600),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Header with gradient
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Constants.primaryColor,
                          Constants.primaryColor.withOpacity(0.8),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(20),
                        topRight: Radius.circular(20),
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(
                            Icons.calendar_today_rounded,
                            color: Colors.white,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Appointment Details',
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'ID: ${appointment.id}',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.white.withOpacity(0.8),
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          onPressed: () => Navigator.of(context).pop(),
                          icon: const Icon(
                            Icons.close_rounded,
                            color: Colors.white,
                            size: 24,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Content
                  Flexible(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildDetailSection(
                            'Patient Information',
                            Icons.person_rounded,
                            [
                              _buildDetailRow(
                                'Name',
                                appointment.patient?.name ?? 'Unknown',
                              ),
                              _buildDetailRow(
                                'Age',
                                appointment.patient?.age?.toString() ?? 'N/A',
                              ),
                              _buildDetailRow(
                                'Gender',
                                appointment.patient?.gender.name
                                        .toUpperCase() ??
                                    'N/A',
                              ),
                              _buildDetailRow(
                                'Contact',
                                appointment.patient?.contactNumber ?? 'N/A',
                              ),
                              _buildDetailRow(
                                'Email',
                                appointment.patient?.email ?? 'N/A',
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),
                          _buildDetailSection(
                            'Appointment Details',
                            Icons.schedule_rounded,
                            [
                              _buildDetailRow(
                                'Date',
                                _formatDate(appointment.scheduledStart),
                              ),
                              _buildDetailRow(
                                'Day',
                                _formatDayOfWeek(appointment.scheduledStart),
                              ),
                              _buildDetailRow(
                                'Start Time',
                                _formatTime(appointment.scheduledStart),
                              ),
                              _buildDetailRow(
                                'End Time',
                                _formatTime(appointment.scheduledEnd),
                              ),
                              _buildDetailRow(
                                'Duration',
                                '${appointment.scheduledEnd.difference(appointment.scheduledStart).inMinutes} minutes',
                              ),
                              _buildDetailRow(
                                'Status',
                                _formatStatus(appointment.status),
                              ),
                              _buildDetailRow(
                                'Time Status',
                                _getTimeStatus(appointment.scheduledStart),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),
                          _buildDetailSection(
                            'Centre Information',
                            Icons.location_on_rounded,
                            [
                              _buildDetailRow(
                                'Centre Name',
                                appointment.centre?.entName ?? 'Medical Centre',
                              ),
                              _buildDetailRow(
                                'Address',
                                appointment.centre?.address ?? 'N/A',
                              ),
                              _buildDetailRow(
                                'Contact',
                                appointment.centre?.contactNumber ?? 'N/A',
                              ),
                            ],
                          ),
                          if (appointment.notes != null &&
                              appointment.notes!.isNotEmpty) ...[
                            const SizedBox(height: 20),
                            _buildDetailSection('Notes', Icons.note_rounded, [
                              _buildDetailRow('Notes', appointment.notes!),
                            ]),
                          ],
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
    );
  }

  Widget _buildDetailSection(
    String title,
    IconData icon,
    List<Widget> children,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Constants.accentColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Constants.darkAccent, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Constants.secondaryColor,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: Colors.white, size: 16),
              ),
              const SizedBox(width: 12),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.black54,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 14, color: Colors.black87),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime dateTime) {
    return DateFormat('MMM dd, yyyy').format(dateTime);
  }

  String _formatDayOfWeek(DateTime dateTime) {
    return DateFormat('EEEE').format(dateTime);
  }

  String _formatTime(DateTime dateTime) {
    return DateFormat('HH:mm').format(dateTime);
  }

  String _getTimeStatus(DateTime scheduledStart) {
    final now = DateTime.now();
    final difference = scheduledStart.difference(now);

    if (difference.isNegative) {
      final pastTime = now.difference(scheduledStart);
      if (pastTime.inDays > 0) {
        return '${pastTime.inDays} day(s) ago';
      } else if (pastTime.inHours > 0) {
        return '${pastTime.inHours} hour(s) ago';
      } else {
        return '${pastTime.inMinutes} minute(s) ago';
      }
    } else {
      if (difference.inDays > 0) {
        return 'In ${difference.inDays} day(s)';
      } else if (difference.inHours > 0) {
        return 'In ${difference.inHours} hour(s)';
      } else {
        return 'In ${difference.inMinutes} minute(s)';
      }
    }
  }

  Color _getStatusColor(AppointmentStatus status) {
    switch (status) {
      case AppointmentStatus.confirmed:
        return Colors.green;
      case AppointmentStatus.requested:
        return Colors.orange;
      case AppointmentStatus.rescheduled:
        return Colors.blue;
      case AppointmentStatus.cancelledByPatient:
      case AppointmentStatus.cancelledByCentre:
        return Colors.red;
      case AppointmentStatus.completed:
        return Colors.blue[600]!;
      case AppointmentStatus.noShow:
        return Colors.red[700]!;
    }
  }

  String _formatStatus(AppointmentStatus status) {
    switch (status) {
      case AppointmentStatus.confirmed:
        return 'Confirmed';
      case AppointmentStatus.requested:
        return 'Pending';
      case AppointmentStatus.rescheduled:
        return 'Rescheduled';
      case AppointmentStatus.cancelledByPatient:
        return 'Cancelled';
      case AppointmentStatus.cancelledByCentre:
        return 'Cancelled';
      case AppointmentStatus.completed:
        return 'Completed';
      case AppointmentStatus.noShow:
        return 'No Show';
    }
  }
}
