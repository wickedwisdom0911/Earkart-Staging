import 'package:earkart_omni/config/utils/dimensions.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/widgets/custom_text_field.dart';
import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:fluttertoast/fluttertoast.dart';

class WipeDataDialog extends StatefulWidget {
  const WipeDataDialog({Key? key}) : super(key: key);

  static Future<void> show(BuildContext context) {
    return showDialog(
      context: context,
      builder: (context) => const WipeDataDialog(),
      barrierDismissible: false,
    );
  }

  @override
  State<WipeDataDialog> createState() => _WipeDataDialogState();
}

class _WipeDataDialogState extends State<WipeDataDialog> {
  final TextEditingController _passwordController = TextEditingController();
  final String _secretPassword = "deevsaini"; // Default password
  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _wipeAllHiveData() async {
    if (_passwordController.text != _secretPassword) {
      Fluttertoast.showToast(
        msg: "Incorrect password",
        toastLength: Toast.LENGTH_SHORT,
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      // List of all box names to delete
      final List<String> boxNames = [
        Constants.userDb,
        Constants.deviceDb,
        Constants.centreDb,
        Constants.patientDb,
        Constants.consultationDb,
        Constants.appointmentDb,
      ];

      // First, try to clear and close each box if it's open
      for (final boxName in boxNames) {
        try {
          if (Hive.isBoxOpen(boxName)) {
            final box = Hive.box<dynamic>(boxName);
            await box.deleteAll(box.keys);
            await box.close();
          }
        } catch (e) {
          print("Note: Could not clear box $boxName: $e");
        }
      }

      // Close all remaining open boxes
      await Hive.close();

      // Delete each box individually from disk
      for (final boxName in boxNames) {
        try {
          await Hive.deleteBoxFromDisk(boxName);
          print("Deleted box: $boxName");
        } catch (e) {
          // Ignore errors if box doesn't exist
          print("Note: Could not delete box $boxName: $e");
        }
      }

      // Delete all remaining Hive data from disk
      try {
        await Hive.deleteFromDisk();
        print("Deleted all Hive data from disk");
      } catch (e) {
        print("Note: Could not delete all Hive data: $e");
      }

      // Reinitialize Hive
      await Hive.initFlutter();

      if (mounted) {
        Navigator.of(context).pop();
        Fluttertoast.showToast(
          msg: "All data has been wiped successfully. Please restart the app.",
          toastLength: Toast.LENGTH_LONG,
        );
      }
    } catch (e) {
      if (mounted) {
        Fluttertoast.showToast(
          msg: "Error wiping data: $e",
          toastLength: Toast.LENGTH_LONG,
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: Dimensions.screenWidth * 0.25),
      child: Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        elevation: 8,
        backgroundColor: Colors.white,
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.7,
          ),
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.warning_amber_rounded,
                    color: Colors.red[600],
                    size: 48,
                  ),
                  const SizedBox(height: 18),
                  Text(
                    "Wipe All Data",
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.red[600],
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    "This will permanently delete all stored data from this device. This action cannot be undone.",
                    style: TextStyle(fontSize: 16, color: Colors.black87),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  CustomTextField(
                    controller: _passwordController,
                    hint: 'Enter password',
                    obsecure: _obscurePassword,
                    prefix: const Icon(Icons.lock_outline),
                    suffix: IconButton(
                      icon: Icon(
                        _obscurePassword
                            ? Icons.visibility
                            : Icons.visibility_off,
                      ),
                      onPressed: () {
                        setState(() {
                          _obscurePassword = !_obscurePassword;
                        });
                      },
                    ),
                  ),
                  const SizedBox(height: 26),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                            side: BorderSide(color: Colors.grey[300]!),
                          ),
                          onPressed:
                              _isLoading
                                  ? null
                                  : () => Navigator.of(context).pop(),
                          child: const Text(
                            "Cancel",
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.5,
                              color: Colors.black87,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                            backgroundColor: Colors.red[600],
                            elevation: 0,
                          ),
                          onPressed: _isLoading ? null : _wipeAllHiveData,
                          child:
                              _isLoading
                                  ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation<Color>(
                                        Colors.white,
                                      ),
                                    ),
                                  )
                                  : const Text(
                                    "Wipe Data",
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 0.5,
                                      color: Colors.white,
                                    ),
                                  ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
