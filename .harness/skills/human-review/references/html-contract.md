# Human Review HTML Contract

## Required document shell

Generate a self-contained semantic shell with these placeholders in exactly these locations:

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Change human review</title>
  <!-- INJECT:css -->
</head>
<body>
  <!-- generated review content -->
  <!-- INJECT:artifacts -->
  <!-- INJECT:js -->
</body>
</html>
```

Do not add a `<style>` block or custom CSS classes. Shared assets are injected by DevKeel. Escape all
artifact-derived HTML text. Mermaid source belongs in `<pre class="mermaid">`.

## Result sections

Only render sections supported by available artifacts. Use this ordering when present:

1. `.page-header > .wrapper`: change name, one-sentence outcome, schema/progress metadata.
2. `.dashboard`: impact Mermaid when useful plus a `.dashboard-grid` of `.dash-card` risk, scope,
   task, and verification summaries.
3. `.section` blocks for requirement/scope, design/decisions, specs/contracts, tasks, verification,
   retrospective, and open decisions. Omit unavailable sections instead of showing placeholders.
4. `.acceptance`: human and automated acceptance items supported by the artifacts.
5. Artifact viewer, always present and initially collapsed.

Each ordinary section uses:

```html
<div class="section" id="s-purpose">
  <div class="section-head" onclick="toggleSection(this)">
    <span class="section-num">01</span><h2>Title</h2>
    <svg class="collapse-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
  </div>
  <div class="section-body">...</div>
</div>
```

Tasks may use `.task-list`; unresolved decisions may use `.pending-item`; diagrams each use their own
`.architecture-diagram-container`. Do not add interactive checkboxes that imply changes will be
written back to artifacts.

## Artifact viewer

Use this exact behavioral structure. `inject-review` discovers all Markdown files and the shared JS
adds any tabs/panels omitted from the initial HTML.

```html
<div class="section collapsed" id="s-artifacts">
  <div class="section-head" onclick="toggleSection(this)">
    <span class="section-num">99</span><h2>Artifact 原文</h2>
    <svg class="collapse-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
  </div>
  <div class="section-body">
    <div class="artifact-viewer">
      <div class="artifact-tabs"></div>
    </div>
  </div>
</div>
```

Do not place `INJECT:artifacts` or `INJECT:js` inside a section. They must remain immediately before
`</body>` so reinjection stays idempotent.
