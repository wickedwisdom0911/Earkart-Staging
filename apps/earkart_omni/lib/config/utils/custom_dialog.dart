import 'package:earkart_omni/config/utils/dimensions.dart';
import 'package:figma_squircle/figma_squircle.dart';
import 'package:flutter/material.dart';

class CustomDialog extends StatelessWidget {
  const CustomDialog({
    super.key,
    this.title,
    this.content,
    this.actions,
    this.showCross,
  });
  final Widget? title, content;
  final bool? showCross;
  final List<Widget>? actions;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: SmoothRectangleBorder(
        borderRadius: SmoothBorderRadius(
          cornerRadius: Dimensions.height5 * 6,
          cornerSmoothing: 1,
        ),
      ),
      title: Column(
        children: [
          if (showCross == null)
            Align(
              alignment: Alignment.topRight,
              child: IconButton(
                onPressed: () {
                  Navigator.pop(context);
                },
                icon: const Icon(Icons.close),
              ),
            ),
          if (title != null) title!,
        ],
      ),
      content: content,
      actions: actions,
    );
  }
}
