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

import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {StartupResolution} from '../../shell/startup-resolution/startup-resolution';
import {HostCommunication} from '../../shell/host-communication/host-communication';
import {ChatState} from '../../chat/chat-state/chat-state';
import {CatalogManagement} from '../../storage/catalog-management/catalog-management';
import {EmptyState} from '../../shared/ui/empty-state/empty-state';
import {StatusChip} from '../../shared/ui/status-chip/status-chip';
import {Button} from '../../shared/ui/button/button';
import {Feedback} from '../../shared/ui/feedback/feedback';

/** Lifecycle a preview surface can occupy while a renderer negotiates. */
type LoadState = 'empty' | 'loading' | 'ready' | 'error';

/**
 * Milliseconds a freshly mounted renderer iframe is given to complete its
 * catalog handshake before the preview is treated as failed. Acts as a
 * client-side backstop for the case where no discovery watchdog is armed
 * (e.g. an unreachable URL loaded directly on startup that never emits
 * RENDERER_READY), so the surface surfaces an error + retry instead of
 * hanging on a spinner forever.
 */
const LOAD_TIMEOUT_MS = 10_000;

/**
 * Orchestrates the secure, sandboxed iframe rendering the active preview target,
 * synchronizing layouts, data models, and diagnostic telemetry. Tracks an
 * explicit load lifecycle so every preview surface (workspace, galleries,
 * scenario player) shows a real loading state and, on handshake failure or
 * timeout, an actionable error state with a retry control rather than an
 * indefinite `[Loading root...]`.
 */
@Component({
  selector: 'a2ui-composer-rendered-frame',
  standalone: true,
  imports: [MatProgressSpinnerModule, EmptyState, StatusChip, Button],
  templateUrl: './rendered-frame.ng.html',
  styleUrl: './rendered-frame.scss',
})
export class RenderedFrame {
  private sanitizer = inject(DomSanitizer);
  private startupResolution = inject(StartupResolution);
  private hostCommunication = inject(HostCommunication);
  private chatState = inject(ChatState);
  private catalogManagement = inject(CatalogManagement);
  private feedback = inject(Feedback);

  /** Programmatic streams active locking Signal, mapping visual lock bounds. */
  protected readonly isLocked = this.chatState.isProgrammaticStreamActive;

  protected iframeRef = viewChild<ElementRef<HTMLIFrameElement>>('previewIframe');

  /** Bumped by {@link retry} to force a fresh iframe mount + handshake. */
  private readonly reloadNonce = signal(0);
  /** True once the load watchdog elapses without a resolved catalog. */
  private readonly loadTimedOut = signal(false);
  /** True when the iframe element itself reports a load failure. */
  private readonly iframeErrored = signal(false);

  protected safeRendererUrl = computed(() => {
    const currentUrl = this.startupResolution.resolvedUrl();
    if (!currentUrl) return null;

    try {
      // Fallback to empty string if globalThis.location is undefined (e.g., in Server-Side Rendering).
      const baseOrigin = globalThis.location?.origin || '';

      // Construct a URL object. Passing baseOrigin as the second argument ensures that
      // relative URLs (e.g., "/renderer") are parsed correctly relative to the current
      // domain. Absolute URLs will ignore this base parameter.
      const url = new URL(currentUrl, baseOrigin);

      // Append the parent origin as the 'origin' query parameter. The Boq backend is annotated
      // with @OriginCheckRequired(param = "origin"), which strictly validates this parameter
      // against a list of allowed internal domains (such as localhost.corp.google.com) to prevent
      // unauthorized cross-site framing.
      url.searchParams.set('origin', baseOrigin);

      return this.sanitizer.bypassSecurityTrustResourceUrl(url.toString());
    } catch (e) {
      console.error('Failed to parse renderer URL:', e);
      return null;
    }
  });

  /** Coarse lifecycle the template renders around. */
  protected readonly loadState = computed<LoadState>(() => {
    if (!this.safeRendererUrl()) return 'empty';
    if (this.catalogManagement.activeCatalog()) return 'ready';
    if (this.catalogManagement.catalogError() || this.loadTimedOut() || this.iframeErrored()) {
      return 'error';
    }
    return 'loading';
  });

  /** Human-readable reason shown in the error state. */
  protected readonly errorMessage = computed<string>(() => {
    const bridgeError = this.catalogManagement.catalogError();
    if (bridgeError) return bridgeError;
    if (this.iframeErrored()) {
      return 'The renderer failed to load. Check the renderer URL and try again.';
    }
    return 'The renderer did not respond in time. Confirm it is running, then retry.';
  });

  /** Prior load lifecycle, so the error toast fires once per failure, not per tick. */
  private previousLoadState: LoadState = 'empty';

  constructor() {
    // Surface a failed renderer switch/load through the shared feedback helper
    // the moment the surface enters its error state, complementing the inline
    // error+retry panel so a failure is never missed if the panel is offscreen.
    effect(() => {
      const state = this.loadState();
      if (state === 'error' && this.previousLoadState !== 'error') {
        untracked(() => this.feedback.error(this.errorMessage()));
      }
      this.previousLoadState = state;
    });

    effect(() => {
      const ref = this.iframeRef();
      if (typeof this.hostCommunication.registerIframeElement === 'function') {
        this.hostCommunication.registerIframeElement(ref?.nativeElement || null);
      }
      if (typeof this.hostCommunication.registerIframe === 'function') {
        this.hostCommunication.registerIframe(ref?.nativeElement?.contentWindow || null);
      }
    });

    // Arm a load watchdog whenever a renderer URL is (re)mounted. Re-runs on
    // URL changes and on explicit retries; the previous timer is torn down by
    // the cleanup callback so no stale timeout can fire against a fresh load.
    effect(onCleanup => {
      const hasUrl = this.safeRendererUrl() !== null;
      this.reloadNonce();
      // A new attempt starts clean; these writes do not feed this effect.
      this.loadTimedOut.set(false);
      this.iframeErrored.set(false);
      if (!hasUrl) return;

      const timerId = setTimeout(() => {
        untracked(() => {
          if (!this.catalogManagement.activeCatalog() && !this.catalogManagement.catalogError()) {
            this.loadTimedOut.set(true);
          }
        });
      }, LOAD_TIMEOUT_MS);
      onCleanup(() => clearTimeout(timerId));
    });
  }

  /** Marks a hard iframe load failure so the error state engages immediately. */
  protected onIframeError(): void {
    this.iframeErrored.set(true);
  }

  /**
   * Re-attempts the renderer handshake: clears the failed catalog state, resets
   * the local failure flags, and bumps the reload nonce so the iframe is torn
   * down and freshly mounted, restarting discovery and the load watchdog.
   */
  protected retry(): void {
    this.catalogManagement.prepareForRendererSwitch();
    this.loadTimedOut.set(false);
    this.iframeErrored.set(false);
    this.reloadNonce.update(n => n + 1);
  }
}
