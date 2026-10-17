// Keep the diagrams in existing Markdown posts readable in the new layout.
if (window.mermaid) {
  const diagrams = [];
  document.querySelectorAll('code.language-mermaid').forEach((code) => {
    const diagram = document.createElement('div');
    diagram.className = 'mermaid';
    diagram.textContent = code.textContent;
    code.parentElement.replaceWith(diagram);
    diagrams.push(diagram);
  });
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'neutral' });
  mermaid.run({ nodes: diagrams }).catch(() => {});
}
