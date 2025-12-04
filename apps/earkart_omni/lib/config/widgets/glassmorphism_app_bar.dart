import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:earkart_omni/features/network/presentation/widgets/network_status_widget.dart';
import 'package:earkart_omni/features/network/presentation/widgets/wakelock_status_widget.dart';
import 'package:earkart_omni/config/widgets/device_status_widget.dart';

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
  final bool? autoLeading;

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
    this.autoLeading = true,
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
            automaticallyImplyLeading: autoLeading ?? false,
            centerTitle: centerTitle,
            titleSpacing: titleSpacing ?? 20,
            toolbarHeight: toolbarHeight,
            leading: leading,
            title: title,
            actions: [
              // Status widgets row with consistent height
              IntrinsicHeight(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    WakelockStatusWidget(
                      showTooltip: true,
                      borderRadius: borderRadius,
                    ),
                    const SizedBox(width: 8),
                    NetworkStatusWidget(
                      showDetails: false,
                      showTooltips: true,
                      borderRadius: borderRadius,
                    ),
                    const SizedBox(width: 8),
                    DeviceStatusWidget(borderRadius: borderRadius),
                    const SizedBox(width: 8),
                  ],
                ),
              ),
              // Original actions (if any) with consistent height
              if (actions != null)
                IntrinsicHeight(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: actions!,
                  ),
                ),
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
