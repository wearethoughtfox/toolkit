/*
  segue.js: the small bit of JS the Segue transitions can use. Optional:
  every transition works without it, but you get:

  - "backwards" on history back, so transitions that support it play
    in reverse when the user goes back between pages
  - --segue-x / --segue-y set to the last click, so pointer-origin
    transitions (Circle Pop) grow from where the user clicked, even
    across pages
  - window.segue(update, { back }) for same-page transitions, falling
    back to running the update with no animation where view transitions
    aren't supported

  Load it in <head> on every page as a plain, blocking script (no defer,
  no type="module") so it's listening before the first render:
  <script src="/segue.js"></script>
*/
(() => {
  const root = document.documentElement
  const KEY = 'segue:origin'

  const setOrigin = (x, y) => {
    root.style.setProperty('--segue-x', `${x}px`)
    root.style.setProperty('--segue-y', `${y}px`)
  }
  const remember = (x, y) => {
    setOrigin(x, y)
    try { sessionStorage.setItem(KEY, JSON.stringify([x, y])) } catch {}
  }

  addEventListener('pointerdown', (e) => remember(e.clientX, e.clientY), true)

  // Keyboard activation: grow from the middle of the focused control
  addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    const box = document.activeElement?.getBoundingClientRect?.()
    if (box?.width) remember(box.x + box.width / 2, box.y + box.height / 2)
  }, true)

  // Across pages: restore the click origin and tag the direction
  addEventListener('pagereveal', (e) => {
    if (!e.viewTransition) return
    try {
      const origin = JSON.parse(sessionStorage.getItem(KEY))
      if (origin) setOrigin(...origin)
      sessionStorage.removeItem(KEY)
    } catch {}
    const activation = window.navigation?.activation
    if (!activation?.from) return
    const back = activation.navigationType === 'traverse'
      && activation.entry.index < activation.from.index
    e.viewTransition.types.add(back ? 'backwards' : 'forwards')
  })

  // Same page: segue(() => swapContent(), { back: true })
  window.segue = (update, { back = false } = {}) => {
    if (!document.startViewTransition) {
      update()
      return
    }
    try {
      return document.startViewTransition({ update, types: [back ? 'backwards' : 'forwards'] })
    } catch {
      // Browsers with view transitions but without types
      return document.startViewTransition(update)
    }
  }
})()
