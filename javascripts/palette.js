define(['./goodies'], function (_) {
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

  function getActivePaletteId() {
    return localStorage.getItem('activePaletteId')
  }

  function setActivePaletteId(id) {
    return localStorage.setItem('activePaletteId', id)
  }

  function getActivePalette() {
    const activePaletteId = getActivePaletteId()
    if (!activePaletteId) {
      return
    }
    const snapshot = getSnapshot()
    return snapshot.palettes.find(p => p.id === activePaletteId)
  }

  const dropzone = _.id('palette')
  const paletteColors = _.id('palette_colors')
  const dropMessage = _.id('drop-message')
  let colorOrigin = undefined

  function colorDrag(event) {
    const color = event.target
    colorOrigin = color.dataset.origin
    const data = {
      name: color.dataset.name,
      hex: color.dataset.hex,
      rgb: color.dataset.rgb,
      hsl: color.dataset.hsl,
      mixed: color.dataset.mixed,
    }
    event.dataTransfer.effectAllowed = 'copy'
    return event.dataTransfer.setData('text', JSON.stringify(data))
  }

  function colorOver(event) {
    event.preventDefault()
    return event.dataTransfer.dropEffect = 'copy'
  }

  function updateTitle() {
    const activePalette = getActivePalette()
    if (!activePalette) {
      _.id('activePalette').textContent = 'New'
      return
    }

    editableText(_.id('activePalette'), activePalette.name, (newValue) => {
      const finalValue = newValue.trim()
      if (!finalValue) {
        return
      }
      const snapshot = getSnapshot()
      const existingPalette = snapshot.palettes.find(p => p.id === activePalette.id)
      existingPalette.name = finalValue
      commit(snapshot)
      populatePalettes()
    })
  }


  function addColor(data) {
    const newColor = {
      ...data,
      id: crypto.randomUUID(),
    }

    const snapshot = getSnapshot()
    const activePaletteId = getActivePaletteId()
    const existingPalette = snapshot.palettes.find(p => p.id === activePaletteId)
    if (existingPalette) {
      existingPalette.colors = [newColor, ...(existingPalette.colors || [])]
    } else {
      const counter = localStorage.getItem('paletteNameCounter') || '1'
      const newPaletteId = crypto.randomUUID()
      snapshot.palettes.push({
        id: newPaletteId,
        name: `No. ${counter}`,
        colors: [newColor]
      })
      localStorage.setItem('paletteNameCounter', JSON.stringify(parseInt(counter) + 1))
      setActivePaletteId(newPaletteId)
    }

    commit(snapshot)
    populatePalettes()

    updateTitle()

    data.origin = 'palette'
    paletteColors.prepend(makeColor(data))
    paletteColors.children.item(0).dataset.id = newColor.id
    _.hide(dropMessage)
  }

  function colorDrop(event) {
    if (colorOrigin === 'palette') {
      return
    }
    event.preventDefault()
    const data = JSON.parse(event.dataTransfer.getData('text'))
    const activePalette = getActivePalette()
    if (activePalette) {
      data.index = activePalette.colors.length
    }
    addColor(data)
  }

  function paletteColorDrag(event) {
    var index, paletteColor
    event.dataTransfer.effectAllowed = 'move'
    paletteColor = event.target
    colorOrigin = paletteColor.dataset.origin
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
    const activePalette = getActivePalette()
    if (!activePalette) {
      return
    }

    const snapshot = getSnapshot()
    const existingPalette = snapshot.palettes.find(p => p.id === activePalette.id)
    const activeColor = activePalette.colors[index]
    existingPalette.colors = existingPalette.colors.filter(c => c.id !== activeColor.id)
    activePalette.colors = existingPalette.colors
    commit(snapshot)
    populatePalettes()

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

    const activePalette = getActivePalette()
    if (activePalette) {
      for (let ci = 0; ci < activePalette.colors.length; ci++) {
        color = activePalette.colors[ci]
        if (!color.mixed) {
          color.mixed = false
        }
        color.index = ci
        color.origin = "palette"
        paletteColors.append(makeColor(color))
      }
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

  function removePalette(palette) {
    const snapshot = getSnapshot()
    snapshot.palettes = snapshot.palettes.filter(p => p.id !== palette.id)
    commit(snapshot)

    populateColors()
    populatePalettes()
    updateTitle()
  }

  function makePaletteStrip(palette) {
    const paletteStrip = _.create('article')
    paletteStrip.style.paddingTop = '16px'

    const actionBar = _.create('header')
    actionBar.style.display = 'flex'
    actionBar.style.justifyContent = 'space-between'
    paletteStrip.append(actionBar)

    const paletteTitle = _.create('h1')
    paletteTitle.textContent = palette.name
    actionBar.append(paletteTitle)

    const deleteButton = _.create('button')
    deleteButton.className = 'secondary'
    deleteButton.textContent = '×'
    deleteButton.onclick = () => {
      removePalette(palette)
    }
    actionBar.append(deleteButton)

    const colors = _.create('div')
    colors.style.display = 'grid'
    colors.style.gridAutoFlow = 'column'
    colors.style.height = '48px'

    for (const color of palette.colors) {
      colors.append(makeColor(color))
    }
    paletteStrip.append(colors)

    paletteStrip.onclick = () => {
      setActivePaletteId(palette.id)
      populateColors()
      populatePalettes()
      updateTitle()
    }

    return paletteStrip
  }


  function populatePalettes() {
    const palettesContainer = _.id('palettes')
    palettesContainer.innerHTML = ''

    const newPalette = _.create('button')
    newPalette.textContent = 'New palette'
    newPalette.onclick = () => {
      setActivePaletteId('')
      populateColors()
      updateTitle()
    }
    palettesContainer.append(newPalette)


    const palettes = getSnapshot().palettes

    for (const palette of palettes) {
      const paletteStrip = makePaletteStrip(palette)
      palettesContainer.append(paletteStrip)
    }
  }

  function initializePalette() {
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

      populatePalettes()
      initializePalette()
    }
  }
})
