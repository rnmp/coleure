(function() {

  define(['./goodies', './settings', './palette'], function(_, settings, palette) {
  	var inspector = this;
	var color_subjects = null, color_previews = null, options = null, data = {};
	var subject1 = null, subject2 = null;
	var subjectsCount = null;
	var colorOrigin;
	var mixButton = _.id('mixButton'),
		mixResult = _.id('mixResult'),
		selectMix = _.id('selectMix');
	var toggleMessage = function(showTests) {
	  if (showTests) {
	  	_.id('app').classList.add('active-panels');
	  } else {
	  	_.id('app').classList.remove('active-panels');
	  }
	};
	var checkContrastFunction = function (color1, color2) {
	  var contrast = Color(color1).contrast(Color(color2)),
		  roundedContrast = Math.round( contrast * 10 ) / 10;
	  if (contrast >= 5) {
		return '<abbr title="The contrast between these two colors is '+roundedContrast+'/21. Good enough." class="good contrast">Good contrast</abbr>';
	  } else {
		return '<abbr title="The contrast between these two colors is '+roundedContrast+'/21. Might be problematic." class="bad contrast">Bad contrast</abbr>';
	  }
	};
	var changePreview = function(template) {
	  return color_subjects.innerHTML += template(data);
	};
	var changeTests = function(template) {
	  return _.id('tests').innerHTML = template(data);
	};
	var removeColor = function(event) {
	  var closeButton, preview;
	  closeButton = event.target;

	  // making sure the close button contains the class 'close'
	  if (!closeButton.classList.contains('close')) {
		return;
	  }

	  // updating the number of previews displayed
	  subjectsCount = _.cls('color-preview').length - 1;
	  _.attr(_.id('subjects'), 'data-subjects', subjectsCount, true);

	  //
	  if (subjectsCount >=1) { _.remove(closeButton.parentNode); }
	  toggleMessage(subjectsCount !== 0);
	  preview = _.cls('color-preview')[0];

	  mixPanel.exit(true);
	  if (!preview) {
		return;
	  }

	  if(subjectsCount == 0){
	  	editPanel.exit();
	  	mixMode.exit();
	  	compareMode.exit();
	  }

	  data.hex = _.attr(preview, 'data-hex');
	  data.checkContrast = checkContrastFunction;

	  editPanel.setup();
	  paletteOptions.setup();
	  return _.template(options.singleTemplate, changeTests);
	};

	var mixPanel = (function(){
		var panel = _.id('mixPanel');

		function setMixResult(weight){
			var result = Color('#'+subject1.hex).mix(Color('#'+subject2.hex), weight),
				hex = result.hexString().substring(1).toLowerCase(),
				rgb = result.values.rgb[0]+", "+result.values.rgb[1]+", "+result.values.rgb[2],
				hsl = result.values.hsl[0]+", "+result.values.hsl[1]+"%, "+result.values.hsl[2]+"%";

			_.attr(selectMix, 'data-name', subject1.name+' + '+subject2.name);
			_.attr(selectMix, 'data-hex', hex);
			_.attr(selectMix, 'data-rgb', rgb);
			_.attr(selectMix, 'data-hsl', hsl);
			_.attr(selectMix, 'data-mixed', true);

			_.id('mixWeightA').innerHTML = (weight*100).toFixed()+"%";
			Color('#'+subject1.hex).light() ? _.id('mixWeightA').style.color = "#232323" : _.id('mixWeightA').style.color = "#fff";

			_.id('mixWeightB').innerHTML = ((1-weight)*100).toFixed()+"%";
			Color('#'+subject2.hex).light() ? _.id('mixWeightB').style.color = "#232323" : _.id('mixWeightB').style.color = "#fff";
			mixResult.style.backgroundColor = '#'+hex;
		}

		return {
			init: function(){
				setTimeout(function(){_.hide(mixButton)}, 200);
				_.attr(mixButton, 'class', 'active');
				setTimeout(function(){_.show(mixControls); _.show(mixResult)}, 200);
				setMixResult(0.5);
				_.id('mixBalance').value = 0.5;
				_.listen(_.id('mixBalance'), 'input', function(){setMixResult(_.id('mixBalance').value)});
			},
			exit: function($condition){
				var removeColorButton = $condition || false;
				_.hide(mixResult);
				_.hide(mixControls);
				_.show(mixButton);
				_.attr(mixButton, 'class', 'not-active');
				if (subjectsCount < 2) {
					_.hide(panel)
				};
				if (removeColorButton != true) {
					mixMode.exit();
				}
			},
			setup: function(){
				if (subjectsCount === 2){
					setMixResult(_.id('mixBalance').value);
					_.show(panel);
					_.id('mixBalance').style.backgroundImage = ['linear-gradient(to right, #',subject1.hex,', #', subject2.hex,')'].join('');
				} else {
					this.exit();
				};

				if (mixModeStatus == true){
					this.init();
				};
			},
		};
	})();

	var compareModeStatus = false,
	compareMode = (function(){
		function updateDialogBackground(event){
			var hoveredColor = event.target,
				background = _.attr(hoveredColor, 'data-hex'),
				textColor = _.id('compareModeDialog').style.color;
			Color('#'+background).light() ? _.id('compareModeDialog').style.color = "#232323" : _.id('compareModeDialog').style.color = "#fff";
			_.id('compareModeDialog').style.backgroundColor = "#"+background;
		}
		return {
			init: function(){
				mixMode.exit(); // TODO: make this more smart for future color options (aka edit, add to palette, etc.)
				editPanel.exit();
				if (compareModeStatus == false){
					_.id('compareModeButton').classList.add('active')
					_.id('app').classList.add('active-mode');
					_.id('app').classList.add('active-compare-mode');
				} else {
					_.id('compareModeButton').classList.remove('active')
					if(mixModeStatus == false){_.id('app').classList.remove('active-mode')}
					_.id('app').classList.remove('active-compare-mode');
				}
				compareModeStatus = !compareModeStatus;

				_.listen(_.id('colors'), 'mouseover', updateDialogBackground)
				_.listen(_.id('palette_colors'), 'mouseover', updateDialogBackground)
				_.listen(window, 'keydown', function(e){if(e.keyCode == 27){compareMode.exit()}})
			},
			exit: function(){
				if(mixModeStatus == false){_.id('app').classList.remove('active-mode')}
				_.id('app').classList.remove('active-compare-mode');
				_.id('compareModeButton').classList.remove('active')
				compareModeStatus = false;
				_.unlisten(_.id('colors'), 'mouseover', updateDialogBackground);
				_.unlisten(_.id('palette_colors'), 'mouseover', updateDialogBackground);
				_.unlisten(window, 'keydown', function(e){if(e.keyCode == 27){compareMode.exit()}})
			}
		}
	})();

	var mixModeStatus = false,
	mixMode = (function(){
		function updateDialogBackground(event){
			var hoveredColor = event.target,
				background = _.attr(hoveredColor, 'data-hex'),
				textColor = _.id('mixModeDialog').style.color;
			Color('#'+background).light() ? _.id('mixModeDialog').style.color = "#232323" : _.id('mixModeDialog').style.color = "#fff";
			_.id('mixModeDialog').style.backgroundColor = "#"+background;
		}
		return {
			init: function(){
				compareMode.exit(); // TODO: make this more smart for future color options (aka edit, add to palette, etc.)
				editPanel.exit();
				if (mixModeStatus == false){
					_.id('app').classList.add('active-mode');
					_.id('app').classList.add('active-mix-mode');
					_.id('mixModeButton').classList.add('active');
				} else {
					if(compareModeStatus == false){_.id('app').classList.remove('active-mode')}
					_.id('app').classList.remove('active-mix-mode');
					_.id('mixModeButton').classList.remove('active');
				}
				mixModeStatus = !mixModeStatus;

				_.listen(_.id('colors'), 'mouseover', updateDialogBackground)
				_.listen(_.id('palette_colors'), 'mouseover', updateDialogBackground)
				_.listen(window, 'keydown', function(e){if(e.keyCode == 27){mixMode.exit()}})
			},
			exit: function(){
				if(compareModeStatus == false){_.id('app').classList.remove('active-mode')}
				_.id('app').classList.remove('active-mix-mode');
				_.id('mixModeButton').classList.remove('active');
				mixModeStatus = false;
				_.unlisten(_.id('colors'), 'mouseover', updateDialogBackground);
				_.unlisten(_.id('palette_colors'), 'mouseover', updateDialogBackground);
				_.unlisten(window, 'keydown', function(e){if(e.keyCode == 27){mixMode.exit()}})
			}
		}
	})();

	var editPanelStatus = false,
	editPanel = (function(){
		var panel = _.id('editPanel');
		var initialName;
		var initialHex;
		var validateHex = function(value){
			return /(^#?[0-9A-F]{6}$)|(^#?[0-9A-F]{3}$)/i.test(value);
		};
		var updateValues = function(){
			var colorHSL = Color('#'+data.hex).values.hsl;
			_.id('colorHueValue').value = colorHSL[0];
			_.id('colorHueRange').value = colorHSL[0];

			_.id('colorSaturationValue').value = colorHSL[1];
			_.id('colorSaturationRange').value = colorHSL[1];

			_.id('colorLightValue').value = colorHSL[2];
			_.id('colorLightRange').value = colorHSL[2];
		};
		var updateTemplates = function(){
			data.mixed = 'false';
			data.id = null;
			_.remove(color_previews[0]);
			_.template(options.previewTemplate, changePreview);
			_.template(options.singleTemplate, changeTests);
		};
		var updateGradients = (function(){
			return {
				hue: function(colorHSL){
					_.id('colorHueRange').style.backgroundImage = [
						'linear-gradient(to right,',
							'hsl(0, ',colorHSL[1],'%, ',colorHSL[2],'%) 0%,',
							'hsl(60, ',colorHSL[1],'%, ',colorHSL[2],'%) 17%,',
							'hsl(120, ',colorHSL[1],'%, ',colorHSL[2],'%) 33%,',
							'hsl(180, ',colorHSL[1],'%, ',colorHSL[2],'%) 50%,',
							'hsl(240, ',colorHSL[1],'%, ',colorHSL[2],'%) 67%,',
							'hsl(300, ',colorHSL[1],'%, ',colorHSL[2],'%) 84%,',
							'hsl(360, ',colorHSL[1],'%, ',colorHSL[2],'%) 100%)'
					].join('');
				},
				saturation: function(colorHSL){
					_.id('colorSaturationRange').style.backgroundImage = [
						'linear-gradient(to right, hsl(',colorHSL[0],', 0%, ',colorHSL[2],'%) 0%, hsl(',colorHSL[0],', 100%, ',colorHSL[2],'%) 100%)'
					].join('');
				},
				light: function(colorHSL){
					_.id('colorLightRange').style.backgroundImage = [
						'linear-gradient(to right, black 0%, hsl(',colorHSL[0],',', colorHSL[1],'%, 50%) 50%, white 100%)'
					].join('');
				}
			}
		})();
		var updateData = function(hexValue){
			data = {
				hex: hexValue,
				hsl: [
					Color('#'+data.hex).values.hsl[0], ', ',
					Color('#'+data.hex).values.hsl[1], '%, ',
					Color('#'+data.hex).values.hsl[2], '%'].join(''),
				rgb: [
					Color('#'+data.hex).values.rgb[0], ', ',
					Color('#'+data.hex).values.rgb[1], ', ',
					Color('#'+data.hex).values.rgb[2]].join(''),
				origin: "inspector",
				mixed: "false",
				name: data.name,
				checkContrast: checkContrastFunction,
			};
			paletteOptions.setup();
		}
		return {
			init: function(){
				this.setup;
				_.id('editPanelButton').classList.add('active');
				_.show(panel);

				// TODO: This is hacky code that makes sure _.show(panel) is executed before and not at the same time.
				setTimeout(function(){panel.classList.add('active');}, 20);
				editPanelStatus = true;
			},
			exit: function(){
				_.unlisten(window, 'keydown', function(e){if(e.keyCode == 27){editPanel.exit()}})
				_.id('editPanelButton').classList.remove('active');
				panel.classList.remove('active');
				setTimeout(function(){_.hide(panel);}, 300);
				editPanelStatus = false;
			},
			toggle: function(){
				editPanelStatus ? editPanel.exit() : editPanel.init();
			},
			setup: function(){
				if(subjectsCount == 2){
					_.hide(_.id('editPanelButton'));
				} else {
					_.show(_.id('editPanelButton'))
				}
				_.id('colorCode').value = initialHex = data.hex;
				_.id('colorName').value = initialName = data.name;

				updateGradients.hue(Color('#'+data.hex).values.hsl);
				updateGradients.saturation(Color('#'+data.hex).values.hsl);
				updateGradients.light(Color('#'+data.hex).values.hsl);
				updateValues();

				// for init function
				_.listen(_.id('colorCode'), 'input', this.onCodeChange);
				_.listen(_.id('colorHueValue'), 'input', this.onHueValueChange);
				_.listen(_.id('colorHueRange'), 'input', this.onHueRangeChange);
				_.listen(_.id('colorSaturationValue'), 'input', this.onSaturationValueChange);
				_.listen(_.id('colorSaturationRange'), 'input', this.onSaturationRangeChange);
				_.listen(_.id('colorLightValue'), 'input', this.onLightValueChange);
				_.listen(_.id('colorLightRange'), 'input', this.onLightRangeChange);
				_.listen(_.id('colorName'), 'input', this.onNameChange);
				_.listen(window, 'keydown', function(e){if(e.keyCode == 27){editPanel.exit()}})
			},

			onCodeChange: function(){
				data.hex = validateHex(_.id('colorCode').value) ? _.id('colorCode').value.replace('#','') : initialHex;
				updateData(data.hex);
				updateValues();
				updateGradients.hue(Color('#'+data.hex).values.hsl);
				updateGradients.saturation(Color('#'+data.hex).values.hsl);
				updateGradients.light(Color('#'+data.hex).values.hsl);
				updateTemplates();
			},
			onHueValueChange: function(){
				var hexValue = Color({h: _.id('colorHueValue').value, s: _.id('colorSaturationValue').value, l: _.id('colorLightValue').value}).hexString().substring(1).toLowerCase();
				updateData(hexValue);
				_.id('colorHueRange').value = _.id('colorHueValue').value;

				updateGradients.saturation(Color('#'+data.hex).values.hsl);
				updateGradients.light(Color('#'+data.hex).values.hsl);
				updateTemplates();

			},
			onSaturationValueChange: function(){
				var hexValue = Color({h: _.id('colorHueValue').value, s: _.id('colorSaturationValue').value, l: _.id('colorLightRange').value}).hexString().substring(1).toLowerCase();
				updateData(hexValue);
				_.id('colorSaturationRange').value = _.id('colorSaturationValue').value;

				updateGradients.saturation(Color('#'+data.hex).values.hsl);
				updateGradients.light(Color('#'+data.hex).values.hsl);
				updateTemplates();

			},
			onLightValueChange: function(){
				var hexValue = Color({h: _.id('colorHueValue').value, s: _.id('colorSaturationValue').value, l: _.id('colorLightValue').value}).hexString().substring(1).toLowerCase();
				updateData(hexValue);
				_.id('colorLightRange').value = _.id('colorLightValue').value;

				updateGradients.saturation(Color('#'+data.hex).values.hsl);
				updateGradients.light(Color('#'+data.hex).values.hsl);
				updateTemplates();

			},
			onHueRangeChange: function(){
				var hexValue = Color({h: _.id('colorHueRange').value, s: _.id('colorSaturationRange').value, l: _.id('colorLightRange').value}).hexString().substring(1).toLowerCase();
				updateData(hexValue);
				_.id('colorCode').value = hexValue;
				_.id('colorHueValue').value = _.id('colorHueRange').value;

				updateGradients.saturation(Color('#'+data.hex).values.hsl);
				updateGradients.light(Color('#'+data.hex).values.hsl);
				updateTemplates();

			},

			onSaturationRangeChange: function(){
				var hexValue = Color({h: _.id('colorHueRange').value, s: _.id('colorSaturationRange').value, l: _.id('colorLightRange').value}).hexString().substring(1).toLowerCase();
				updateData(hexValue);
				_.id('colorCode').value = hexValue;
				_.id('colorSaturationValue').value = _.id('colorSaturationRange').value;

				updateGradients.hue(Color('#'+data.hex).values.hsl);
				updateGradients.light(Color('#'+data.hex).values.hsl);
				updateTemplates();

			},

			onLightRangeChange: function(){
				var hexValue = Color({h: _.id('colorHueRange').value, s: _.id('colorSaturationRange').value, l: _.id('colorLightRange').value}).hexString().substring(1).toLowerCase();
				updateData(hexValue);
				_.id('colorCode').value = hexValue;
				_.id('colorLightValue').value = _.id('colorLightRange').value;


				updateGradients.hue(Color('#'+data.hex).values.hsl);
				updateGradients.saturation(Color('#'+data.hex).values.hsl);
				updateTemplates();

			},

			onNameChange: function(){
				data.name = _.id('colorName').value != "" ? _.id('colorName').value : initialName;
				updateTemplates();
			}
		}
	})();

	var paletteOptions = (function(){
		return {
			add: function(){
				palette.addColor(data);
				_.hide(_.id('addToPaletteButton'));
				_.show(_.id('removeButton'));
				data.index = 0;
			},
			remove: function(){
				palette.removeColor(data.index);
				_.hide(_.id('removeButton'));
				_.show(_.id('addToPaletteButton'));
			},
			setup: function(){
				_.hide(_.id('addToPaletteButton'));
				_.hide(_.id('removeButton'));
				if (subjectsCount === 1) {
					if(data.origin == "palette") {
						_.show(_.id('removeButton'));
					} else {
						_.show(_.id('addToPaletteButton'));
					}
				}
			},
		}
	})();

	return {
	  selectColor: function(event) {
		var attribute, clickedColor, colorTemplate, length;
		clickedColor = event.target;

		// prevents any empty color from being selected
		if (!clickedColor.classList.contains('color')) {
		  return;
		}

		if (clickedColor.id == "selectMix"){
			compareMode.exit();
			mixMode.exit();
		}

		// the attributes of the clicked color
		attribute = clickedColor.getAttribute.bind(clickedColor);
		data = {
		  name: attribute('data-name'),
		  hex: attribute('data-hex'),
		  rgb: attribute('data-rgb'),
		  hsl: attribute('data-hsl'),
		  checkContrast: checkContrastFunction,
		  mixed: attribute('data-mixed'),
		  origin: 'false',
		  id: null,
		};
		if(clickedColor.parentNode.id == "palette_colors"){
			data.index = _.getElIndex(clickedColor);
			data.origin = "palette";
			data.id = _.attr(clickedColor, 'data-id');
		}

		// if a color is clicked while holding the `alt` key
		if (color_previews.length > 0 && event.altKey || compareModeStatus == true || mixModeStatus == true) {

		  if (color_previews.length === 2) {
			_.remove(color_previews[+(!event.shiftKey)]);
		  }

		  // TODO: figure this out
		  data.firstHex = _.attr(color_previews[0], 'data-hex');
		  data.firstName = _.attr(color_previews[0], 'data-name');

		  // assigning subject1 and subject2 values to the common scope variables
		  subject1 = { name: data.firstName, hex: data.firstHex };
		  subject2 = { name: data.name, hex: data.hex };

		  // define the color template for two colors
		  colorTemplate = options.doubleTemplate;

		  subjectsCount = 2; // for correct visualization using CSS

		  editPanel.exit();
		} else {

		  while (color_previews.length-- > 0) {
			_.remove(color_previews[0]);
		  }

		  // define the color template for one color
		  colorTemplate = options.singleTemplate;

		  subjectsCount = 1; // for correct visualization using CSS`
		}

		// for correct visualization using CSS
		_.attr(color_subjects, 'data-subjects', subjectsCount);

		toggleMessage(true);

		_.template(options.previewTemplate, changePreview);
		mixPanel.setup();
		editPanel.setup();
		paletteOptions.setup();
		return _.template(colorTemplate, changeTests);

	  },
	  setup: function($options) {
		options = $options;
		color_previews = _.cls('color-preview');
		color_subjects = _.id('subjects');

		var selectColor = this.selectColor;

		_.listen(_.id('colors'), 'click', this.selectColor);
		_.listen(_.id('palette_colors'), 'click', this.selectColor);

		editPanel.exit();
		_.listen(_.id('subjects'), 'click', removeColor);
		_.listen(_.id('cancelMix'), 'click', mixPanel.exit);
		_.listen(_.id('mixButton'), 'click', mixPanel.init);
		_.listen(_.id('selectMix'), 'click', selectColor);
		_.listen(_.id('compareModeButton'), 'click', compareMode.init);
		_.listen(_.id('exitCompareModeButton'), 'click', compareMode.exit)
		_.listen(_.id('mixModeButton'), 'click', mixMode.init);
		_.listen(_.id('exitMixModeButton'), 'click', mixMode.exit);
		_.listen(_.id('editPanelButton'), 'click', editPanel.toggle);
		_.listen(_.id('exitEditPanelButton'), 'click', editPanel.exit);
		_.listen(_.id('addToPaletteButton'), 'click', paletteOptions.add);
		_.listen(_.id('removeButton'), 'click', paletteOptions.remove);
	  }
	};
  });

}).call(this);
