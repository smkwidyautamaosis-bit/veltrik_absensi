const Config = require('../models/Config');

// Default config if none exist
const DEFAULT_CONFIG = {
  school_lat: -6.2088,
  school_lng: 106.8456,
  max_radius: 50,
  activeDaysByLevel: {
    X: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
    XI: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
    XII: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
  },
};

// @desc    Get All Configurations (Location & Radius)
// @route   GET /api/config
exports.getConfig = async (req, res, next) => {
  try {
    let configs = await Config.find({});
    
    // Seed default data jika database kosong
    if (configs.length === 0) {
      const defaultConfigs = [
        { key: 'school_lat', value: DEFAULT_CONFIG.school_lat, description: 'Latitude Sekolah (Default)' },
        { key: 'school_lng', value: DEFAULT_CONFIG.school_lng, description: 'Longitude Sekolah (Default)' },
        { key: 'max_radius', value: DEFAULT_CONFIG.max_radius, description: 'Radius Maksimal (Default)' },
        { key: 'active_days_by_level', value: DEFAULT_CONFIG.activeDaysByLevel, description: 'Hari aktif absensi per tingkat kelas' },
      ];
      await Config.insertMany(defaultConfigs);
      configs = await Config.find({});
    }

    // Convert to a simple key-value object
    let configData = {};
    configs.forEach(c => {
      configData[c.key] = c.value;
    });

    // Merge with defaults if some keys are missing
    const finalConfig = {
      school_lat: configData.school_lat !== undefined ? configData.school_lat : DEFAULT_CONFIG.school_lat,
      school_lng: configData.school_lng !== undefined ? configData.school_lng : DEFAULT_CONFIG.school_lng,
      max_radius: configData.max_radius !== undefined ? configData.max_radius : DEFAULT_CONFIG.max_radius,
      activeDaysByLevel: configData.active_days_by_level !== undefined
        ? configData.active_days_by_level
        : DEFAULT_CONFIG.activeDaysByLevel,
    };

    res.status(200).json({
      success: true,
      data: finalConfig
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Configurations
// @route   PUT /api/config
exports.updateConfig = async (req, res, next) => {
  try {
    const { school_lat, school_lng, max_radius, activeDaysByLevel } = req.body;

    // Update or Create each config key
    if (school_lat !== undefined) {
      await Config.findOneAndUpdate(
        { key: 'school_lat' },
        { value: parseFloat(school_lat), description: 'Latitude Sekolah' },
        { upsert: true, new: true }
      );
    }

    if (school_lng !== undefined) {
      await Config.findOneAndUpdate(
        { key: 'school_lng' },
        { value: parseFloat(school_lng), description: 'Longitude Sekolah' },
        { upsert: true, new: true }
      );
    }

    if (max_radius !== undefined) {
      await Config.findOneAndUpdate(
        { key: 'max_radius' },
        { value: parseFloat(max_radius), description: 'Radius Maksimal Absensi (meter)' },
        { upsert: true, new: true }
      );
    }

    if (activeDaysByLevel !== undefined) {
      await Config.findOneAndUpdate(
        { key: 'active_days_by_level' },
        { value: activeDaysByLevel, description: 'Hari aktif absensi per tingkat kelas' },
        { upsert: true, new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Pengaturan berhasil diperbarui'
    });
  } catch (error) {
    next(error);
  }
};
