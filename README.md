# Nan Hu Academic Website

Personal academic website hosted with GitHub Pages:

https://nhu92.github.io

## Updating Content

Most public-facing content lives in data files:

- `data/site.json`: profile text, research areas, projects, news, CV highlights
- `data/publications.json`: publication list, DOI links, filters, selected homepage publications

The HTML files are intentionally light page shells. Update the JSON files first, then adjust HTML only when the page structure itself needs to change.

## Local Preview

From the repository root:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.
