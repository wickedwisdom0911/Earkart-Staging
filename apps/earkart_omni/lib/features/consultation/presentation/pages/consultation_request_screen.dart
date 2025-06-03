import 'package:camera/camera.dart';
import 'package:earkart_omni/config/widgets/gradient_button.dart';
import 'package:earkart_omni/config/widgets/helpers.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.cubit.dart';
import 'package:earkart_omni/features/home/presentation/pages/root_screen.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.cubit.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.state.dart';
import 'package:earkart_omni/models/consultation/consultation.entity.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class ConsultationRequestScreen extends StatefulWidget {
  static const routeName = '/consultation-request';
  const ConsultationRequestScreen({super.key});

  @override
  State<ConsultationRequestScreen> createState() =>
      _ConsultationRequestScreenState();
}

class _ConsultationRequestScreenState extends State<ConsultationRequestScreen> {
  CameraController? _cameraController;
  bool _isCameraInitialized = false;

  @override
  void initState() {
    super.initState();
    context.read<PatientCubit>().getCurrentPatient();
    _initCamera();
  }

  void startConsultation() {
    context.read<ConsultationCubit>().createConsultation();
  }

  Future<void> _initCamera() async {
    try {
      final cameras = await availableCameras();
      final frontCamera = cameras.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.front,
      );
      _cameraController = CameraController(
        frontCamera,
        ResolutionPreset.max,
        enableAudio: false,
        fps: 120,
      );
      await _cameraController!.initialize();
      if (mounted) {
        setState(() {
          _isCameraInitialized = true;
        });
      }
    } catch (e) {
      // Handle error or show a placeholder
      setState(() {
        _isCameraInitialized = false;
      });
    }
  }

  @override
  void dispose() {
    if (_cameraController != null) {
      _cameraController!.dispose();
      _cameraController = null;
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Consultation Request'),
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: CupertinoButton(
              padding: EdgeInsets.zero,
              onPressed: () {
                context.read<PatientCubit>().deletePatientSession();
                Navigator.pushNamedAndRemoveUntil(
                  context,
                  RootScreen.routeName,
                  (route) => false,
                );
              },
              child: const Text('Cancel'),
            ),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 20),
        child: BlocBuilder<PatientCubit, PatientState>(
          builder: (context, state) {
            return state.maybeWhen(
              orElse: () => const Center(child: CircularProgressIndicator()),
              currentPatientSuccess:
                  (patient) => Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Camera Preview (left half)
                      Expanded(
                        child: Container(
                          height: double.infinity,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                Colors.blue.shade200,
                                Colors.blue.shade400,
                              ],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(32),
                          ),
                          child:
                              _isCameraInitialized && _cameraController != null
                                  ? ClipRRect(
                                    borderRadius: BorderRadius.circular(32),
                                    child: Transform(
                                      alignment: Alignment.center,
                                      transform:
                                          Matrix4.identity()
                                            ..scale(-1.0, 1.0, 1.0),
                                      child: SizedBox.expand(
                                        child: CameraPreview(
                                          _cameraController!,
                                        ),
                                      ),
                                    ),
                                  )
                                  : Center(
                                    child: Column(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: const [
                                        Icon(
                                          Icons.camera_alt,
                                          size: 64,
                                          color: Colors.white70,
                                        ),
                                        SizedBox(height: 12),
                                        Text(
                                          'Camera initializing...',
                                          style: TextStyle(
                                            color: Colors.white70,
                                            fontSize: 18,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                        ),
                      ),
                      // Patient Info and Button (right half)
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.all(20.0),
                          child: Column(
                            children: [
                              Expanded(
                                child: Card(
                                  elevation: 6,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Padding(
                                    padding: const EdgeInsets.all(20.0),
                                    child: ListView(
                                      children: [
                                        _infoRow(
                                          Icons.person,
                                          'Name',
                                          patient.name,
                                        ),
                                        _infoRow(
                                          Icons.phone,
                                          'Contact',
                                          patient.contactNumber,
                                        ),
                                        _infoRow(
                                          Icons.email,
                                          'Email',
                                          patient.email ?? '-',
                                        ),
                                        _infoRow(
                                          Icons.cake,
                                          'DOB',
                                          patient.dob,
                                        ),
                                        _infoRow(
                                          Icons.wc,
                                          'Gender',
                                          patient.gender.name,
                                        ),
                                        _infoRow(
                                          Icons.home,
                                          'Address',
                                          patient.address,
                                        ),
                                        _infoRow(
                                          Icons.location_city,
                                          'District',
                                          patient.district?.name ?? '-',
                                        ),
                                        _infoRow(
                                          Icons.pin,
                                          'Pincode',
                                          patient.pincode,
                                        ),
                                        _infoRow(
                                          Icons.language,
                                          'Language',
                                          patient.language?.name ?? '-',
                                        ),
                                        _infoRow(
                                          Icons.verified_user,
                                          'Status',
                                          patient.status?.name ?? '-',
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              addVerticalSpace(20),
                              GradientButton(
                                child: const Text(
                                  'Start Consultation',
                                  style: TextStyle(color: Colors.white),
                                ),
                                onPressed: () {},
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
            );
          },
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        children: [
          Icon(icon, color: Colors.blueAccent),
          const SizedBox(width: 12),
          Text('$label: ', style: const TextStyle(fontWeight: FontWeight.w600)),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w400),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
