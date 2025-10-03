import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:earkart_omni/features/network/presentation/widgets/network_status_widget.dart';
import 'package:earkart_omni/features/network/presentation/widgets/wakelock_status_widget.dart';
import 'package:earkart_omni/features/consultation/presentation/widgets/device_status_widget.dart';

class GlassmorphismAppBar extends StatelessWidget
    implements PreferredSizeWidget {
  final Widget? title;
  final Widget? leading;
  final List<Widget>? actions;
  final double? elevation;
  final Color? backgroundColor;
  final bool centerTitle;
  final double? titleSpacing;
  final double toolbarHeight;
  final double blurSigma;
  final double opacity;

  const GlassmorphismAppBar({
    super.key,
    this.title,
    this.leading,
    this.actions,
    this.elevation = 0,
    this.backgroundColor,
    this.centerTitle = false,
    this.titleSpacing,
    this.toolbarHeight = 60,
    this.blurSigma = 10.0,
    this.opacity = 0.1,
  });

  @override
  Widget build(BuildContext context) {
    const borderRadius = 10.0;
    return ClipRRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blurSigma, sigmaY: blurSigma),
        child: Container(
          decoration: BoxDecoration(
            color: (backgroundColor ?? Colors.white).withAlpha(
              (opacity * 255).toInt(),
            ),
            border: const Border(
              bottom: BorderSide(color: Color(0x1A000000), width: 0.5),
            ),
          ),
          child: AppBar(
            elevation: elevation,
            backgroundColor: Colors.transparent,
            surfaceTintColor: Colors.transparent,
            scrolledUnderElevation: 0,
            automaticallyImplyLeading: false,
            centerTitle: centerTitle,
            titleSpacing: titleSpacing ?? 20,
            toolbarHeight: toolbarHeight,
            leading: leading,
            title: title,
            actions: [
              // Status widgets row
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const WakelockStatusWidget(showTooltip: true),
                  const SizedBox(width: 8),
                  const NetworkStatusWidget(
                    showDetails: false,
                    showTooltips: true,
                    borderRadius: borderRadius,
                  ),
                  const SizedBox(width: 8),
                  const DeviceStatusWidget(borderRadius: borderRadius),
                  const SizedBox(width: 16),
                ],
              ),
              // Original actions (if any)
              if (actions != null) ...actions!,
            ],
            systemOverlayStyle: const SystemUiOverlayStyle(
              statusBarColor: Colors.transparent,
              statusBarIconBrightness: Brightness.dark,
              statusBarBrightness: Brightness.light,
            ),
          ),
        ),
      ),
    );
  }

  @override
  Size get preferredSize => Size.fromHeight(toolbarHeight);
}
