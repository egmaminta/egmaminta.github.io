# Emmanuel G. Maminta · Academic profile

Personal academic website at <https://egmaminta.github.io>, built with Jekyll and deployed to GitHub Pages. The custom layouts provide a consistent profile, publication list, writing archive, and article view. The Chirpy gem supplies the existing Jekyll plugins and feed.

## Local development

Use Ruby 3.3 and Bundler, matching the GitHub Actions workflow.

```sh
bundle install
bash tools/run.sh
```

Open <http://127.0.0.1:4000>. Restart the server after editing `_config.yml`.

### Inside a development container

From the repository root in the container terminal:

```sh
export BUNDLE_APP_CONFIG="$PWD/.bundle"
bundle config set --local path vendor/bundle
bundle install
bash tools/run.sh --host 0.0.0.0
```

Forward port **4000** and open <http://localhost:4000>. Port **35729** enables automatic browser refresh.

The container configuration sets writable paths for Bundler's configuration and installed gems, and forwards both ports. Its creation script installs the gems automatically. After changing `.devcontainer/devcontainer.json`, use **Dev Containers: Rebuild Container** to apply those defaults. The commands above also fix an existing container session without rebuilding.

If Bundler reports a permission error under `/usr/local/bundle`, rerun the `export` and `bundle config` commands above before installing. Both `.bundle/` and `vendor/` are ignored by Git.

## Updating content

- **Profile and research:** edit `index.html`.
- **News:** add entries to `_data/news.yml`, newest first. The first four are visible; the rest appear under “Earlier updates.” Use the actual announcement date when known.
- **Publications:** edit `_data/publications.yml`. Each entry supports `title`, `venue`, `context`, `authors` (Markdown), `url`, `badge`, `badge_url`, and a list of `links` with `label` and `url`. Add paper links for the ECCV and ACCV entries when available.
- **Writing:** add Markdown posts to `_posts/` using the existing front matter. The writing archive and homepage update automatically. Existing post URLs are preserved.
- **Preprints:** edit `_tabs/preprints.md`; PDFs live in `assets/preprints/`.
- **Certifications:** badge images are stored in `assets/img/certifications/` and displayed in `index.html`, with links to the public Credly verification pages.
- **Appearance:** `assets/css/academic.css` and `_layouts/`. The homepage uses a simple document layout, local assets, and UP maroon (`#7b1113`) for links. Posts with math or diagrams load MathJax or Mermaid as needed.
- **Metadata and social profiles:** edit `_config.yml` and the links in `_layouts/default.html` / `index.html`.

## Validation and deployment

```sh
bash tools/test.sh
```

This performs a production build and checks internal links, images, and scripts with HTML-Proofer. External destinations are excluded from this check.

Push to `main` or `master` to run the existing `.github/workflows/pages-deploy.yml` workflow. It builds, validates, and deploys the site to GitHub Pages. Local build output and installed dependencies are ignored by Git.

The layout supports narrow screens, keyboard navigation, reduced motion, and printing. The news archive and certification badges work without JavaScript.
