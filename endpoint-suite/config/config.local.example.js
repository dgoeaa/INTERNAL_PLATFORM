/**
 * Customized Endpoints Management Suite (CEMS) — runtime configuration example.
 *
 * HOW TO USE (mirrors the convention already established in this repository's
 * own config/config.example.js — see that file for the platform's policy)
 * ----------------------------------------------------------------------
 * 1. Copy this file to  config/config.local.js  (that name is git-ignored by
 *    endpoint-suite/.gitignore — never rename it to something that isn't).
 * 2. In Power Automate, open each flow's "When an HTTP request is received"
 *    trigger, click "Get callback URL", and copy the freshly-rotated sig=
 *    value. Every signature that ever shipped in a downloadable artifact
 *    (registry/unified-registry.full.json, config/runtime.config.full.js,
 *    exports/private/*, or any earlier ECM2/ECM3/DGO-R12/R14 export) has been
 *    circulated outside Power Automate and MUST be treated as compromised —
 *    rotate it before this endpoint is used for anything real.
 * 3. Replace every ROTATE_ME token below with the rotated signature only;
 *    the base URL, workflow id, api-version, sp and sv parameters are not
 *    secrets and do not need to change unless the flow itself was rebuilt.
 * 4. Load this file from endpoint-suite/app/index.html via the "Load local
 *    config" file picker on the Overview tab (client-side FileReader only —
 *    nothing here is ever uploaded), or via
 *      <script src="config/config.local.js"></script>
 *    before endpoint-suite/app/index.html's own inline script runs.
 * 5. AUTH_LOGIN_START, ARCHIVE and WEB_SEND_EMAIL_UNSIGNED are recorded
 *    upstream with no sp/sv/sig at all (see registry audit.unsignedKeys).
 *    No signature was invented for them here; they will not authenticate
 *    until Power Automate issues one.
 *
 * ⚠️  SECURITY NOTICE
 * A signed Power Automate trigger URL is a bearer credential: whoever holds
 * the sig= value can invoke the flow with no further authentication. This
 * file, once you fill it in, is exactly as sensitive as a password file.
 * Never commit it, paste it into chat, or attach it to a ticket. Use the
 * redacted registry/exports in this package for anything that leaves your
 * machine.
 *
 * ⚠️  DIRECT OPERATION
 * The browser invokes these URLs directly — there is no proxy or broker.
 * Whatever is served this file can read the URLs in it, so each flow must
 * authenticate and authorise its own callers and validate its own input.
 */

