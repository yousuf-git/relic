// Signs release builds with the upload key from ~/.relic-keys/keystore.properties
// (kept outside the repo). Without that file, release builds fall back to debug signing.
const { withAppBuildGradle } = require("expo/config-plugins");

const MARKER = "// relic-release-signing";

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;
    if (gradle.includes(MARKER)) return cfg;

    gradle = gradle.replace(
      /signingConfigs\s*\{/,
      `signingConfigs {
        ${MARKER}
        def relicKeys = new Properties()
        def relicKeysFile = new File(System.getProperty("user.home"), ".relic-keys/keystore.properties")
        if (relicKeysFile.exists()) relicKeysFile.withInputStream { relicKeys.load(it) }
        release {
            if (relicKeysFile.exists()) {
                storeFile file(relicKeys["RELIC_UPLOAD_STORE_FILE"])
                storePassword relicKeys["RELIC_UPLOAD_STORE_PASSWORD"]
                keyAlias relicKeys["RELIC_UPLOAD_KEY_ALIAS"]
                keyPassword relicKeys["RELIC_UPLOAD_KEY_PASSWORD"]
            }
        }`,
    );
    gradle = gradle.replace(
      /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.debug/,
      `$1signingConfig new File(System.getProperty("user.home"), ".relic-keys/keystore.properties").exists() ? signingConfigs.release : signingConfigs.debug`,
    );
    cfg.modResults.contents = gradle;
    return cfg;
  });
};
