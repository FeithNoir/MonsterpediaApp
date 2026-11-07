import { Component, computed, input } from '@angular/core';
import { marked } from 'marked';
@Component({
  selector: 'app-markdown',
  template: '<div class="markdown" [innerHTML]="html()"></div>',
})
export class MarkdownComponent {
  readonly content = input('');
  // Never bypass Angular's HTML sanitizer. Raw HTML is escaped before Markdown parsing.
  readonly html = computed(() =>
    marked.parse(this.content().replace(/</g, '&lt;'), { async: false }),
  );
}
