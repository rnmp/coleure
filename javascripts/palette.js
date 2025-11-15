define(['./goodies', './inspector'], function (_, inspector) {
  let colorData = { palettes: [] }
  try {
    const parsedColorData = JSON.parse(localStorage.getItem('coleure'))
    if (parsedColorData) {
      colorData = parsedColorData
    }
  } catch (e) {
  }

  let undos = []
  let redos = []

  function getHistoryCounts() {
    return { undos: undos.length, redos: redos.length }
  }

  function undo() {
    if (undos.length === 0) {
      return
    }
    const snapshot = undos.pop()
    commit(snapshot, { undoing: true })
  }

  function redo() {
    if (redos.length === 0) {
      return
    }
    const snapshot = redos.pop()
    commit(snapshot)
  }

  function getSnapshot() {
    return JSON.parse(JSON.stringify(colorData))
  }

  function commit(newData, opts = {}) {
    if (opts.undoing) {
      redos.push(colorData)
    } else {
      undos.push(colorData)
      redos = []
    }

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
    if (dragSession.draggingColor) {
      return event.dataTransfer.dropEffect = 'move'

    }
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

  let dragSession = {}

  function paletteColorDrag(event) {
    event.dataTransfer.effectAllowed = 'move'
    const paletteColor = event.target
    paletteColor.style.opacity = '0'

    const parent = Array.from(paletteColors.children)
    const draggingIndex = parent.indexOf(paletteColor)

    // Capture regions before any transforms
    dragSession.regions = parent.map((el, i) => ({
      index: i,
      rect: el.getBoundingClientRect(),
      element: el
    }))
    dragSession.draggingColor = paletteColor
    dragSession.draggingIndex = draggingIndex
    dragSession.insertionIndex = draggingIndex

    colorOrigin = paletteColor.dataset.origin
    return event.dataTransfer.setData('text', draggingIndex)
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
    const activePaletteId = getActivePaletteId()

    const paletteStrip = _.create('article')
    paletteStrip.style.paddingTop = '8px'
    paletteStrip.style.paddingBottom = '12px'
    paletteStrip.style.paddingLeft = '20px'

    if (palette.id === activePaletteId) {
      paletteStrip.style.background = '#323232'
    }

    const actionBar = _.create('header')
    actionBar.style.display = 'flex'
    actionBar.style.justifyContent = 'space-between'
    actionBar.style.alignItems = 'center'
    paletteStrip.append(actionBar)

    const paletteTitle = _.create('h1')
    paletteTitle.textContent = palette.name
    actionBar.append(paletteTitle)

    const deleteButton = _.create('button')
    deleteButton.className = 'button secondary close'
    deleteButton.style.padding = '0'
    deleteButton.style.fontWeight = '400'
    const span = _.create('span')
    span.textContent = '×'
    deleteButton.append(span)
    deleteButton.onclick = () => {
      removePalette(palette)
    }
    actionBar.append(deleteButton)

    const colors = _.create('div')
    colors.style.display = 'grid'
    colors.style.gridAutoFlow = 'column'
    colors.style.height = '48px'
    colors.style.background = '#444'

    for (const color of palette.colors) {
      colors.append(makeColor(color))
    }
    paletteStrip.append(colors)

    paletteStrip.onclick = () => {
      if (activePaletteId === palette.id) {
        return
      }
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

    const palettesHeader = _.create('header')
    palettesHeader.style.padding = '0 20px 8px'
    palettesHeader.style.display = 'flex'
    palettesHeader.style.justifyContent = 'space-between'
    palettesContainer.append(palettesHeader)

    const palettesTitle = _.create('h1')
    palettesTitle.textContent = 'Palettes'
    palettesTitle.style.fontSize = '1.5rem'
    palettesHeader.append(palettesTitle)

    const newPalette = _.create('button')
    newPalette.textContent = 'New'
    newPalette.className = 'button tertiary'
    newPalette.onclick = () => {
      setActivePaletteId('')
      populateColors()
      populatePalettes()
      updateTitle()
    }
    palettesHeader.append(newPalette)

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
      _.listen(paletteColors, 'dragover', (e) => {
        e.preventDefault()
        if (!dragSession.regions) return

        // Find insertion index based on mouse Y position
        let newInsertionIndex = dragSession.regions.length
        for (let i = 0; i < dragSession.regions.length; i++) {
          const region = dragSession.regions[i]
          const midpoint = region.rect.top + region.rect.height / 2
          if (e.clientY < midpoint) {
            newInsertionIndex = i
            break
          }
        }

        // Only recalculate if insertion point changed
        if (newInsertionIndex === dragSession.insertionIndex) return
        dragSession.insertionIndex = newInsertionIndex

        // Recalculate all transforms
        dragSession.regions.forEach(({ index, element, rect }) => {
          if (index === dragSession.draggingIndex) return

          const shiftAmount = rect.height + 20
          let shouldShift = false

          if (dragSession.draggingIndex < dragSession.insertionIndex) {
            // Dragging downward: shift elements between original and insertion up
            shouldShift = index >= dragSession.draggingIndex && index < dragSession.insertionIndex
          } else {
            // Dragging upward: shift elements between insertion and original down
            shouldShift = index < dragSession.draggingIndex && index >= dragSession.insertionIndex
          }

          element.style.transform = shouldShift
            ? `translateY(${dragSession.draggingIndex < dragSession.insertionIndex ? -shiftAmount : shiftAmount}px)`
            : ''
        })
      })
      _.listen(paletteColors, 'drop', (e) => {
        e.preventDefault()

        // Reorder the palette colors if insertion point changed
        if (dragSession.insertionIndex !== undefined && dragSession.insertionIndex !== dragSession.draggingIndex) {
          const activePalette = getActivePalette()
          if (activePalette) {
            const snapshot = getSnapshot()
            const existingPalette = snapshot.palettes.find(p => p.id === activePalette.id)

            // Remove from old position
            const [movedColor] = existingPalette.colors.splice(dragSession.draggingIndex, 1)

            // Insert at new position (adjust if moving down)
            const adjustedIndex = dragSession.insertionIndex > dragSession.draggingIndex
              ? dragSession.insertionIndex - 1
              : dragSession.insertionIndex
            existingPalette.colors.splice(adjustedIndex, 0, movedColor)

            commit(snapshot)
            // Reset all transforms
            if (dragSession.regions) {
              dragSession.regions.forEach(({ element }) => {
                element.style.transition = 'none'
                element.style.transform = ''
              })
            }

            // Rearrange DOM elements instead of repopulating
            const children = Array.from(paletteColors.children)
            if (adjustedIndex >= children.length) {
              paletteColors.appendChild(dragSession.draggingColor)
            } else {
              if (dragSession.insertionIndex > dragSession.draggingIndex) {
                children[adjustedIndex].after(dragSession.draggingColor)
              } else {
                children[adjustedIndex].before(dragSession.draggingColor)
              }
            }
            populatePalettes()
          }
        }
      })

      _.listen(paletteColors, 'dragend', (e) => {
        e.preventDefault()
        if (dragSession.regions) {
          dragSession.regions.forEach(({ element }) => {
            element.style.transform = ''
            element.style.removeProperty('transition')
          })
        }

        if (dragSession.draggingColor) {
          dragSession.draggingColor.style.opacity = '1'
        }
        dragSession = {}
      })
      _.listen(_.id('colors'), 'dragenter', paletteColorOver)
      _.listen(_.id('colors'), 'dragover', paletteColorOver)
      _.listen(_.id('colors'), 'drop', paletteColorDrop)

      _.id('panel_toggle').onclick = () => {
        _.id('app').classList.toggle('active-panels');
      }

      _.id('undo').onclick = () => {
        undo()
        populatePalettes()
        initializePalette()
      }
      _.id('redo').onclick = () => {
        redo()
        populatePalettes()
        initializePalette()
      }

      populatePalettes()
      initializePalette()
    }
  }
})
