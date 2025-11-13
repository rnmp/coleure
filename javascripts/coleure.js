window.addEventListener('load', function () {
  return require(['./goodies', './settings', './colors', './inspector', './palette', './clipboard', './formats'], function (_, settings, colors, inspector, palette) {
    "use strict";
    colors.load({
      colors: '/assets/colors.json',
      template: '/assets/templates/color.html'
    });
    inspector.setup({
      previewTemplate: '/assets/templates/preview.html',
      singleTemplate: '/assets/templates/test/single.html',
      doubleTemplate: '/assets/templates/test/double.html'
    });
    palette.setup();
  });
});
