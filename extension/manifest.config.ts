import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "MahaSetu - Fill Once, Apply Anywhere",
  version: "0.1.0",
  description: "Consent-first assistant for mock government portal form autofill.",
  permissions: ["storage", "activeTab", "scripting", "tabs"],
  host_permissions: ["<all_urls>"],
  action: {
    default_title: "MahaSetu",
    default_popup: "src/popup/index.html",
  },
  background: {
    service_worker: "src/background/serviceWorker.ts",
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content/contentScript.ts"],
      run_at: "document_idle",
    },
  ],
  icons: {
    "16": "icons/16.png",
    "48": "icons/48.png",
    "128": "icons/128.png",
  },
});
