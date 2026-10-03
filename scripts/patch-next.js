const fs = require('fs');
const path = require('path');

const targetCjs = path.join(__dirname, '../node_modules/next/dist/next-devtools/userspace/app/segment-explorer-node.js');
const targetEsm = path.join(__dirname, '../node_modules/next/dist/esm/next-devtools/userspace/app/segment-explorer-node.js');

const cjsContent = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SegmentViewNode = function(props) { return props ? props.children : null; };
exports.SegmentViewStateNode = function() { return null; };
exports.SegmentBoundaryTriggerNode = function() { return null; };
exports.SegmentStateProvider = function(props) { return props ? props.children : null; };
exports.useSegmentState = function() { return { boundaryType: null, setBoundaryType: function() {} }; };
exports.SEGMENT_EXPLORER_SIMULATED_ERROR_MESSAGE = 'NEXT_DEVTOOLS_SIMULATED_ERROR';
`;

const esmContent = `export function SegmentViewNode(props) { return props ? props.children : null; }
export function SegmentViewStateNode() { return null; }
export function SegmentBoundaryTriggerNode() { return null; }
export function SegmentStateProvider(props) { return props ? props.children : null; }
export function useSegmentState() { return { boundaryType: null, setBoundaryType() {} }; }
export const SEGMENT_EXPLORER_SIMULATED_ERROR_MESSAGE = 'NEXT_DEVTOOLS_SIMULATED_ERROR';
`;

try {
  if (fs.existsSync(targetCjs)) {
    fs.writeFileSync(targetCjs, cjsContent, 'utf8');
    console.log('[patch-next] Patched Next.js CJS segment-explorer-node.js');
  }
  if (fs.existsSync(targetEsm)) {
    fs.writeFileSync(targetEsm, esmContent, 'utf8');
    console.log('[patch-next] Patched Next.js ESM segment-explorer-node.js');
  }

  // Ensure SegmentViewNode renders children in entry-base.js
  const entryBaseFiles = [
    path.join(__dirname, '../node_modules/next/dist/server/app-render/entry-base.js'),
    path.join(__dirname, '../node_modules/next/dist/esm/server/app-render/entry-base.js'),
  ];
  for (const file of entryBaseFiles) {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      content = content.replace(
        /let\s+SegmentViewNode\s*=\s*\(\)\s*=>\s*null;?/,
        'let SegmentViewNode = (props) => props ? props.children : null;'
      );
      if (content.includes("process.env.NODE_ENV === 'development'") && content.includes("segment-explorer-node")) {
        content = content.replace("if (process.env.NODE_ENV === 'development') {", "if (false) {");
      }
      fs.writeFileSync(file, content, 'utf8');
      console.log('[patch-next] Configured pass-through SegmentViewNode in', file);
    }
  }

  // Guard Set instantiation in export/worker.js to avoid prerender crash on non-iterable manifests
  const exportWorker = path.join(__dirname, '../node_modules/next/dist/export/worker.js');
  if (fs.existsSync(exportWorker)) {
    let content = fs.readFileSync(exportWorker, 'utf8');
    if (!content.includes('SetInterceptor')) {
      const needle = 'require("../server/node-environment");';
      const replacement = `require("../server/node-environment");
const OrigSet = globalThis.Set;
globalThis.Set = class SetInterceptor extends OrigSet {
  constructor(iterable) {
    if (iterable !== undefined && iterable !== null && typeof iterable[Symbol.iterator] !== 'function') {
      super();
      return;
    }
    super(iterable);
  }
};`;
      content = content.replace(needle, replacement);
      fs.writeFileSync(exportWorker, content, 'utf8');
      console.log('[patch-next] Added SetInterceptor to export/worker.js');
    }
  }

  // Patch load-manifest.external.js to safely provide fallback manifests
  const manifestFallback = `
