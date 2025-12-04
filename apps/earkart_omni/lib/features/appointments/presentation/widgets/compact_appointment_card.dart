import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/models/appointments/appointments.entity.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class CompactAppointmentCard extends StatelessWidget {
  final AppointmentEntity appointment;
  final VoidCallback? onTap;
  final VoidCallback? onEdit;

  const CompactAppointmentCard({
    super.key,
    required this.appointment,
    this.onTap,
    this.onEdit,
  });

  @override
  Widget build(BuildContext context) {
    final duration =
        appointment.scheduledEnd
            .difference(appointment.scheduledStart)
            .inMinutes;

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
            spreadRadius: 0,
          ),
          BoxShadow(
            color: Constants.primaryColor.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, 8),
            spreadRadius: 0,
          ),
        ],
        border: Border.all(color: Constants.accentColor, width: 1),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header with status and edit button
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(child: _buildStatusChip(appointment.status)),
                    if (onEdit != null)
                      Container(
                        decoration: BoxDecoration(
                          color: Constants.primaryColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: Constants.primaryColor.withOpacity(0.2),
                            width: 1,
                          ),
                        ),
                        child: IconButton(
                          icon: Icon(
                            Icons.edit_rounded,
                            size: 16,
                            color: Constants.primaryColor,
                          ),
                          onPressed: onEdit,
                          constraints: const BoxConstraints(
                            minWidth: 32,
                            minHeight: 32,
                          ),
                          padding: EdgeInsets.zero,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 12),

                // Patient section with avatar
                _buildPatientSection(),
                const SizedBox(height: 10),

                // Appointment details section
                _buildAppointmentDetailsSection(duration),
                const SizedBox(height: 10),

                // Centre and contact info
                _buildCentreSection(),

                const Spacer(),

                // Footer with duration and tap indicator
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Constants.accentColor,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: Constants.darkAccent,
                          width: 1,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.timer_rounded,
                            size: 12,
                            color: Constants.primaryColor,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${duration}m',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: Constants.primaryColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Constants.accentColor,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        Icons.arrow_forward_ios_rounded,
                        size: 12,
                        color: Constants.secondaryColor,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPatientSection() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Constants.accentColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Constants.darkAccent, width: 1),
      ),
      child: Row(
        children: [
          // Patient avatar
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: Constants.primaryColor,
              borderRadius: BorderRadius.circular(10),
              boxShadow: [
                BoxShadow(
                  color: Constants.primaryColor.withOpacity(0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Icon(Icons.person_rounded, color: Colors.white, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Patient name and age
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        appointment.patient?.name ?? 'Unknown Patient',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: Colors.black87,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (appointment.patient?.age != null)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: Constants.primaryColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '${appointment.patient!.age}y',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: Constants.primaryColor,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                // Contact information
                if (appointment.patient?.contactNumber != null)
                  Row(
                    children: [
                      Icon(
                        Icons.phone_rounded,
                        size: 12,
                        color: Colors.grey[600],
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          appointment.patient?.contactNumber ?? '',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                // Gender if available
                if (appointment.patient?.gender != null) ...[
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Icon(
                        appointment.patient?.gender == Gender.male
                            ? Icons.male_rounded
                            : Icons.female_rounded,
                        size: 12,
                        color: Colors.grey[600],
                      ),
                      const SizedBox(width: 6),
                      Text(
                        appointment.patient!.gender.name.toUpperCase(),
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAppointmentDetailsSection(int duration) {
    return Container(
      padding: const EdgeInsets.all(12),
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
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Constants.secondaryColor,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.calendar_today_rounded,
                  color: Colors.white,
                  size: 14,
                ),
              ),
              const SizedBox(width: 8),
              const Text(
                'Appointment',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          // Date and time in compact format
          _buildDetailItem(
            'Date',
            DateFormat('MMM dd, yyyy').format(appointment.scheduledStart),
            Icons.date_range_rounded,
          ),
          const SizedBox(height: 4),
          // Time range
          Row(
            children: [
              Expanded(
                child: _buildDetailItem(
                  'Start',
                  DateFormat('h:mm a').format(appointment.scheduledStart),
                  Icons.play_arrow_rounded,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildDetailItem(
                  'End',
                  DateFormat('h:mm a').format(appointment.scheduledEnd),
                  Icons.stop_rounded,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          // Duration and time status
          Row(
            children: [
              Expanded(
                child: _buildDetailItem(
                  'Duration',
                  '${duration}m',
                  Icons.timer_rounded,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(child: _buildTimeUntilAppointment()),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCentreSection() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Constants.accentColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Constants.darkAccent, width: 1),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: Constants.secondaryColor,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              Icons.location_on_rounded,
              color: Colors.white,
              size: 14,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  appointment.centre?.entName ?? 'Medical Centre',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Colors.black87,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                if (appointment.centre?.contactNumber != null)
                  Row(
                    children: [
                      Icon(
                        Icons.phone_rounded,
                        size: 12,
                        color: Colors.grey[600],
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          appointment.centre?.contactNumber ?? '',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimeUntilAppointment() {
    final now = DateTime.now();
    final appointmentTime = appointment.scheduledStart;
    final difference = appointmentTime.difference(now);

    String timeText;
    IconData icon;
    Color color;

    if (difference.isNegative) {
      // Appointment is in the past
      final pastDifference = now.difference(appointmentTime);
      if (pastDifference.inDays > 0) {
        timeText = '${pastDifference.inDays}d ago';
      } else if (pastDifference.inHours > 0) {
        timeText = '${pastDifference.inHours}h ago';
      } else {
        timeText = '${pastDifference.inMinutes}m ago';
      }
      icon = Icons.history_rounded;
      color = Colors.grey[600]!;
    } else {
      // Appointment is in the future
      if (difference.inDays > 0) {
        timeText = 'In ${difference.inDays}d';
      } else if (difference.inHours > 0) {
        timeText = 'In ${difference.inHours}h';
      } else {
        timeText = 'In ${difference.inMinutes}m';
      }
      icon = Icons.schedule_rounded;
      color = Constants.primaryColor;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 10, color: color),
            const SizedBox(width: 4),
            Text(
              'Status',
              style: TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.w600,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
        const SizedBox(height: 2),
        Text(
          timeText,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: color,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }

  Widget _buildDetailItem(String label, String value, IconData icon) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 10, color: Colors.grey[600]),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.w600,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }

  Widget _buildStatusChip(AppointmentStatus status) {
    final statusConfig = _getStatusConfig(status);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            statusConfig.color.withOpacity(0.1),
            statusConfig.color.withOpacity(0.05),
          ],
        ),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: statusConfig.color.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              color: statusConfig.color.withOpacity(0.2),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Icon(statusConfig.icon, size: 10, color: statusConfig.color),
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              statusConfig.label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: statusConfig.color,
                letterSpacing: 0.3,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  StatusConfig _getStatusConfig(AppointmentStatus status) {
    switch (status) {
      case AppointmentStatus.requested:
        return StatusConfig(
          label: 'Requested',
          color: Colors.orange,
          icon: Icons.schedule,
        );
      case AppointmentStatus.confirmed:
        return StatusConfig(
          label: 'Confirmed',
          color: Colors.green,
          icon: Icons.check_circle,
        );
      case AppointmentStatus.rescheduled:
        return StatusConfig(
          label: 'Rescheduled',
          color: Colors.blue,
          icon: Icons.calendar_today,
        );
      case AppointmentStatus.cancelledByPatient:
        return StatusConfig(
          label: 'Cancelled',
          color: Colors.red,
          icon: Icons.cancel,
        );
      case AppointmentStatus.cancelledByCentre:
        return StatusConfig(
          label: 'Cancelled',
          color: Colors.red[700]!,
          icon: Icons.cancel,
        );
      case AppointmentStatus.completed:
        return StatusConfig(
          label: 'Completed',
          color: Colors.green[700]!,
          icon: Icons.done_all,
        );
      case AppointmentStatus.noShow:
        return StatusConfig(
          label: 'No Show',
          color: Colors.grey[600]!,
          icon: Icons.person_off,
        );
    }
  }
}

class StatusConfig {
  final String label;
  final Color color;
  final IconData icon;

  StatusConfig({required this.label, required this.color, required this.icon});
}
