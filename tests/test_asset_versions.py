import hashlib
import importlib.util
from pathlib import Path
import tempfile
import unittest


spec = importlib.util.spec_from_file_location(
    'version_assets', Path(__file__).resolve().parents[1] / 'scripts/version-assets.py')
assets = importlib.util.module_from_spec(spec)
spec.loader.exec_module(assets)


class AssetVersionsTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.output = Path(self.directory.name)
        for relative in assets.ASSETS:
            path = self.output / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(f'Content of {relative}')
        self.page = self.output / 'ai-engineering/topics/example.html'
        self.page.parent.mkdir(parents=True)

    def test_pages_request_the_exact_asset_content_they_were_built_with(self):
        self.page.write_text('''<link href="../../styles/custom.css" rel="stylesheet">
<script src="/assets/atlas.js"></script><script src='../../assets/knowledge.js'></script>
<link href="https://example.org/styles/custom.css">''')
        assets.version_assets(self.output)
        html = self.page.read_text()
        for relative in assets.ASSETS:
            source = self.output / relative
            digest = hashlib.sha256(source.read_bytes()).hexdigest()[:12]
            name = f'{source.stem}.{digest}{source.suffix}'
            self.assertIn(name, html)
            self.assertEqual(source.with_name(name).read_bytes(), source.read_bytes())
        self.assertIn('href="https://example.org/styles/custom.css"', html)

    def test_a_css_update_changes_the_url_for_returning_visitors(self):
        self.page.write_text('<link href="../../styles/custom.css?theme=light#top">')
        assets.version_assets(self.output)
        previous = self.page.read_text()
        previous_asset = self.output / 'styles' / previous.split('/')[-1].split('?')[0]
        (self.output / 'styles/custom.css').write_text('New layout and colors')
        assets.version_assets(self.output)
        self.assertNotEqual(self.page.read_text(), previous)
        self.assertIn('?theme=light#top', self.page.read_text())
        self.assertTrue(previous_asset.exists())

    def test_repeated_runs_keep_urls_and_files_stable(self):
        self.page.write_text('<script src="../../assets/atlas.js"></script>')
        assets.version_assets(self.output)
        html = self.page.read_text()
        files = sorted(str(path) for path in self.output.rglob('*'))
        assets.version_assets(self.output)
        self.assertEqual(self.page.read_text(), html)
        self.assertEqual(sorted(str(path) for path in self.output.rglob('*')), files)


if __name__ == '__main__':
    unittest.main()