function getSafeFallback(p) {
    if (p.includes('routes-manifest')) {
        return {
            version: 3,
            pages404: true,
            caseSensitive: false,
            basePath: '',
            redirects: [],
            headers: [],
            dynamicRoutes: [],
            staticRoutes: [],
            dataRoutes: [],
            rsc: {
                header: 'RSC',
                varyHeader: 'RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch',
                prefetchHeader: 'Next-Router-Prefetch',
                didPostponeHeader: 'x-nextjs-postponed',
                contentTypeHeader: 'text/x-component'
            },
            rewrites: {
                beforeFiles: [],
                afterFiles: [],
                fallback: []
            }
        };
    }
    if (p.includes('prerender-manifest')) {
        return {
            version: 4,
            routes: {},
            dynamicRoutes: {},
            preview: {
                previewModeId: 'development-preview-mode-id',
                previewModeSigningKey: 'development-preview-signing-key',
                previewModeEncryptionKey: 'development-preview-encryption-key'
            },
            notFoundRoutes: []
        };
    }
    if (p.includes('build-manifest')) {
        return {
            polyfillFiles: [],
            devFiles: [],
            ampDevFiles: [],
            lowPriorityFiles: [],
            rootMainFiles: [],
            pages: {
                "/_app": [],
                "/_error": []
            },
            ampFirstPages: []
        };
    }
    if (p.includes('app-build-manifest')) {
        return { pages: {} };
    }
    if (p.includes('server-reference-manifest')) {
        return { node: {}, edge: {} };
    }
    return {};
}
`;

  const cjsManifestLoader = path.join(__dirname, '../node_modules/next/dist/server/load-manifest.external.js');
  if (fs.existsSync(cjsManifestLoader)) {
    const cjsSource = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
0 && (module.exports = { clearManifestCache: null, evalManifest: null, loadManifest: null, loadManifestFromRelativePath: null });
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, { enumerable: true, get: all[name] });
}
_export(exports, {
    clearManifestCache: function() { return clearManifestCache; },
    evalManifest: function() { return evalManifest; },
    loadManifest: function() { return loadManifest; },
    loadManifestFromRelativePath: function() { return loadManifestFromRelativePath; }
});
const _path = require("path");
const _fs = require("fs");
const _vm = require("vm");
const _deepfreeze = require("../shared/lib/deep-freeze");
const sharedCache = new Map();
${manifestFallback}
function loadManifest(path, shouldCache = true, cache = sharedCache, skipParse = false) {
    const cached = shouldCache && cache.get(path);
    if (cached) {
        return cached;
    }
    let manifest;
    try {
        manifest = (0, _fs.readFileSync)(path, 'utf8');
    } catch (err) {
        if (err && err.code === 'ENOENT') {
            return getSafeFallback(path);
        }
        throw err;
    }
    if (!skipParse) {
        try {
            manifest = JSON.parse(manifest);
        } catch (_) {
            manifest = getSafeFallback(path);
        }
        if (shouldCache) {
            manifest = (0, _deepfreeze.deepFreeze)(manifest);
        }
    }
    if (shouldCache) {
        cache.set(path, manifest);
    }
    return manifest;
}

function evalManifest(path, shouldCache = true, cache = sharedCache) {
    const cached = shouldCache && cache.get(path);
    if (cached) {
        return cached;
    }
    let content;
    try {
        content = (0, _fs.readFileSync)(path, 'utf8');
    } catch (err) {
        if (err && err.code === 'ENOENT') {
            return {};
        }
        throw err;
    }
    if (!content || content.length === 0) {
        return {};
    }
    let contextObject = {};
    try {
        (0, _vm.runInNewContext)(content, contextObject);
    } catch (_) {
        return {};
    }
    if (shouldCache) {
        contextObject = (0, _deepfreeze.deepFreeze)(contextObject);
    }
    if (shouldCache) {
        cache.set(path, contextObject);
    }
    return contextObject;
}

function loadManifestFromRelativePath({ projectDir, distDir, manifest, shouldCache, cache, skipParse, handleMissing, useEval }) {
    try {
        const manifestPath = (0, _path.join)(projectDir, distDir, manifest);
        if (useEval) {
            return evalManifest(manifestPath, shouldCache, cache);
        }
        return loadManifest(manifestPath, shouldCache, cache, skipParse);
    } catch (err) {
        if (handleMissing) {
            return {};
        }
        throw err;
    }
}

function clearManifestCache(path, cache = sharedCache) {
    return cache.delete(path);
}
`;
    fs.writeFileSync(cjsManifestLoader, cjsSource, 'utf8');
    console.log('[patch-next] Replaced CJS load-manifest.external.js with safe fallback version');
  }

  const esmManifestLoader = path.join(__dirname, '../node_modules/next/dist/esm/server/load-manifest.external.js');
  if (fs.existsSync(esmManifestLoader)) {
    const esmSource = `import { join } from 'path';
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';
import { deepFreeze } from '../shared/lib/deep-freeze';

const sharedCache = new Map();
${manifestFallback}
export function loadManifest(path, shouldCache = true, cache = sharedCache, skipParse = false) {
    const cached = shouldCache && cache.get(path);
    if (cached) {
        return cached;
    }
    let manifest;
    try {
        manifest = readFileSync(path, 'utf8');
    } catch (err) {
        if (err && err.code === 'ENOENT') {
            return getSafeFallback(path);
        }
        throw err;
    }
    if (!skipParse) {
        try {
            manifest = JSON.parse(manifest);
        } catch (_) {
            manifest = getSafeFallback(path);
        }
        if (shouldCache) {
            manifest = deepFreeze(manifest);
        }
    }
    if (shouldCache) {
        cache.set(path, manifest);
    }
    return manifest;
}

export function evalManifest(path, shouldCache = true, cache = sharedCache) {
    const cached = shouldCache && cache.get(path);
    if (cached) {
        return cached;
    }
    let content;
    try {
        content = readFileSync(path, 'utf8');
    } catch (err) {
        if (err && err.code === 'ENOENT') {
            return {};
        }
        throw err;
    }
    if (!content || content.length === 0) {
        return {};
    }
    let contextObject = {};
    try {
        runInNewContext(content, contextObject);
    } catch (_) {
        return {};
    }
    if (shouldCache) {
        contextObject = deepFreeze(contextObject);
    }
    if (shouldCache) {
        cache.set(path, contextObject);
    }
    return contextObject;
}

export function loadManifestFromRelativePath({ projectDir, distDir, manifest, shouldCache, cache, skipParse, handleMissing, useEval }) {
    try {
        const manifestPath = join(projectDir, distDir, manifest);
        if (useEval) {
            return evalManifest(manifestPath, shouldCache, cache);
        }
        return loadManifest(manifestPath, shouldCache, cache, skipParse);
    } catch (err) {
        if (handleMissing) {
            return {};
        }
        throw err;
    }
}

export function clearManifestCache(path, cache = sharedCache) {
    return cache.delete(path);
}
`;
    fs.writeFileSync(esmManifestLoader, esmSource, 'utf8');
    console.log('[patch-next] Replaced ESM load-manifest.external.js with safe fallback version');
  }
} catch (err) {
  console.warn('[patch-next] Warning:', err.message);
}
