import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class UpcomingAppointmentsSection extends StatelessWidget {
  const UpcomingAppointmentsSection({super.key});

  @override
  Widget build(BuildContext context) {
    // Generate 3 dummy appointments for 1 month from now
    final now = DateTime.now();
    final oneMonthFromNow = DateTime(now.year, now.month + 1, now.day);

    final appointments = [
      {
        'patientName': 'Chandan Kumar',
        'date': DateTime(
          oneMonthFromNow.year,
          oneMonthFromNow.month,
          oneMonthFromNow.day + 2,
        ),
        'time': '10:00 AM',
        'type': 'Hearing Test',
        'status': 'Confirmed',
      },
      {
        'patientName': 'Ankit Kumar',
        'date': DateTime(
          oneMonthFromNow.year,
          oneMonthFromNow.month,
          oneMonthFromNow.day + 5,
        ),
        'time': '2:30 PM',
        'type': 'Follow-up Consultation',
        'status': 'Pending',
      },
      {
        'patientName': 'Rajesh Shankar',
        'date': DateTime(
          oneMonthFromNow.year,
          oneMonthFromNow.month,
          oneMonthFromNow.day + 8,
        ),
        'time': '11:15 AM',
        'type': 'Initial Assessment',
        'status': 'Confirmed',
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "Upcoming Appointments",
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 16),
        Expanded(
          child: ListView.builder(
            itemCount: appointments.length,
            itemBuilder: (context, index) {
              final appointment = appointments[index];
              final date = appointment['date'] as DateTime;
              final formattedDate = DateFormat('MMM dd, yyyy').format(date);

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
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
                        color: _getStatusColor(
                          appointment['status'] as String,
                        ).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        Icons.calendar_today_rounded,
                        color: _getStatusColor(appointment['status'] as String),
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            appointment['patientName'] as String,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: Colors.black87,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            appointment['type'] as String,
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
                                '$formattedDate • ${appointment['time']}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[500],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: _getStatusColor(
                          appointment['status'] as String,
                        ).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: _getStatusColor(
                            appointment['status'] as String,
                          ).withOpacity(0.3),
                          width: 1,
                        ),
                      ),
                      child: Text(
                        appointment['status'] as String,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: _getStatusColor(
                            appointment['status'] as String,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return Colors.green;
      case 'pending':
        return Colors.orange;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}