window.CEMS_CONFIG = {
  release: "cems.unified.runtime/15",
  endpoints: {
    FETCH_ALL: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/31e02518075940d2bcfa9bdb0e9b0b8d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    FETCH_ACTIVITIES: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/37642ba3597f4cf58288cc71b5e6b519/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    REFERENCE_DATA: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/ff455c68e9ac493e858fb984bcfd01fb/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    GET_DOCS: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/818ec4053f1e4f0b87845114241d8b74/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    FETCH_EMAIL_ATTACHMENTS: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/20e6340941ce4b1bbb87b43c9102a777/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    SINGLE_ASSIGNMENT: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/f71397ff3ca145059dc8f78c04923e9f/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    BULK_ASSIGNMENT: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/1154b50e1d17420dadb3b012e7e2a02c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    BULK_ASSIGNMENT_DIRECT: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/7e71fffe770a45ccb93bf216bb53786e/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    DYNAMIC_ACTIONS: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/bc83d98acf474a088832d78f50085388/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    SUBSIDIARY_ACTIONS: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/85c556f10b8244ba9d839a2ebe240b91/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    EMAIL: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/2e37b6310842410eb15c4561f2b0c1eb/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    EMAIL_RELATED_TASK: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a942d230337c4ddfa9a386e92bbd048b/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    AI_EMAIL_ANALYSIS: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/fe794e0139784ac694768e5a716e0be7/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    AI_DOC_ANALYSIS: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/5b29edc84b5d4a8db3c885d8441aa977/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    AI_CHAT: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a13c8b577bd44f8787c50d095ea3faf9/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    OTP_GENERATE: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/314aaf27593147089b38322e5ca25936/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    OTP_VERIFY: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/43879c5165de439680055ab4258b3f27/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    SCAN_INTAKE: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/f771d509dfb648b0b21eeec0a36614fa/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    AUTH_LOGIN_START: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/80fab00617c84db5af989f985d0288a5/triggers/manual/paths/invoke?api-version=1", signed: false /* source record has no signature — see rejected[] / audit.unsignedKeys */ },
    SUBMISSION_ECM_DOCS_PORTAL: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/1041ed37ce924e3c886d891f23e8142c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    UPLOAD_ECM_DOCS_PORTAL: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/f771d509dfb648b0b21eeec0a36614fa/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    INTAKE_SUBMISSION: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/1ff7714c11a74fa4a876f8f6a79b64d2/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    EDTMS_NITDA_WRITE_API_INGESTION: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/471875bf903545eda4d10e8a6243d858/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    EDTMS_NITDA_READ_API_DASHBOARD_SYNC: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c1d8dba2fc84423891c6b78b0126278f/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    EDTMS_NITDA_UPDATE_TASK_RESOLUTION: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/84f062159fe9422eb0195c251ca285b8/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    ARCHIVE: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c2afaf028b50408995738b9e14c0662d/triggers/manual/paths/invoke?api-version=1", signed: false /* source record has no signature — see rejected[] / audit.unsignedKeys */ },
    DISPATCH_OUTBOUND: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/bc83d98acf474a088832d78f50085388/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    CORRESPONDENCE_EMAIL_SEND: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/7ee91bdefd3c449889d680c722a99d05/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    STATUS_UPDATE: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/3cea46a4f06748cb8a680ee1532d73cb/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    GET_EMAILS: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/3931e2ff995242b6b2c920c8b2209797/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    GET_LETTERS: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/f480ade951a1437c91604bee33279b0e/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    GET_USERS: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/607795813ee14d8abee6d1b4e8dd866b/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    GET_CATEGORIES: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/9df45c5086ea42f2ab2b6ee9afae3f29/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    GET_DEPARTMENTS: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/3c7094de10ce473e985e5cadcf66bc67/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    GET_CORRESPONDENCE: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/5729f50aa0fc4248be30ed4e9d7a7a4f/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    ATTENTION_ITEMS: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/4f733288d90e49a68d4d5715d9198d40/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    BULK_OPS_GET_DOCS: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/7995c1eb50d94d5daa2780e71391d874/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    API_GET: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/02a3a70f3dec4dcd9a85a244a60c65b9/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    ASSIGN_ITEM_DIRECT: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/5de1fc934e2944bb9cf9d9a0f9bd38e3/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    TASK_CREATED_RESPONDER: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/cae7796c721b47bc9aa95159eeb16081/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    EMAILS_COMPOSE_SELECT: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/6d78b1940f4447b8b31b49657fe9c19c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    GET_EMAILS_CONTROL_DECK: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/820c4a576cbb4a948d6a99dd85721e71/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    FETCH_ALL_STANDALONE: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/31e02518075940d2bcfa9bdb0e9b0b8d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    FETCH_ALL_MATRIX_02: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/4a250f97181b4a28abc1d0fb0f7d4c4d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    FETCH_ALL_MATRIX_03: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/2d576af599c0421eb37213634b85fc4b/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    FETCH_ALL_WITH_REFERENCES: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/1d56be97cd184fd9b2facede12b17c34/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    FETCH_ACTIVITIES_STANDALONE: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/85c556f10b8244ba9d839a2ebe240b91/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    REFERENCE_DATA_LINEAGE: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/d67f2acb3708449490eed561ee56efbe/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    SINGLE_ASSIGNMENT_DEPLOYED: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/6b3bad3005b44bf6bced0f8074d3f2ed/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    BULK_ASSIGNMENT_REGEN: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c43388639d14452faef4ca3042a95b23/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    EMAIL_DYNAMIC_ACTIONS_STANDALONE: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/bc83d98acf474a088832d78f50085388/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    AI_DOC_ANALYSIS_LINEAGE: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/20e3b003a57f47febae8a24ad5b9acd4/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    OTP_GENERATE_NO_PORT: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com/powerautomate/automations/direct/workflows/314aaf27593147089b38322e5ca25936/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    OTP_VERIFY_NO_PORT: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com/powerautomate/automations/direct/workflows/43879c5165de439680055ab4258b3f27/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },
    WEB_SEND_EMAIL_UNSIGNED: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/2e37b6310842410eb15c4561f2b0c1eb/triggers/manual/paths/invoke?api-version=1", signed: false /* source record has no signature — see rejected[] / audit.unsignedKeys */ },
    SINGLE_ASSIGNMENT_ALT_SIG: { url: "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/f71397ff3ca145059dc8f78c04923e9f/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ROTATE_ME", signed: true },  }
};
