define(['./keyboard', './settings', './inspector', './goodies'], function (keyboard, settings, i, _) {
  var canvas, clipboard_handler, format_status, colors_class, ctx, currentColor, hoverColor, verifyIfColor;
  colors_class = 'color';
  clipboard_handler = _.id('clipboard_handler');
  format_status = _.id('format_status');
  hoverColor = function (color) {
    _.attr(clipboard_handler, 'data-name', _.attr(color, 'data-name'));
    _.attr(clipboard_handler, 'data-hex', _.attr(color, 'data-hex'));
    _.attr(clipboard_handler, 'data-rgb', _.attr(color, 'data-rgb'));
    _.attr(clipboard_handler, 'data-hsl', _.attr(color, 'data-hsl'));
    clipboard_handler.value = _.id('current_color_code').innerHTML = _.attr(color, "data-" + settings.format);
    format_status.style.backgroundColor = '#' + _.attr(color, "data-hex");
    if (_.id('learnMoreLink')) { _.id('learnMoreLink').style.color = '#' + _.attr(color, "data-hex") };
    Color('#' + _.attr(color, "data-hex")).light() ? format_status.style.color = "#232323" : format_status.style.color = "#fff";
    Color('#' + _.attr(color, "data-hex")).light() ? _.attr(_.id('settingsIcon'), 'fill', '#232323') : _.attr(_.id('settingsIcon'), 'fill', '#fff');
    return clipboard_handler.select();
  };
  currentColor = '';

  //   function updateSelectColorDialogColors(node) {
  //     const background = _.attr(node, 'data-hex')
  //     const dialog = _.id('select_color_dialog')
  //     dialog.style.backgroundColor = "#" + background;

  //     const isLight = Color('#' + background).light()
  //     if (isLight) {
  //       dialog.style.color = "#232323"
  //     } else {
  //       dialog.style.color = "#fff"
  //     }
  //   }

  verifyIfColor = function (event) {
    if (event.target.classList.contains(colors_class)) {
      currentColor = event;
      // updateSelectColorDialogColors(event.target)
      return hoverColor(currentColor.target);
    }
  };
  var formatSettingsStatus = false,
    toggleSettings = function () {
      formatSettingsStatus ? _.id('formatSettings').classList.remove('active') : _.id('formatSettings').classList.add('active');
      formatSettingsStatus ? format_status.classList.remove('active') : format_status.classList.add('active');
      formatSettingsStatus = !formatSettingsStatus;
    };

  document.addEventListener('mouseover', verifyIfColor)

  _.listen(format_status, 'click', toggleSettings);

  canvas = document.createElement('canvas');
  canvas.height = canvas.width = 32;
  ctx = canvas.getContext('2d');
  return keyboard.listenWithCtrl('C', function () {
    var clipboard, head, link, oldLink;
    clipboard = clipboard_handler.value;
    if (!clipboard) {
      return;
    }
    document.title = "" + clipboard + " - Coleure";
    ctx.clearRect(0, 0, 32, 32);
    ctx.fillStyle = "#" + _.attr(clipboard_handler, 'data-hex');
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    link = document.createElement('link');
    link.id = 'dynamic-favicon';
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = canvas.toDataURL('image/x-icon');
    oldLink = _.id('dynamic-favicon');
    head = document.head || _.tag('head')[0];
    if (oldLink) {
      head.removeChild(oldLink);
    }
    return head.appendChild(link);
  });
});
