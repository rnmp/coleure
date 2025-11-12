define(['./goodies', './settings'], function (_, settings) {
  let colorDrag,
    colorDrop,
    colorOver,
    colorTemplate,
    dropMessage,
    insertColor,
    paletteColorDrag,
    paletteColorDrop,
    paletteColorOver,
    paletteColors,
    palettesDropdownLabel,
    palettesList,
    replaceColors,
    colorOrigin,
    activePalette;
  palettesDropdownLabel = null;
  palettesList = null;
  paletteColors = null;
  dropMessage = null;
  colorTemplate = null;
  colorDrag = function (event) {
    var color, data;
    color = event.target;
    colorOrigin = _.attr(color, 'data-origin');
    data = {
      name: _.attr(color, 'data-name'),
      hex: _.attr(color, 'data-hex'),
      rgb: _.attr(color, 'data-rgb'),
      hsl: _.attr(color, 'data-hsl'),
      mixed: _.attr(color, 'data-mixed'),
    };
    event.dataTransfer.effectAllowed = 'copy';
    return event.dataTransfer.setData('text', JSON.stringify(data));
  };
  colorOver = function (event) {
    event.preventDefault();
    return event.dataTransfer.dropEffect = 'copy';
  };
  var updateTitle = function (number) {
    _.id('activePalette').innerHTML = activePalette.name ? activePalette.name : "No. " + activePalette.id;
  }

  let colorData = { palettes: [] }
  try {
    const parsedColorData = JSON.parse(localStorage.getItem('coleure'))
    if (parsedColorData) {
      colorData = parsedColorData
    }
  } catch (e) {
  }

  function getSnapshot() {
    return JSON.parse(JSON.stringify(colorData))
  }

  function commit(newData) {
    localStorage.setItem("coleure", JSON.stringify(newData))
    colorData = newData
  }

  var addColor = function (data) {
    console.log(activePalette)
    activePalette = activePalette || {
      id: crypto.randomUUID(),
      name: 'New Palette',
      colors: []
    }

    const newColor = {
      id: crypto.randomUUID(),
      palette_id: activePalette.id,
      ...data,
    }

    localStorage.setItem('currentPaletteId', activePalette.id)

    activePalette = {
      ...activePalette,
      colors: [
        newColor,
        ...(activePalette.colors || []),
      ]
    };

    const snapshot = getSnapshot()
    const existingPalette = snapshot.palettes.find(p => p.id === activePalette.id)
    if (existingPalette) {
      existingPalette.colors = activePalette.colors
    } else {
      snapshot.palettes.push(activePalette)
    }
    commit(snapshot)

    updateTitle();
    _.show(_.id('renameButton'), 'inline-block')

    _.template(colorTemplate, function (template) {
      return insertColor(template, data);
    });
    _.attr(paletteColors.children.item(0), 'data-id', newColor.id);
    _.hide(dropMessage);
  }
  colorDrop = function (event) {
    var data;
    event.preventDefault();
    data = JSON.parse(event.dataTransfer.getData('text'));
    data.index = activePalette?.colors.length;
    data.id = null;
    // TODO: we actually need to provide the proper id in case the user removes the color right away.
    addColor(data);
  };
  paletteColorDrag = function (event) {
    var index, paletteColor;
    event.dataTransfer.effectAllowed = 'move';
    paletteColor = event.target;
    colorOrigin = _.attr(paletteColor, 'data-origin');
    index = _.indexOf(paletteColor.parentNode.children, paletteColor);
    return event.dataTransfer.setData('text', index);
  };
  paletteColorOver = function (event) {
    event.preventDefault();
    return event.dataTransfer.dropEffect = 'move';
  };
  paletteColorDrop = function (event) {
    var index, origin;
    event.preventDefault();
    index = event.dataTransfer.getData('text');
    if (colorOrigin == "palette") {
      removeColor(index);
    }
  };
  var removeColor = function (index) {
    if (!activePalette) {
      return
    }

    var visualColor = paletteColors.children.item(index)
    activePalette.colors.splice(activePalette.colors.length - index - 1, 1);
    visualColor.classList.add('deleted');

    const snapshot = getSnapshot()
    const existingPalette = snapshot.palettes.find(p => p.id === activePalette.id)
    existingPalette.colors = existingPalette.colors.filter(c => c.id === activePalette.colors[index].id)
    commit(snapshot)

    setTimeout(() => {
      _.remove(visualColor);
      if (activePalette.colors.length == 0) {
        _.show(dropMessage)
      }
    }, 200)
  }
  replaceColors = function (template) {
    var color, _i, _len;
    while (paletteColors.firstChild) {
      paletteColors.removeChild(paletteColors.firstChild);
    }
    for (_i = 0, _len = activePalette.colors.length; _i < _len; _i++) {
      color = activePalette.colors[_i];
      if (!color.mixed) {
        color.mixed = false;
      }
      color.index = _i;
      insertColor(template, color);
    }
    if (paletteColors.children.length) {
      return _.hide(dropMessage);
    } else {
      return _.show(dropMessage);
    }
  };
  insertColor = function (template, color) {
    var el;
    el = _.create('i');
    paletteColors.insertBefore(el, paletteColors.firstChild);
    color.origin = "palette";
    el.outerHTML = template(color);
  };
  function initializePalette() {
    const currentPaletteId = localStorage.getItem('currentPaletteId')
    if (!currentPaletteId) {
      return
    }
    const existingPalette = colorData.palettes.find(p => p.id === currentPaletteId)
    if (!existingPalette) {
      return
    }

    activePalette = existingPalette
    _.template(colorTemplate, replaceColors);
    updateTitle();
  }

  var renamePalette = function () {
    var data = {};
    var newName = prompt("New name for palette");

    if (newName != "") {
      var request = new XMLHttpRequest();
      request.onreadystatechange = function () {
        if (request.readyState != 4 || request.status != 200) return;
        var requestData = JSON.parse(request.responseText);
      };
      request.setRequestHeader('Accept', 'application/json');
      request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
      request.setRequestHeader('X-CSRF-Token', getAuthToken());

      data.name = newName;
      request.send(_.serialize(data, 'palette'));
      _.id('activePalette').innerHTML = newName;
    }
  }

  return {
    addColor: addColor,
    removeColor: removeColor,
    setup: function (options) {
      const dropzone = _.id('palette');
      _.listen(dropzone, 'dragenter', colorOver);
      _.listen(dropzone, 'dragover', colorOver);
      _.listen(dropzone, 'drop', colorDrop);

      _.listen(_.id('colors'), 'dragstart', colorDrag);
      _.listen(_.id('subjects'), 'dragstart', colorDrag);
      _.listen(_.id('renameButton'), 'mousedown', renamePalette);
      paletteColors = _.id('palette_colors');
      _.listen(paletteColors, 'dragstart', paletteColorDrag);
      _.listen(_.id('colors'), 'dragenter', paletteColorOver);
      _.listen(_.id('colors'), 'dragover', paletteColorOver);
      _.listen(_.id('colors'), 'drop', paletteColorDrop);
      dropMessage = _.id('drop-message');
      colorTemplate = options.template;

      initializePalette();
    }
  }
});
