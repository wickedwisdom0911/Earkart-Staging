import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

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
            centerTitle: centerTitle,
            titleSpacing: titleSpacing ?? 20,
            toolbarHeight: toolbarHeight,
            leading: leading,
            title: title,
            actions: actions,
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
