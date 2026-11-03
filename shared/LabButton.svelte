<!--
  The button the palette and type tools use when a site doesn't pass its
  own (their `button` prop). It has no look of its own: it renders the
  usual block markup, so a site's global .button styles apply, and a
  browser button otherwise.
-->
<script>
  /** @type {'button'|'submit'|'reset'} */
  export let type = 'button';
  /** @type {string} Passed on as data-variant (primary, secondary, ghost) */
  export let variant = 'primary';
</script>

<button {type} class="button" data-variant={variant} {...$$restProps}>
  <slot />
</button>
