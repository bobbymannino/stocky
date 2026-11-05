<script lang="ts">
  import { companyColorVar, type CompanyColor } from "#lib/company-colors.js";
  import { cn } from "#lib/utils.js";

  let {
    color,
    class: className,
  }: { color: CompanyColor | undefined; class?: string } = $props();
</script>

<span
  aria-hidden="true"
  class={cn("inline-block size-2.5 shrink-0 rounded-full", className)}
  style:background-color={companyColorVar(color)}
></span>
