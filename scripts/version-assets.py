"""Give site-owned CSS and JS content-specific URLs after Quarto renders."""

import hashlib
from pathlib import Path
import re
from urllib.parse import urlsplit, urlunsplit


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ('styles/custom.css', 'assets/knowledge.js', 'assets/atlas.js')
ATTRIBUTE = re.compile(r'(?P<prefix>\b(?:href|src)=["\'])(?P<url>[^"\']+)(?P<quote>["\'])')


def version_assets(output):
    output = Path(output).resolve()
    versions = {}
    for relative in ASSETS:
        original = output / relative
        content = original.read_bytes()
        digest = hashlib.sha256(content).hexdigest()[:12]
        versioned = original.with_name(f'{original.stem}.{digest}{original.suffix}')
        if not versioned.exists() or versioned.read_bytes() != content:
            versioned.write_bytes(content)
        versions[relative] = versioned

    pages = list(output.rglob('*.html'))
    for page in pages:
        def replace(match):
            url = urlsplit(match['url'])
            if url.scheme or url.netloc:
                return match[0]
            target = output / url.path.lstrip('/') if url.path.startswith('/') else page.parent / url.path
            for relative, versioned in versions.items():
                original = output / relative
                # Also update a previously processed page during incremental renders.
                pattern = rf'{re.escape(original.stem)}(?:\.[a-f0-9]{{12}})?{re.escape(original.suffix)}'
                if target.parent.resolve() == original.parent and re.fullmatch(pattern, target.name):
                    path = url.path.rsplit('/', 1)
                    path[-1] = versioned.name
                    updated = urlunsplit(('', '', '/'.join(path), url.query, url.fragment))
                    return match['prefix'] + updated + match['quote']
            return match[0]

        content = page.read_text()
        updated = ATTRIBUTE.sub(replace, content)
        if updated != content:
            page.write_text(updated)
    return len(pages)


if __name__ == '__main__':
    count = version_assets(ROOT / '_site')
    print(f'Versioned {len(ASSETS)} site assets across {count} pages.')
