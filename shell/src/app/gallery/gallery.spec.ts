/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {provideZonelessChangeDetection} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {describe, it, expect, beforeEach} from 'vitest';
import {A2uiRendererService} from '@a2ui/angular/v0_9';
import {Gallery} from './gallery';
import {GALLERY_WIDGETS} from './gallery-widgets.generated';

interface GalleryInternals {
  widgets: typeof GALLERY_WIDGETS;
}

describe('Gallery (masonry)', () => {
  let fixture: ComponentFixture<Gallery>;
  let component: GalleryInternals;
  let renderer: A2uiRendererService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Gallery],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    // Note: we intentionally do NOT call detectChanges(). Rendering the
    // surfaces instantiates the library BasicCatalog components, whose global
    // style injection reads document APIs that are unavailable under jsdom
    // (fine in a real browser — verified there). Surfaces are created in the
    // constructor's processMessages, so we assert against the model directly.
    fixture = TestBed.createComponent(Gallery);
    component = fixture.componentInstance as unknown as GalleryInternals;
    renderer = fixture.debugElement.injector.get(A2uiRendererService);
  });

  it('exposes every gallery widget', () => {
    expect(component.widgets.length).toBe(GALLERY_WIDGETS.length);
    expect(component.widgets.length).toBeGreaterThan(0);
  });

  it('builds a native surface for each widget', () => {
    for (const {widget} of GALLERY_WIDGETS) {
      expect(renderer.surfaceGroup.getSurface(widget.id)).toBeTruthy();
    }
  });

  it('every widget defines a non-empty tree with a root component', () => {
    for (const {widget} of GALLERY_WIDGETS) {
      expect(widget.components.length).toBeGreaterThan(0);
      expect(widget.components.some(c => c.id === widget.root)).toBe(true);
    }
  });
});
