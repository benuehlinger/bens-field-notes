#!/usr/bin/env python3
"""
Convert a draft notebook to a publishable post.

Usage:
    python scripts/publish-draft.py drafts/my-analysis.qmd

This script:
1. Removes draft-specific sections
2. Cleans up metadata for publication
3. Creates a new post in posts/ directory
4. Optionally runs the conversion process
"""

import argparse
import os
import re
from datetime import datetime
from pathlib import Path


def clean_draft_content(content):
    """Remove draft-specific sections and clean up content."""
    
    # Remove the draft disclaimer section
    content = re.sub(
        r'# Draft Notebook - Delete when publishing.*?\n(?=##|\n---|\Z)',
        '',
        content,
        flags=re.DOTALL | re.MULTILINE
    )
    
    # Remove analysis notes section
    content = re.sub(
        r'## Analysis Notes.*?\n(?=##|\n---|\Z)',
        '',
        content,
        flags=re.DOTALL | re.MULTILINE
    )
    
    # Remove next steps section  
    content = re.sub(
        r'## Next Steps.*?\n(?=##|\n---|\Z)',
        '',
        content,
        flags=re.DOTALL | re.MULTILINE
    )
    
    # Remove conversion notes section
    content = re.sub(
        r'## Conversion Notes for Publishing.*?\n(?=##|\n---|\Z)',
        '',
        content,
        flags=re.DOTALL | re.MULTILINE
    )
    
    # Clean up excessive whitespace
    content = re.sub(r'\n{3,}', '\n\n', content)
    
    return content.strip()


def update_metadata(content, title_suffix=""):
    """Update YAML front matter for publication."""
    
    # Extract existing YAML front matter
    yaml_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not yaml_match:
        return content
    
    yaml_content = yaml_match.group(1)
    rest_content = content[yaml_match.end():]
    
    # Update title to remove "Draft:" prefix
    yaml_content = re.sub(r'title:\s*["\']?Draft:\s*([^"\'\n]+)["\']?', 
                         r'title: "\1' + title_suffix + '"', 
                         yaml_content)
    
    # Add publication date
    today = datetime.now().strftime('%Y-%m-%d')
    if 'date:' not in yaml_content:
        yaml_content += f'\ndate: {today}'
    
    # Update format for publication
    yaml_content = re.sub(
        r'format:\s*\n\s*html:.*?(?=\n\w|\n---|\Z)',
        '',
        yaml_content,
        flags=re.DOTALL
    )
    
    # Add categories and type if missing
    if 'categories:' not in yaml_content:
        yaml_content += '\ncategories: [analysis]'
    
    if 'type:' not in yaml_content:
        yaml_content += '\ntype: analysis'
    
    return f"---\n{yaml_content.strip()}\n---{rest_content}"


def main():
    parser = argparse.ArgumentParser(description='Convert draft notebook to publishable post')
    parser.add_argument('draft_path', help='Path to draft file (e.g., drafts/my-analysis.qmd)')
    parser.add_argument('--title-suffix', default='', help='Suffix to add to title')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be done without creating files')
    
    args = parser.parse_args()
    
    draft_path = Path(args.draft_path)
    if not draft_path.exists():
        print(f"Error: Draft file {draft_path} does not exist")
        return 1
    
    # Read the draft content
    with open(draft_path, 'r') as f:
        content = f.read()
    
    # Clean and update content
    cleaned_content = clean_draft_content(content)
    final_content = update_metadata(cleaned_content, args.title_suffix)
    
    # Generate post path
    today = datetime.now().strftime('%Y-%m-%d')
    stem = draft_path.stem
    post_dir = Path('posts') / f"{today}-{stem}"
    post_file = post_dir / 'index.qmd'
    
    if args.dry_run:
        print(f"Would create: {post_file}")
        print("\nCleaned content preview:")
        print("=" * 50)
        print(final_content[:500] + "..." if len(final_content) > 500 else final_content)
        return 0
    
    # Create the post
    post_dir.mkdir(parents=True, exist_ok=True)
    
    with open(post_file, 'w') as f:
        f.write(final_content)
    
    print(f"✅ Created publishable post: {post_file}")
    print(f"📝 You can now review and edit: {post_file}")
    print(f"🚀 When ready, render with: quarto render {post_file}")
    
    return 0


if __name__ == '__main__':
    exit(main())