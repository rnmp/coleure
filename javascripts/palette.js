define(['./goodies'], function (_) {
  const dropzone = _.id('palette')
  const paletteColors = _.id('palette_colors')
  const dropMessage = _.id('drop-message')
  let activePalette = undefined
  let colorOrigin = undefined

  function colorDrag(event) {
    const color = event.target
    colorOrigin = _.attr(color, 'data-origin')
    const data = {
      name: _.attr(color, 'data-name'),
      hex: _.attr(color, 'data-hex'),
      rgb: _.attr(color, 'data-rgb'),
      hsl: _.attr(color, 'data-hsl'),
      mixed: _.attr(color, 'data-mixed'),
    }
    event.dataTransfer.effectAllowed = 'copy'
    return event.dataTransfer.setData('text', JSON.stringify(data))
  }

  function colorOver(event) {
    event.preventDefault()
    return event.dataTransfer.dropEffect = 'copy'
  }

  function updateTitle() {
    editableText(_.id('activePalette'), activePalette.name, (newValue) => {
      const finalValue = newValue.trim()
      if (!finalValue) {
        return
      }
      const snapshot = getSnapshot()
      const existingPalette = snapshot.palettes.find(p => p.id === activePalette.id)
      existingPalette.name = finalValue
      commit(snapshot)
    })
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

  function addColor(data) {
    activePalette = activePalette || {
      id: crypto.randomUUID(),
      name: 'New Palette',
      colors: []
    }

    const newColor = {
      ...data,
      id: crypto.randomUUID(),
      palette_id: activePalette.id,
    }

    localStorage.setItem('currentPaletteId', activePalette.id)

    activePalette = {
      ...activePalette,
      colors: [
        newColor,
        ...(activePalette.colors || []),
      ]
    }

    const snapshot = getSnapshot()
    const existingPalette = snapshot.palettes.find(p => p.id === activePalette.id)
    if (existingPalette) {
      existingPalette.colors = activePalette.colors
    } else {
      snapshot.palettes.push(activePalette)
    }
    commit(snapshot)

    updateTitle()

    data.origin = 'palette'
    paletteColors.prepend(makeColor(data))
    _.attr(paletteColors.children.item(0), 'data-id', newColor.id)
    _.hide(dropMessage)
  }

  function colorDrop(event) {
    if (colorOrigin === 'palette') {
      return
    }
    event.preventDefault()
    const data = JSON.parse(event.dataTransfer.getData('text'))
    data.index = activePalette?.colors.length
    addColor(data)
  }

  function paletteColorDrag(event) {
    var index, paletteColor
    event.dataTransfer.effectAllowed = 'move'
    paletteColor = event.target
    colorOrigin = _.attr(paletteColor, 'data-origin')
    index = _.indexOf(paletteColor.parentNode.children, paletteColor)
    return event.dataTransfer.setData('text', index)
  }

  function paletteColorOver(event) {
    event.preventDefault()
    return event.dataTransfer.dropEffect = 'move'
  }

  function paletteColorDrop(event) {
    event.preventDefault()
    const index = event.dataTransfer.getData('text')
    if (colorOrigin == "palette") {
      removeColor(index)
    }
  }

  function removeColor(index) {
    if (!activePalette) {
      return
    }

    const snapshot = getSnapshot()
    const existingPalette = snapshot.palettes.find(p => p.id === activePalette.id)
    const activeColor = activePalette.colors[index]
    existingPalette.colors = existingPalette.colors.filter(c => c.id !== activeColor.id)
    activePalette.colors = existingPalette.colors
    commit(snapshot)

    const visualColor = paletteColors.children.item(index)
    visualColor.classList.add('deleted')


    setTimeout(() => {
      _.remove(visualColor)
      if (activePalette.colors.length == 0) {
        _.show(dropMessage)
      }
    }, 200)
  }

  function populateColors() {
    paletteColors.innerHTML = ''
    for (let ci = 0; ci < activePalette.colors.length; ci++) {
      color = activePalette.colors[ci]
      if (!color.mixed) {
        color.mixed = false
      }
      color.index = ci
      color.origin = "palette"
      paletteColors.append(makeColor(color))
    }
    if (paletteColors.children.length) {
      return _.hide(dropMessage)
    } else {
      return _.show(dropMessage)
    }
  }

  function makeColor(color) {
    const i = _.create('i')
    if (!color) {
      i.className = 'item empty-color'
      return i
    }

    i.draggable = true
    i.className = 'item color'
    i.dataset.name = color.name
    i.dataset.hex = color.hex
    i.dataset.rgb = color.rgb
    i.dataset.hsl = color.hsl
    i.dataset.id = color.id
    i.dataset.index = color.index
    i.dataset.mixed = color.mixed
    i.dataset.origin = color.origin
    i.style.background = `#${color.hex}`

    const name = _.create('span')
    name.className = 'name'
    i.append(name)

    if (color.mixed === true || color.mixed === 'true') {
      const mixMark = _.create('strong')
      mixMark.className = 'mix-mark'
      mixMark.textContent = 'M'
      name.append(mixMark)
    }

    name.append(color.name)

    return i
  }

  function editableText(node, text, save) {
    node.classList.toggle('editable-text', true)

    const input = _.create('input')
    input.value = text
    input.onblur = () => {
      if (input.value === text) {
        return
      }
      save(input.value)
    }
    input.onkeydown = (event) => {
      if (event.key === 'Enter') {
        input.blur()
      }
    }

    node.replaceChildren(input)

    return node
  }


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
    populateColors()
    updateTitle()
  }

  return {
    addColor: addColor,
    removeColor: removeColor,
    setup: function () {
      _.listen(dropzone, 'dragenter', colorOver)
      _.listen(dropzone, 'dragover', colorOver)
      _.listen(dropzone, 'drop', colorDrop)

      _.listen(_.id('colors'), 'dragstart', colorDrag)
      _.listen(_.id('subjects'), 'dragstart', colorDrag)

      _.listen(paletteColors, 'dragstart', paletteColorDrag)
      _.listen(_.id('colors'), 'dragenter', paletteColorOver)
      _.listen(_.id('colors'), 'dragover', paletteColorOver)
      _.listen(_.id('colors'), 'drop', paletteColorDrop)

      initializePalette()
    }
  }
})
