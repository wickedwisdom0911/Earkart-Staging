import 'package:camera/camera.dart';
import 'package:earkart_omni/config/widgets/gradient_button.dart';
import 'package:earkart_omni/config/widgets/helpers.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.state.dart';
import 'package:earkart_omni/features/consultation/presentation/pages/consultation_screen.dart';
import 'package:earkart_omni/features/home/presentation/pages/root_screen.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.cubit.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.state.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:permission_handler/permission_handler.dart';

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
  String _cameraError = '';

  @override
  void initState() {
    super.initState();
    context.read<PatientCubit>().getCurrentPatient();
    _initCamera();
  }

  void startConsultation() async {
    // Dispose camera before starting consultation
    if (_cameraController != null) {
      await _cameraController!.dispose();
      _cameraController = null;
      setState(() {
        _isCameraInitialized = false;
      });
    }
    context.read<ConsultationCubit>().createConsultation();
  }

  Future<void> _initCamera() async {
    try {
      print('Starting camera initialization...');

      // Check camera permission first
      final cameraStatus = await Permission.camera.status;
      print('Camera permission status: $cameraStatus');

      if (!cameraStatus.isGranted) {
        final result = await Permission.camera.request();
        print('Camera permission request result: $result');
        if (!result.isGranted) {
          setState(() {
            _cameraError = 'Camera permission denied';
            _isCameraInitialized = false;
          });
          return;
        }
      }

      // Get available cameras
      final cameras = await availableCameras();
      print('Available cameras: ${cameras.length}');
      for (var camera in cameras) {
        print('Camera: ${camera.name}, direction: ${camera.lensDirection}');
      }

      if (cameras.isEmpty) {
        setState(() {
          _cameraError = 'No cameras available';
          _isCameraInitialized = false;
        });
        return;
      }

      // Try to find front camera, fallback to any camera
      CameraDescription selectedCamera;
      try {
        selectedCamera = cameras.firstWhere(
          (camera) => camera.lensDirection == CameraLensDirection.front,
        );
        print('Selected front camera: ${selectedCamera.name}');
      } catch (e) {
        selectedCamera = cameras.first;
        print('No front camera found, using: ${selectedCamera.name}');
      }

      // Dispose existing controller if any
      if (_cameraController != null) {
        print('Disposing existing camera controller...');
        await _cameraController!.dispose();
      }

      // Create and initialize camera controller
      print('Creating camera controller...');
      _cameraController = CameraController(
        selectedCamera,
        ResolutionPreset.medium, // Use medium for better performance
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );

      // Initialize the controller
      print('Initializing camera controller...');
      await _cameraController!.initialize();
      print('Camera controller initialized successfully');

      // Check if widget is still mounted
      if (mounted) {
        setState(() {
          _isCameraInitialized = true;
          _cameraError = '';
        });
        print('Camera state updated: initialized = true');
      }
    } catch (e) {
      print('Camera initialization error: $e');
      if (mounted) {
        setState(() {
          _cameraError = 'Failed to initialize camera: ${e.toString()}';
          _isCameraInitialized = false;
        });
      }
    }
  }

  Future<void> _retryCamera() async {
    setState(() {
      _cameraError = '';
      _isCameraInitialized = false;
    });
    await _initCamera();
  }

  @override
  void dispose() {
    if (_cameraController != null) {
      _cameraController!.dispose();
      _cameraController = null;
    }
    super.dispose();
  }

  Widget _buildCameraPreview() {
    if (_cameraError.isNotEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.camera_alt, size: 64, color: Colors.white70),
            const SizedBox(height: 12),
            Text(
              _cameraError,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _retryCamera,
              child: const Text('Retry Camera'),
            ),
          ],
        ),
      );
    }

    if (!_isCameraInitialized || _cameraController == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            CircularProgressIndicator(color: Colors.white),
            SizedBox(height: 12),
            Text(
              'Initializing camera...',
              style: TextStyle(
                color: Colors.white70,
                fontSize: 18,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
    }

    // Check if controller is properly initialized
    if (!_cameraController!.value.isInitialized) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(color: Colors.white),
            const SizedBox(height: 12),
            Text(
              'Camera not initialized\nController state: ${_cameraController!.value.toString()}',
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _retryCamera,
              child: const Text('Retry Camera'),
            ),
          ],
        ),
      );
    }

    // Check if camera is ready to show preview
    if (!_cameraController!.value.isInitialized ||
        _cameraController!.value.hasError) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.white70),
            const SizedBox(height: 12),
            Text(
              'Camera error: ${_cameraController!.value.errorDescription ?? "Unknown error"}',
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _retryCamera,
              child: const Text('Retry Camera'),
            ),
          ],
        ),
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(32),
      child: Transform(
        alignment: Alignment.center,
        transform: Matrix4.identity()..scale(-1.0, 1.0, 1.0),
        child: SizedBox.expand(child: CameraPreview(_cameraController!)),
      ),
    );
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
                          child: _buildCameraPreview(),
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
                                          patient?.name ?? '-',
                                        ),
                                        _infoRow(
                                          Icons.phone,
                                          'Contact',
                                          patient?.contactNumber ?? '-',
                                        ),
                                        _infoRow(
                                          Icons.email,
                                          'Email',
                                          patient?.email ?? '-',
                                        ),
                                        _infoRow(
                                          Icons.cake,
                                          'DOB',
                                          patient?.dob ?? '-',
                                        ),
                                        _infoRow(
                                          Icons.wc,
                                          'Gender',
                                          patient?.gender.name ?? '-',
                                        ),
                                        _infoRow(
                                          Icons.home,
                                          'Address',
                                          patient?.address ?? '-',
                                        ),
                                        _infoRow(
                                          Icons.location_city,
                                          'District',
                                          patient?.district?.name ?? '-',
                                        ),
                                        _infoRow(
                                          Icons.pin,
                                          'Pincode',
                                          patient?.pincode ?? '-',
                                        ),
                                        _infoRow(
                                          Icons.language,
                                          'Language',
                                          patient?.language?.name ?? '-',
                                        ),
                                        _infoRow(
                                          Icons.verified_user,
                                          'Status',
                                          patient?.status?.name ?? '-',
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              addVerticalSpace(20),
                              BlocConsumer<
                                ConsultationCubit,
                                ConsultationState
                              >(
                                listener: (context, state) {
                                  if (state.maybeWhen(
                                    orElse: () => false,
                                    createConsultationSuccess: (_) => true,
                                  )) {
                                    // Ensure camera is disposed before navigation
                                    if (_cameraController != null) {
                                      _cameraController!.dispose();
                                      _cameraController = null;
                                    }
                                    Navigator.pushNamed(
                                      context,
                                      ConsultationScreen.routeName,
                                    );
                                  }
                                },
                                builder: (context, state) {
                                  return GradientButton(
                                    child: const Text(
                                      'Start Consultation',
                                      style: TextStyle(color: Colors.white),
                                    ),
                                    onPressed: () {
                                      startConsultation();
                                    },
                                  );
                                },
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
