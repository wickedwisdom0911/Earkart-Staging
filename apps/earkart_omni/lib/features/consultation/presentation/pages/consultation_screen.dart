import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.state.dart';
import 'package:earkart_omni/features/consultation/presentation/widgets/twilio_video_widget.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class ConsultationScreen extends StatefulWidget {
  static const routeName = '/consultation';
  const ConsultationScreen({super.key});

  @override
  State<ConsultationScreen> createState() => _ConsultationScreenState();
}

class _ConsultationScreenState extends State<ConsultationScreen> {
  @override
  void initState() {
    super.initState();
    context.read<ConsultationCubit>().getCurrentConsultation();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Consultation')),
      body: BlocBuilder<ConsultationCubit, ConsultationState>(
        builder: (context, state) {
          di<ILogger>().debug(state.toString());
          if (state is CurrentConsultationSuccess) {
            return TwilioVideoWidget(
              consultationId: state.consultation.id ?? "",
            );
          }
          return const Center(child: CircularProgressIndicator());
        },
      ),
    );
  }
}
