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

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {RepairBadge} from './repair-badge';
import {RepairBadgeHarness} from './test/repair-badge.harness';
import {ChatCoordinator} from '../../chat/chat-service/chat-coordinator';
import {CatalogManagement} from '../../storage/catalog-management/catalog-management';
import {Catalog} from '../../storage/models/catalog-storage.model';
import {StateSync} from '../../chat/state-sync/state-sync';
import {AppConfigProvider} from '../../settings/app-config-provider/app-config-provider';
import {LlmClient, LlmMessage, LlmStreamResponse} from '../../chat/llm-client/llm-client';

/**
 * Wraps a single raw LLM payload string as a completed stream, mirroring the
 * shape produced by the production transport facade.
 */
function streamOf(raw: string): LlmStreamResponse {
  const contentStream: AsyncIterable<string> = {
    [Symbol.asyncIterator]() {
      let done = false;
      return {
        async next(): Promise<IteratorResult<string>> {
          if (!done) {
            done = true;
            return {value: raw, done: false};
          }
          return {value: undefined, done: true};
        },
      };
    },
  };
  return {contentStream, complete: Promise.resolve(raw)};
}

class MockCatalogManagement {
  readonly activeCatalog = signal<Catalog | null>(null);
}

class MockAppConfigProvider {
  readonly rendererUrl = signal<string>('http://localhost:4200/preview');
}

class MockStateSync {
  commitLayoutFromLlm = vi.fn();
  flushDraft = vi.fn();
}

class MockLlmClient {
  raw = '';
  chatStream = vi.fn(
    async (_messages: LlmMessage[]): Promise<LlmStreamResponse> => streamOf(this.raw),
  );
}

/**
 * A catalog whose registered component names differ from the wrong names the
 * model is fed below, forcing the case-insensitive/synonym/fuzzy heal paths.
 */
const HEALING_CATALOG: Catalog = {
  catalogId: 'test',
  components: {
    TextField: {},
    CheckBox: {},
    DateTimeInput: {},
    Button: {},
  },
};

/**
 * A payload with four wrong component names, each resolvable to a distinct
 * catalog entry: synonym ("textbox"->TextField), case-insensitive
 * ("checkbox"->CheckBox), synonym ("datepicker"->DateTimeInput), and fuzzy
 * ("ButtonVariantGroup"->Button).
 */
const HEALABLE_PAYLOAD =
  '{"version": "v0.9", "createSurface": {"surfaceId": "s1", "catalogId": "test"}}\n' +
  '{"version": "v0.9", "updateComponents": {"surfaceId": "s1", "components": [' +
  '{"id": "c1", "component": "textbox"},' +
  '{"id": "c2", "component": "checkbox"},' +
  '{"id": "c3", "component": "datepicker"},' +
  '{"id": "c4", "component": "ButtonVariantGroup"}' +
  ']}}\n';

/** A payload whose component names already match the catalog exactly. */
const CLEAN_PAYLOAD =
  '{"version": "v0.9", "createSurface": {"surfaceId": "s1", "catalogId": "test"}}\n' +
  '{"version": "v0.9", "updateComponents": {"surfaceId": "s1", "components": [' +
  '{"id": "c1", "component": "TextField"},' +
  '{"id": "c2", "component": "CheckBox"}' +
  ']}}\n';

describe('RepairBadge surfacing silently-applied component-name heals', () => {
  let fixture: ComponentFixture<RepairBadge>;
  let harness: RepairBadgeHarness;
  let coordinator: ChatCoordinator;
  let catalogMock: MockCatalogManagement;
  let llmMock: MockLlmClient;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [RepairBadge],
      providers: [
        ChatCoordinator,
        {provide: CatalogManagement, useClass: MockCatalogManagement},
        {provide: AppConfigProvider, useClass: MockAppConfigProvider},
        {provide: StateSync, useClass: MockStateSync},
        {provide: LlmClient, useClass: MockLlmClient},
      ],
    }).compileComponents();

    coordinator = TestBed.inject(ChatCoordinator);
    catalogMock = TestBed.inject(CatalogManagement) as unknown as MockCatalogManagement;
    llmMock = TestBed.inject(LlmClient) as unknown as MockLlmClient;
    catalogMock.activeCatalog.set(HEALING_CATALOG);

    // Flush the coordinator's constructor rendererUrl tracking effect.
    TestBed.tick();

    fixture = TestBed.createComponent(RepairBadge);
    fixture.detectChanges();
    harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, RepairBadgeHarness);
  });

  it('stays hidden before any render occurs', async () => {
    expect(await harness.isVisible()).toBe(false);
  });

  it('surfaces the badge with the exact heal count when names are healed', async () => {
    llmMock.raw = HEALABLE_PAYLOAD;

    await coordinator.submitPrompt('Build a form');
    fixture.detectChanges();

    expect(await harness.isVisible()).toBe(true);
    expect(await harness.getCount()).toBe(4);
  });

  it('does not surface the badge for a clean payload with zero heals', async () => {
    llmMock.raw = CLEAN_PAYLOAD;

    await coordinator.submitPrompt('Build a clean form');
    fixture.detectChanges();

    expect(await harness.isVisible()).toBe(false);
    expect(await harness.getCount()).toBe(null);
  });

  it('clears the stale count when a subsequent clean render applies no heals', async () => {
    // First render heals four names and shows the badge.
    llmMock.raw = HEALABLE_PAYLOAD;
    await coordinator.submitPrompt('Build a form');
    fixture.detectChanges();
    expect(await harness.isVisible()).toBe(true);
    expect(await harness.getCount()).toBe(4);

    // Second render is clean; the prior count must not leak across surfaces.
    llmMock.raw = CLEAN_PAYLOAD;
    await coordinator.submitPrompt('Rebuild it cleanly');
    fixture.detectChanges();
    expect(await harness.isVisible()).toBe(false);
    expect(await harness.getCount()).toBe(null);
  });
});
