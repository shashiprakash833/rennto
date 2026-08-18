const { AndroidConfig, withStringsXml } = require('@expo/config-plugins');

module.exports = function withUCropString(config) {
  return withStringsXml(config, config => {
    config.modResults = AndroidConfig.Strings.setStringItem(
      [
        {
          $: { name: 'ucrop_menu_crop' },
          _: 'Save',
        },
      ],
      config.modResults
    );
    return config;
  });
};
