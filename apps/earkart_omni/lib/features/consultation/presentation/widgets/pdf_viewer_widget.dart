import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/widgets/glassmorphism_app_bar.dart';
import 'package:flutter/material.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';

class PdfViewerScreen extends StatefulWidget {
  final String pdfUrl;
  final String title;

  const PdfViewerScreen({
    super.key,
    required this.pdfUrl,
    required this.title,
  });

  @override
  State<PdfViewerScreen> createState() => _PdfViewerScreenState();
}

class _PdfViewerScreenState extends State<PdfViewerScreen> {
  final GlobalKey<SfPdfViewerState> _pdfViewerKey = GlobalKey();
  bool _isLoading = true;
  String? _errorMessage;
  bool _isDisposed = false;
  double? _screenHeight;
  double? _screenWidth;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_screenHeight == null || _screenWidth == null) {
      final mediaQuery = MediaQuery.of(context);
      _screenHeight = mediaQuery.size.height;
      _screenWidth = mediaQuery.size.width;
    }
  }

  @override
  void dispose() {
    _isDisposed = true;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: GlassmorphismAppBar(title: Text(widget.title)),
      body: SafeArea(
        child: RepaintBoundary(
          child: _errorMessage != null
              ? _buildErrorView()
              : _buildPdfViewer(context),
        ),
      ),
    );
  }

  Widget _buildErrorView() {
    return RepaintBoundary(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline,
                size: 64,
                color: Colors.red.shade300,
              ),
              const SizedBox(height: 16),
              Text(
                'Error loading PDF',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey.shade800,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _errorMessage!,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade600,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () {
                  setState(() {
                    _errorMessage = null;
                    _isLoading = true;
                  });
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Constants.secondaryColor,
                  foregroundColor: Colors.white,
                ),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPdfViewer(BuildContext context) {
    final screenHeight = _screenHeight ?? MediaQuery.of(context).size.height;
    final screenWidth = _screenWidth ?? MediaQuery.of(context).size.width;

    try {
      return RepaintBoundary(
        child: SizedBox(
          height: screenHeight,
          width: screenWidth,
          child: Stack(
            children: [
              RepaintBoundary(
                child: SfPdfViewer.network(
                  widget.pdfUrl,
                  key: _pdfViewerKey,
                  onDocumentLoadFailed: (PdfDocumentLoadFailedDetails details) {
                    if (!_isDisposed && mounted) {
                      Future.microtask(() {
                        if (mounted && !_isDisposed) {
                          setState(() {
                            _isLoading = false;
                            _errorMessage = details.error.toString();
                          });
                        }
                      });
                    }
                  },
                  onDocumentLoaded: (PdfDocumentLoadedDetails details) {
                    if (!_isDisposed && mounted) {
                      Future.microtask(() {
                        if (mounted && !_isDisposed) {
                          setState(() {
                            _isLoading = false;
                          });
                        }
                      });
                    }
                  },
                ),
              ),
              if (_isLoading)
                const RepaintBoundary(
                  child: _LoadingIndicator(),
                ),
            ],
          ),
        ),
      );
    } catch (e) {
      Future.microtask(() {
        if (mounted && !_isDisposed) {
          setState(() {
            _isLoading = false;
            _errorMessage =
                'PDF viewer plugin not initialized. Please rebuild the app.\n\nError: ${e.toString()}';
          });
        }
      });
      return RepaintBoundary(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.error_outline,
                  size: 64,
                  color: Colors.orange.shade300,
                ),
                const SizedBox(height: 16),
                Text(
                  'Plugin Not Initialized',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey.shade800,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Please rebuild the app completely (not just hot reload) for the PDF viewer to work.',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade600,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      );
    }
  }
}

class _LoadingIndicator extends StatelessWidget {
  const _LoadingIndicator();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      child: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text(
              'Loading PDF...',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

