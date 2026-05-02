// @desc    Get Static QR Token untuk dicetak
// @route   GET /api/qr/generate
exports.generateDynamicQR = (req, res, next) => {
  try {
    // Menggunakan token permanen untuk QR yang dicetak di gerbang
    const qrToken = process.env.STATIC_QR_TOKEN || 'VELTRIK_ABSENSI_WIDYA_UTAMA_2026';

    res.status(200).json({
      success: true,
      data: { token: qrToken },
    });
  } catch (error) {
    next(error);
  }
};