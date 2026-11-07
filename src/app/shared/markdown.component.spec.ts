import { TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';
import { MarkdownComponent } from './markdown.component';
describe('public Markdown rendering', () => {
  it('keeps Markdown headings and blockquotes without enabling raw HTML', () => {
    TestBed.configureTestingModule({ imports: [MarkdownComponent] });
    const fixture = TestBed.createComponent(MarkdownComponent);
    fixture.componentRef.setInput(
      'content',
      '## Hallazgo\n\n> Una observación.\n\n<script>alert(1)</script>',
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h2').textContent).toBe(
      'Hallazgo',
    );
    expect(fixture.nativeElement.querySelector('blockquote')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('script')).toBeNull();
  });
});
