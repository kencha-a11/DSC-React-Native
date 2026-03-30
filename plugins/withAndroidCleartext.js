const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withAndroidCleartext(config) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const application = androidManifest.manifest.application[0];
    application.$["android:usesCleartextTraffic"] = "true";
    return config;
  });
};
