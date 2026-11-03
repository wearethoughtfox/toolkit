<script>
  // Colours come from the site's roles (--primary, --on-primary) when it has
  // them, otherwise the system colours, so the link is always readable.
  // Set --skip-link-bg and --skip-link-text to style it.
  export let href = '#main-content';
</script>

<a {href} class="skip-link visually-hidden visually-hidden--focusable">
  Skip to main content
</a>

<style>
  .skip-link {
    position: fixed;
    top: var(--space-s);
    left: var(--space-s);
    z-index: 999;
    background: var(--skip-link-bg, var(--primary, Canvas));
    color: var(--skip-link-text, var(--on-primary, CanvasText));
    padding: var(--space-xs) var(--space-s);
    border-radius: var(--radius-s, 0.2rem);
    font-weight: var(--font-bold);
    text-decoration: none;
  }
</style>
