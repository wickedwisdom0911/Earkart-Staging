import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/widgets/glassmorphism_app_bar.dart';
import 'package:earkart_omni/features/appointments/presentation/cubit/appointments.cubit.dart';
import 'package:earkart_omni/features/appointments/presentation/cubit/appointments.state.dart';
import 'package:earkart_omni/features/appointments/presentation/widgets/compact_appointment_card.dart';
import 'package:earkart_omni/models/appointments/appointments.entity.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class AppointmentsScreen extends StatefulWidget {
  static const routeName = '/appointments';
  const AppointmentsScreen({super.key});

  @override
  State<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen> {
  @override
  void initState() {
    super.initState();
    // Load appointments when the screen initializes
    context.read<AppointmentsCubit>().getAppointments();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Constants.bg,
      appBar: GlassmorphismAppBar(
        title: BlocBuilder<AppointmentsCubit, AppointmentsState>(
          builder: (context, state) {
            return state.when(
              initial:
                  () => const Text(
                    'Appointments',
                    style: TextStyle(
                      color: Colors.black87,
                      fontSize: 24,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
              loading:
                  () => const Text(
                    'Appointments',
                    style: TextStyle(
                      color: Colors.black87,
                      fontSize: 24,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
              success:
                  (appointments, total) => Text(
                    'Appointments ($total)',
                    style: const TextStyle(
                      color: Colors.black87,
                      fontSize: 24,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
              appointmentByIdSuccess:
                  (appointment) => const Text(
                    'Appointment Details',
                    style: TextStyle(
                      color: Colors.black87,
                      fontSize: 24,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
              createAppointmentSuccess:
                  (appointment) => const Text(
                    'Appointment Created',
                    style: TextStyle(
                      color: Colors.black87,
                      fontSize: 24,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
              updateAppointmentSuccess:
                  (appointment) => const Text(
                    'Appointment Updated',
                    style: TextStyle(
                      color: Colors.black87,
                      fontSize: 24,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
              error:
                  (message) => const Text(
                    'Appointments',
                    style: TextStyle(
                      color: Colors.black87,
                      fontSize: 24,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
            );
          },
        ),
      ),
      body: BlocBuilder<AppointmentsCubit, AppointmentsState>(
        builder: (context, state) {
          return RefreshIndicator(
            onRefresh: () async {
              context.read<AppointmentsCubit>().getAppointments();
            },
            color: Constants.primaryColor,
            child: state.when(
              initial:
                  () => const Center(
                    child: CircularProgressIndicator(
                      color: Constants.primaryColor,
                    ),
                  ),
              loading:
                  () => const Center(
                    child: CircularProgressIndicator(
                      color: Constants.primaryColor,
                    ),
                  ),
              success:
                  (appointments, total) =>
                      _buildAppointmentsList(appointments, total),
              appointmentByIdSuccess:
                  (appointment) => _buildSingleAppointment(appointment),
              createAppointmentSuccess:
                  (appointment) => _buildSingleAppointment(appointment),
              updateAppointmentSuccess:
                  (appointment) => _buildSingleAppointment(appointment),
              error: (message) => _buildErrorState(message),
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showCreateAppointmentDialog(context),
        backgroundColor: Constants.primaryColor,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildAppointmentsList(
    List<AppointmentEntity> appointments,
    int total,
  ) {
    if (appointments.isEmpty) {
      return _buildEmptyState();
    }

    return Padding(
      padding: const EdgeInsets.only(left: 16, right: 16, top: 16),
      child: GridView.builder(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          childAspectRatio: 0.85,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
        ),
        itemCount: appointments.length,
        itemBuilder: (context, index) {
          final appointment = appointments[index];
          return CompactAppointmentCard(
            appointment: appointment,
            onTap: () => _showAppointmentDetails(context, appointment),
            onEdit: () => _showEditAppointmentDialog(context, appointment),
          );
        },
      ),
    );
  }

  Widget _buildSingleAppointment(AppointmentEntity appointment) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: CompactAppointmentCard(
        appointment: appointment,
        onTap: () => _showAppointmentDetails(context, appointment),
        onEdit: () => _showEditAppointmentDialog(context, appointment),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Constants.accentColor,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Constants.darkAccent, width: 1),
              ),
              child: Icon(
                Icons.calendar_today_rounded,
                size: 64,
                color: Constants.primaryColor,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'No Appointments',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Pull down to refresh or create your first appointment',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
                height: 1.4,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => _showCreateAppointmentDialog(context),
              icon: const Icon(Icons.add_rounded, size: 18),
              label: const Text(
                'Create Appointment',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Constants.primaryColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 0,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.red[50],
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.red[100]!, width: 1),
              ),
              child: Icon(
                Icons.error_outline_rounded,
                size: 64,
                color: Colors.red[400],
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Something Went Wrong',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
                height: 1.4,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed:
                  () => context.read<AppointmentsCubit>().getAppointments(),
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text(
                'Try Again',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Constants.primaryColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 0,
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
    final duration =
        appointment.scheduledEnd
            .difference(appointment.scheduledStart)
            .inMinutes;
    final now = DateTime.now();
    final timeUntil = appointment.scheduledStart.difference(now);

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
                  // Header
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Constants.primaryColor,
                          Constants.secondaryColor,
                        ],
                      ),
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(20),
                        topRight: Radius.circular(20),
                      ),
                    ),
                    child: Column(
                      children: [
                        Icon(
                          Icons.calendar_today_rounded,
                          color: Colors.white,
                          size: 32,
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Appointment Details',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Content
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Patient Information Section
                          _buildDetailSection(
                            'Patient Information',
                            Icons.person_rounded,
                            [
                              _buildDetailRow(
                                'Name',
                                appointment.patient?.name ?? 'Unknown Patient',
                              ),
                              if (appointment.patient?.age != null)
                                _buildDetailRow(
                                  'Age',
                                  '${appointment.patient?.age} years',
                                ),
                              if (appointment.patient?.gender != null)
                                _buildDetailRow(
                                  'Gender',
                                  appointment.patient!.gender.name
                                      .toUpperCase(),
                                ),
                              if (appointment.patient?.contactNumber != null)
                                _buildDetailRow(
                                  'Phone',
                                  appointment.patient?.contactNumber ?? '',
                                ),
                              if (appointment.patient?.email != null)
                                _buildDetailRow(
                                  'Email',
                                  appointment.patient?.email ?? '',
                                ),
                            ],
                          ),
                          const SizedBox(height: 16),

                          // Appointment Timing Section
                          _buildDetailSection(
                            'Appointment Timing',
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
                                '${duration} minutes',
                              ),
                              _buildDetailRow(
                                'Time Status',
                                _getTimeStatus(timeUntil),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),

                          // Centre Information Section
                          _buildDetailSection(
                            'Medical Centre',
                            Icons.location_on_rounded,
                            [
                              _buildDetailRow(
                                'Centre Name',
                                appointment.centre?.entName ?? 'Medical Centre',
                              ),
                              if (appointment.centre?.address != null)
                                _buildDetailRow(
                                  'Address',
                                  appointment.centre?.address ?? '',
                                ),
                              if (appointment.centre?.contactNumber != null)
                                _buildDetailRow(
                                  'Phone',
                                  appointment.centre?.contactNumber ?? '',
                                ),
                            ],
                          ),
                          const SizedBox(height: 16),

                          // Appointment Status Section
                          _buildDetailSection(
                            'Appointment Status',
                            Icons.info_rounded,
                            [
                              _buildDetailRow(
                                'Status',
                                _formatStatus(appointment.status),
                              ),
                              if (appointment.audiologistId != null)
                                _buildDetailRow(
                                  'Assigned Audiologist',
                                  'Audiologist ID: ${appointment.audiologistId}',
                                ),
                              if (appointment.consultationId != null)
                                _buildDetailRow(
                                  'Consultation',
                                  'Consultation ID: ${appointment.consultationId}',
                                ),
                              if (appointment.notes != null &&
                                  appointment.notes!.isNotEmpty)
                                _buildDetailRow('Notes', appointment.notes!),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  // Actions
                  Container(
                    padding: const EdgeInsets.all(20),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton(
                          onPressed: () => Navigator.of(context).pop(),
                          child: const Text('Close'),
                        ),
                        const SizedBox(width: 12),
                        ElevatedButton(
                          onPressed: () {
                            Navigator.of(context).pop();
                            _showEditAppointmentDialog(context, appointment);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Constants.primaryColor,
                            foregroundColor: Colors.white,
                          ),
                          child: const Text('Edit Appointment'),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
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
              '$label:',
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                color: Constants.primaryColor,
              ),
            ),
          ),
          Expanded(
            child: Text(value, style: const TextStyle(color: Colors.black87)),
          ),
        ],
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
                  color: Constants.primaryColor,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: Colors.white, size: 16),
              ),
              const SizedBox(width: 12),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
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

  String _formatDate(DateTime dateTime) {
    return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
  }

  String _formatDayOfWeek(DateTime dateTime) {
    const days = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    return days[dateTime.weekday - 1];
  }

  String _formatTime(DateTime dateTime) {
    final hour = dateTime.hour;
    final minute = dateTime.minute.toString().padLeft(2, '0');
    final period = hour >= 12 ? 'PM' : 'AM';
    final displayHour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
    return '$displayHour:$minute $period';
  }

  String _getTimeStatus(Duration timeUntil) {
    if (timeUntil.isNegative) {
      final pastTime = DateTime.now().difference(DateTime.now().add(timeUntil));
      if (pastTime.inDays > 0) {
        return '${pastTime.inDays} day${pastTime.inDays > 1 ? 's' : ''} ago';
      } else if (pastTime.inHours > 0) {
        return '${pastTime.inHours} hour${pastTime.inHours > 1 ? 's' : ''} ago';
      } else {
        return '${pastTime.inMinutes} minute${pastTime.inMinutes > 1 ? 's' : ''} ago';
      }
    } else {
      if (timeUntil.inDays > 0) {
        return 'In ${timeUntil.inDays} day${timeUntil.inDays > 1 ? 's' : ''}';
      } else if (timeUntil.inHours > 0) {
        return 'In ${timeUntil.inHours} hour${timeUntil.inHours > 1 ? 's' : ''}';
      } else {
        return 'In ${timeUntil.inMinutes} minute${timeUntil.inMinutes > 1 ? 's' : ''}';
      }
    }
  }

  String _formatStatus(AppointmentStatus status) {
    switch (status) {
      case AppointmentStatus.requested:
        return 'Requested';
      case AppointmentStatus.confirmed:
        return 'Confirmed';
      case AppointmentStatus.rescheduled:
        return 'Rescheduled';
      case AppointmentStatus.cancelledByPatient:
        return 'Cancelled by Patient';
      case AppointmentStatus.cancelledByCentre:
        return 'Cancelled by Centre';
      case AppointmentStatus.completed:
        return 'Completed';
      case AppointmentStatus.noShow:
        return 'No Show';
    }
  }

  void _showCreateAppointmentDialog(BuildContext context) {
    // TODO: Implement create appointment dialog
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Create appointment dialog - To be implemented'),
        backgroundColor: Constants.primaryColor,
      ),
    );
  }

  void _showEditAppointmentDialog(
    BuildContext context,
    AppointmentEntity appointment,
  ) {
    // TODO: Implement edit appointment dialog
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Edit appointment dialog - To be implemented'),
        backgroundColor: Constants.primaryColor,
      ),
    );
  }
}
