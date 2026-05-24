const { withPodfile, withXcodeProject } = require("@expo/config-plugins");

const POD_MARKER = "# UniMap: modulemap / explicit modules fix";
const POD_SNIPPET = `
    ${POD_MARKER}
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['SWIFT_ENABLE_EXPLICIT_MODULES'] = 'NO'
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      end
    end
    installer.pods_project.build_configurations.each do |config|
      config.build_settings['SWIFT_ENABLE_EXPLICIT_MODULES'] = 'NO'
    end
    installer.aggregate_targets.each do |aggregate_target|
      aggregate_target.user_project.native_targets.each do |target|
        target.build_configurations.each do |config|
          config.build_settings['SWIFT_ENABLE_EXPLICIT_MODULES'] = 'NO'
        end
      end
    end
`;

function withPodfileFix(config) {
  return withPodfile(config, (podfile) => {
    if (podfile.includes(POD_MARKER)) {
      return podfile;
    }

    const anchor = "react_native_post_install(";
    const idx = podfile.indexOf(anchor);
    if (idx === -1) {
      return podfile;
    }

    const closeIdx = podfile.indexOf(")\n", idx);
    if (closeIdx === -1) {
      return podfile;
    }

    return (
      podfile.slice(0, closeIdx + 2) + POD_SNIPPET + podfile.slice(closeIdx + 2)
    );
  });
}

/** RN bundle script (ip.txt) і CocoaPods — без sandbox. */
function withXcodeSandboxFix(config) {
  return withXcodeProject(config, (project) => {
    const section = project.pbxXCBuildConfigurationSection();
    for (const key of Object.keys(section)) {
      const entry = section[key];
      if (entry?.buildSettings) {
        entry.buildSettings.ENABLE_USER_SCRIPT_SANDBOXING = "NO";
      }
    }
    return project;
  });
}

/** @type {import('@expo/config-plugins').ConfigPlugin} */
module.exports = function withIosModulemapFix(config) {
  config = withPodfileFix(config);
  config = withXcodeSandboxFix(config);
  return config;
};
