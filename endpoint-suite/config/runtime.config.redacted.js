window.CEMS_R14_REGISTRY = {
  "format": "cems.unified.runtime/14",
  "release": "R14-unified-production-runtime",
  "builtAt": "2026-08-19T20:49:09+00:00",
  "platform": "Customized Endpoints Management Suite",
  "buildId": "cems-r14-7af2adb6cfc88dfe",
  "sourceInputs": {
    "ecm2": {
      "release": "R13-production-contract-first",
      "keys": 56,
      "routes": 81,
      "files": 4
    },
    "ecm3": {
      "release": "R13-production-contract-first",
      "keys": 56,
      "routes": 81,
      "files": 23
    },
    "dgo_r12": {
      "release": "R12",
      "endpoints": 56,
      "flows": 47,
      "files": 5
    }
  },
  "contractFirst": {
    "requestEnvelope": [
      "action",
      "name",
      "userEmail",
      "runId",
      "dryRun",
      "validateOnly",
      "payload"
    ],
    "responseEnvelope": [
      "ok",
      "status",
      "request",
      "data",
      "errors",
      "meta",
      "timing"
    ],
    "routeDiscriminators": [
      "action",
      "name"
    ],
    "writeProbePolicy": "write probes require dryRun=true and validateOnly=true by default"
  },
  "security": {
    "signedUrlsAreBearerCredentials": true,
    "redactedReportsDefault": true,
    "rotateTriggerUrlsBeforeExternalDistribution": true,
    "fullSecretFilesLocation": "exports/private and registry/unified-registry.full.json"
  },
  "flows": [
    {
      "workflowId": "a13c8b577bd44f8787c50d095ea3faf9",
      "name": "AI chat",
      "group": "ai",
      "note": "Conversational endpoint.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a13c8b577bd44f8787c50d095ea3faf9/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "fe794e0139784ac694768e5a716e0be7",
      "name": "AI over email and task context",
      "group": "ai",
      "note": "AI_EMAIL_ANALYSIS.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/fe794e0139784ac694768e5a716e0be7/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "20e3b003a57f47febae8a24ad5b9acd4",
      "name": "AI_DOC_ANALYSIS (lineage snapshot)",
      "group": "ai",
      "note": "Second doc-analysis variant.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/20e3b003a57f47febae8a24ad5b9acd4/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "5b29edc84b5d4a8db3c885d8441aa977",
      "name": "Events processing \u2014 AI over event documents",
      "group": "ai",
      "note": "Primary AI_DOC_ANALYSIS.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/5b29edc84b5d4a8db3c885d8441aa977/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "c2afaf028b50408995738b9e14c0662d",
      "name": "ARCHIVE",
      "group": "archive",
      "note": "Archive flow. Supplied with no sp/sv/sig \u2014 needs Get callback URL in Power Automate.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c2afaf028b50408995738b9e14c0662d/triggers/manual/paths/invoke?api-version=1",
      "signed": false,
      "variants": []
    },
    {
      "workflowId": "80fab00617c84db5af989f985d0288a5",
      "name": "AUTH_LOGIN_START",
      "group": "auth",
      "note": "Login start. Supplied with no sp/sv/sig \u2014 needs Get callback URL in Power Automate.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/80fab00617c84db5af989f985d0288a5/triggers/manual/paths/invoke?api-version=1",
      "signed": false,
      "variants": []
    },
    {
      "workflowId": "314aaf27593147089b38322e5ca25936",
      "name": "OTP generate / send",
      "group": "auth",
      "note": "One-time passcode issue.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/314aaf27593147089b38322e5ca25936/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": [
        {
          "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com/powerautomate/automations/direct/workflows/314aaf27593147089b38322e5ca25936/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
          "why": "no-port host variant of the same trigger"
        }
      ]
    },
    {
      "workflowId": "43879c5165de439680055ab4258b3f27",
      "name": "OTP verify",
      "group": "auth",
      "note": "One-time passcode check.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/43879c5165de439680055ab4258b3f27/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": [
        {
          "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com/powerautomate/automations/direct/workflows/43879c5165de439680055ab4258b3f27/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
          "why": "no-port host variant of the same trigger"
        }
      ]
    },
    {
      "workflowId": "bc83d98acf474a088832d78f50085388",
      "name": "DYNAMIC GLOBAL ENDPOINT INTERFACE",
      "group": "dispatcher",
      "note": "Every governed write. Also documented as \u201cDynamic_Multi-Actions\u201d.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/bc83d98acf474a088832d78f50085388/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "85c556f10b8244ba9d839a2ebe240b91",
      "name": "SUPPLEMENTARY / SUBSIDIARY ACTIONS (multi-route)",
      "group": "dispatcher",
      "note": "Eighteen declared routes. Also documented as \u201cWeb - Subsidiary Doc Actions\u201d.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/85c556f10b8244ba9d839a2ebe240b91/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "c1d8dba2fc84423891c6b78b0126278f",
      "name": "EDTMS NITDA_Read_API (Central Registry Dashboard Sync)",
      "group": "edtms",
      "note": "Dashboard sync read API.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c1d8dba2fc84423891c6b78b0126278f/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "84f062159fe9422eb0195c251ca285b8",
      "name": "EDTMS NITDA_Update_Task (Resolution)",
      "group": "edtms",
      "note": "Task resolution update.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/84f062159fe9422eb0195c251ca285b8/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "471875bf903545eda4d10e8a6243d858",
      "name": "EDTMS NITDA_Write_API (Ingestion)",
      "group": "edtms",
      "note": "Registry ingestion write API.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/471875bf903545eda4d10e8a6243d858/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "2e37b6310842410eb15c4561f2b0c1eb",
      "name": "Send email notification",
      "group": "email",
      "note": "The manifest also carries this flow unsigned as \u201cWeb - Send Email\u201d; the signed form is authoritative.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/2e37b6310842410eb15c4561f2b0c1eb/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": [
        {
          "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/2e37b6310842410eb15c4561f2b0c1eb/triggers/manual/paths/invoke?api-version=1",
          "why": "unsigned form of the same trigger, carried by the manifest"
        }
      ]
    },
    {
      "workflowId": "7ee91bdefd3c449889d680c722a99d05",
      "name": "send-email variant",
      "group": "email",
      "note": "Second send-email endpoint.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/7ee91bdefd3c449889d680c722a99d05/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "1ff7714c11a74fa4a876f8f6a79b64d2",
      "name": "DOCUMENT SUBMISSION PORTAL",
      "group": "portal",
      "note": "Public intake submission.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/1ff7714c11a74fa4a876f8f6a79b64d2/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "1041ed37ce924e3c886d891f23e8142c",
      "name": "SUBMISSION_ECM_DOCS_PORTAL",
      "group": "portal",
      "note": "ECM document submission.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/1041ed37ce924e3c886d891f23e8142c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "f771d509dfb648b0b21eeec0a36614fa",
      "name": "UPLOAD_ECM_DOCS_PORTAL",
      "group": "portal",
      "note": "ECM document upload / scan deposit.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/f771d509dfb648b0b21eeec0a36614fa/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "1d56be97cd184fd9b2facede12b17c34",
      "name": "all data and references",
      "group": "read",
      "note": "Merges what REFERENCE_DATA fetches separately.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/1d56be97cd184fd9b2facede12b17c34/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "02a3a70f3dec4dcd9a85a244a60c65b9",
      "name": "API_GET (ACK build)",
      "group": "read",
      "note": "Generic getter from the ACK build.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/02a3a70f3dec4dcd9a85a244a60c65b9/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "7995c1eb50d94d5daa2780e71391d874",
      "name": "BULK OPS GET DOCS",
      "group": "read",
      "note": "Bulk document listing.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/7995c1eb50d94d5daa2780e71391d874/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "4f733288d90e49a68d4d5715d9198d40",
      "name": "DGO Attention Items",
      "group": "read",
      "note": "Attention queue.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/4f733288d90e49a68d4d5715d9198d40/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "6d78b1940f4447b8b31b49657fe9c19c",
      "name": "emails, compose-select response variant",
      "group": "read",
      "note": "Compose-select email variant.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/6d78b1940f4447b8b31b49657fe9c19c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "4a250f97181b4a28abc1d0fb0f7d4c4d",
      "name": "FETCH_ALL (lineage snapshot)",
      "group": "read",
      "note": "Fetch_All_Data_&_References_Matrix 02.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/4a250f97181b4a28abc1d0fb0f7d4c4d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "2d576af599c0421eb37213634b85fc4b",
      "name": "Fetch_All_Data_&_References_Matrix (03)",
      "group": "read",
      "note": "Third matrix variant carried by the manifest.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/2d576af599c0421eb37213634b85fc4b/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "31e02518075940d2bcfa9bdb0e9b0b8d",
      "name": "get all data",
      "group": "read",
      "note": "Register bootstrap; primary FETCH_ALL.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/31e02518075940d2bcfa9bdb0e9b0b8d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "9df45c5086ea42f2ab2b6ee9afae3f29",
      "name": "Get Categories",
      "group": "read",
      "note": "Category lookup.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/9df45c5086ea42f2ab2b6ee9afae3f29/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "5729f50aa0fc4248be30ed4e9d7a7a4f",
      "name": "get correspondence (flat response)",
      "group": "read",
      "note": "Flat correspondence response.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/5729f50aa0fc4248be30ed4e9d7a7a4f/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "3c7094de10ce473e985e5cadcf66bc67",
      "name": "Get Departments",
      "group": "read",
      "note": "Department lookup.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/3c7094de10ce473e985e5cadcf66bc67/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "818ec4053f1e4f0b87845114241d8b74",
      "name": "GET DOCS",
      "group": "read",
      "note": "Document retrieval.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/818ec4053f1e4f0b87845114241d8b74/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "20e6340941ce4b1bbb87b43c9102a777",
      "name": "Get email attachments",
      "group": "read",
      "note": "Attachment retrieval.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/20e6340941ce4b1bbb87b43c9102a777/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "3931e2ff995242b6b2c920c8b2209797",
      "name": "GET EMAILS",
      "group": "read",
      "note": "Inbound email list.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/3931e2ff995242b6b2c920c8b2209797/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "820c4a576cbb4a948d6a99dd85721e71",
      "name": "Get Emails (Control Deck variant)",
      "group": "read",
      "note": "Control-deck email list.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/820c4a576cbb4a948d6a99dd85721e71/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "f480ade951a1437c91604bee33279b0e",
      "name": "Get Letters",
      "group": "read",
      "note": "Letter register.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/f480ade951a1437c91604bee33279b0e/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "ff455c68e9ac493e858fb984bcfd01fb",
      "name": "GET REFERENCES / LOOKUPS (users, categories, departments)",
      "group": "read",
      "note": "Fetch_References_and_Lookups_Data 01; primary REFERENCE_DATA.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/ff455c68e9ac493e858fb984bcfd01fb/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "37642ba3597f4cf58288cc71b5e6b519",
      "name": "GET TASKS",
      "group": "read",
      "note": "Task list; wired to FETCH_ACTIVITIES.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/37642ba3597f4cf58288cc71b5e6b519/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "607795813ee14d8abee6d1b4e8dd866b",
      "name": "Get Users",
      "group": "read",
      "note": "User directory lookup.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/607795813ee14d8abee6d1b4e8dd866b/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "d67f2acb3708449490eed561ee56efbe",
      "name": "REFERENCE_DATA (lineage snapshot)",
      "group": "read",
      "note": "Second reference-data variant.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/d67f2acb3708449490eed561ee56efbe/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "5de1fc934e2944bb9cf9d9a0f9bd38e3",
      "name": "assign-item direct build endpoint",
      "group": "write",
      "note": "Direct assignment endpoint from the build corpus.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/5de1fc934e2944bb9cf9d9a0f9bd38e3/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "7e71fffe770a45ccb93bf216bb53786e",
      "name": "BULK ASSIGN (hybrid single or bulk)",
      "group": "write",
      "note": "Direct bulk variant.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/7e71fffe770a45ccb93bf216bb53786e/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "c43388639d14452faef4ca3042a95b23",
      "name": "BULK_ASSIGN (REGEN build)",
      "group": "write",
      "note": "Deployed Bulk Task Assignment_Create Task.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c43388639d14452faef4ca3042a95b23/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "a942d230337c4ddfa9a386e92bbd048b",
      "name": "CREATE TASK FOR EMAIL",
      "group": "write",
      "note": "Email-to-task assignment.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a942d230337c4ddfa9a386e92bbd048b/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "6b3bad3005b44bf6bced0f8074d3f2ed",
      "name": "Deployed Create task",
      "group": "write",
      "note": "Second create-task flow; recorded alternate for SINGLE_ASSIGNMENT.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/6b3bad3005b44bf6bced0f8074d3f2ed/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "1154b50e1d17420dadb3b012e7e2a02c",
      "name": "optimized bulk assign",
      "group": "write",
      "note": "Primary bulk assignment path.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/1154b50e1d17420dadb3b012e7e2a02c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "f71397ff3ca145059dc8f78c04923e9f",
      "name": "SINGLE ASSIGN / create task and update activity",
      "group": "write",
      "note": "Named SINGLE ASSIGN by the specification and \u201cCreate task\u201d by the numbered flow list.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/f71397ff3ca145059dc8f78c04923e9f/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": [
        {
          "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/f71397ff3ca145059dc8f78c04923e9f/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
          "why": "second signature recorded for the same flow"
        }
      ]
    },
    {
      "workflowId": "3cea46a4f06748cb8a680ee1532d73cb",
      "name": "Status update (single and bulk)",
      "group": "write",
      "note": "Status transition flow.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/3cea46a4f06748cb8a680ee1532d73cb/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    },
    {
      "workflowId": "cae7796c721b47bc9aa95159eeb16081",
      "name": "task-created responder",
      "group": "write",
      "note": "Responds after a task is created.",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/cae7796c721b47bc9aa95159eeb16081/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "signed": true,
      "variants": []
    }
  ],
  "keys": [
    {
      "key": "FETCH_ALL",
      "workflowId": "31e02518075940d2bcfa9bdb0e9b0b8d",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/31e02518075940d2bcfa9bdb0e9b0b8d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "get all data",
      "group": "core",
      "role": "read",
      "note": "The register itself \u2014 officers see nothing without it.",
      "signed": true,
      "expect": [
        "tasks",
        "docs",
        "emails"
      ],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "fetchAll",
          "name": "fetchAll",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": [
          "tasks",
          "docs",
          "emails"
        ]
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "FETCH_ACTIVITIES",
      "workflowId": "37642ba3597f4cf58288cc71b5e6b519",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/37642ba3597f4cf58288cc71b5e6b519/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "GET TASKS",
      "group": "core",
      "role": "read",
      "note": "Activity feed.",
      "signed": true,
      "expect": [
        "activities"
      ],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "LIST-ACTIVITIES",
          "name": "LIST-ACTIVITIES",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": [
          "activities"
        ]
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "REFERENCE_DATA",
      "workflowId": "ff455c68e9ac493e858fb984bcfd01fb",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/ff455c68e9ac493e858fb984bcfd01fb/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "GET REFERENCES / LOOKUPS (users, categories, departments)",
      "group": "core",
      "role": "read",
      "note": "Lookups: users, categories, departments.",
      "signed": true,
      "expect": [
        "users",
        "categories",
        "departments"
      ],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "lookups",
          "name": "lookups",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": [
          "users",
          "categories",
          "departments"
        ]
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "GET_DOCS",
      "workflowId": "818ec4053f1e4f0b87845114241d8b74",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/818ec4053f1e4f0b87845114241d8b74/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "GET DOCS",
      "group": "core",
      "role": "read",
      "note": "Document retrieval.",
      "signed": true,
      "expect": [
        "docs"
      ],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "getDocs",
          "name": "getDocs",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": [
          "docs"
        ]
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "FETCH_EMAIL_ATTACHMENTS",
      "workflowId": "20e6340941ce4b1bbb87b43c9102a777",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/20e6340941ce4b1bbb87b43c9102a777/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "Get email attachments",
      "group": "core",
      "role": "read",
      "note": "Email attachment retrieval.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "fetchEmailAttachments",
          "name": "fetchEmailAttachments",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": []
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "SINGLE_ASSIGNMENT",
      "workflowId": "f71397ff3ca145059dc8f78c04923e9f",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/f71397ff3ca145059dc8f78c04923e9f/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "SINGLE ASSIGN / create task and update activity",
      "group": "core",
      "role": "write",
      "note": "Assign one correspondence to one officer.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "singleassignment",
          "name": "singleassignment",
          "userEmail": "dgo.probe@example.invalid",
          "operation": "create",
          "tag": "__DGO_PROBE__"
        },
        "expect": []
      },
      "governance": {
        "mutates": true,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "BULK_ASSIGNMENT",
      "workflowId": "1154b50e1d17420dadb3b012e7e2a02c",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/1154b50e1d17420dadb3b012e7e2a02c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "optimized bulk assign",
      "group": "core",
      "role": "write",
      "note": "Assign many at once.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "bulkassignment",
          "name": "bulkassignment",
          "userEmail": "dgo.probe@example.invalid",
          "operation": "create",
          "tag": "__DGO_PROBE__"
        },
        "expect": []
      },
      "governance": {
        "mutates": true,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "BULK_ASSIGNMENT_DIRECT",
      "workflowId": "7e71fffe770a45ccb93bf216bb53786e",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/7e71fffe770a45ccb93bf216bb53786e/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "BULK ASSIGN (hybrid single or bulk)",
      "group": "core",
      "role": "write",
      "note": "Direct bulk assignment variant.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "bulkassignment",
          "name": "bulkassignment",
          "userEmail": "dgo.probe@example.invalid",
          "operation": "create",
          "tag": "__DGO_PROBE__"
        },
        "expect": []
      },
      "governance": {
        "mutates": true,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "DYNAMIC_ACTIONS",
      "workflowId": "bc83d98acf474a088832d78f50085388",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/bc83d98acf474a088832d78f50085388/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "DYNAMIC GLOBAL ENDPOINT INTERFACE",
      "group": "core",
      "role": "write",
      "note": "Every governed write: register, triage, treat, approve, dispatch, close, archive.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "dynamicGlobalAction",
          "name": "dynamicGlobalAction",
          "userEmail": "dgo.probe@example.invalid",
          "operation": "create",
          "tag": "__DGO_PROBE__"
        },
        "expect": []
      },
      "governance": {
        "mutates": true,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "SUBSIDIARY_ACTIONS",
      "workflowId": "85c556f10b8244ba9d839a2ebe240b91",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/85c556f10b8244ba9d839a2ebe240b91/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "SUPPLEMENTARY / SUBSIDIARY ACTIONS (multi-route)",
      "group": "core",
      "role": "write",
      "note": "Multi-route subsidiary action flow; eighteen routes.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "INIT",
          "name": "INIT",
          "userEmail": "dgo.probe@example.invalid",
          "operation": "create",
          "tag": "__DGO_PROBE__"
        },
        "expect": []
      },
      "governance": {
        "mutates": true,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "EMAIL",
      "workflowId": "2e37b6310842410eb15c4561f2b0c1eb",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/2e37b6310842410eb15c4561f2b0c1eb/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "Send email notification",
      "group": "core",
      "role": "write",
      "note": "Outward correspondence email, bound to the signed Send email notification URL.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "dispatchEmail",
          "name": "dispatchEmail",
          "userEmail": "dgo.probe@example.invalid",
          "operation": "create",
          "tag": "__DGO_PROBE__"
        },
        "expect": []
      },
      "governance": {
        "mutates": true,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "EMAIL_RELATED_TASK",
      "workflowId": "a942d230337c4ddfa9a386e92bbd048b",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a942d230337c4ddfa9a386e92bbd048b/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "CREATE TASK FOR EMAIL",
      "group": "core",
      "role": "write",
      "note": "Email-to-task assignment.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "emailtotaskassignment",
          "name": "emailtotaskassignment",
          "userEmail": "dgo.probe@example.invalid",
          "operation": "create",
          "tag": "__DGO_PROBE__"
        },
        "expect": []
      },
      "governance": {
        "mutates": true,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "AI_EMAIL_ANALYSIS",
      "workflowId": "fe794e0139784ac694768e5a716e0be7",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/fe794e0139784ac694768e5a716e0be7/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "AI over email and task context",
      "group": "core",
      "role": "ai",
      "note": "AI analysis of inbound email.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "aiAnalyseEmail",
          "name": "aiAnalyseEmail",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": []
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "AI_DOC_ANALYSIS",
      "workflowId": "5b29edc84b5d4a8db3c885d8441aa977",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/5b29edc84b5d4a8db3c885d8441aa977/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "Events processing \u2014 AI over event documents",
      "group": "core",
      "role": "ai",
      "note": "AI analysis of event documents.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "aiAnalyseEventDocs",
          "name": "aiAnalyseEventDocs",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": []
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "AI_CHAT",
      "workflowId": "a13c8b577bd44f8787c50d095ea3faf9",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a13c8b577bd44f8787c50d095ea3faf9/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "AI chat",
      "group": "core",
      "role": "ai",
      "note": "AI chat.",
      "signed": true,
      "expect": [
        "reply"
      ],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "aiChat",
          "name": "aiChat",
          "userEmail": "dgo.probe@example.invalid",
          "message": "__DGO_PROBE__"
        },
        "expect": [
          "reply"
        ]
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "OTP_GENERATE",
      "workflowId": "314aaf27593147089b38322e5ca25936",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/314aaf27593147089b38322e5ca25936/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "OTP generate / send",
      "group": "core",
      "role": "auth",
      "note": "One-time passcode issue.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "otpGenerate",
          "name": "otpGenerate",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": []
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "OTP_VERIFY",
      "workflowId": "43879c5165de439680055ab4258b3f27",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/43879c5165de439680055ab4258b3f27/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "OTP verify",
      "group": "core",
      "role": "auth",
      "note": "One-time passcode check.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "otpVerify",
          "name": "otpVerify",
          "userEmail": "dgo.probe@example.invalid",
          "code": "000000"
        },
        "expect": []
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "SCAN_INTAKE",
      "workflowId": "f771d509dfb648b0b21eeec0a36614fa",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/f771d509dfb648b0b21eeec0a36614fa/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "UPLOAD_ECM_DOCS_PORTAL",
      "group": "core",
      "role": "write",
      "note": "Registry counter scan deposit, bound to the ECM upload flow \u2014 the only document-deposit endpoint in the supplied estate. Repoint from the Registry tab if the tenant exposes a dedicated raw-bytes intake.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "upload",
          "name": "upload",
          "userEmail": "dgo.probe@example.invalid",
          "operation": "create",
          "tag": "__DGO_PROBE__"
        },
        "expect": []
      },
      "governance": {
        "mutates": true,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "AUTH_LOGIN_START",
      "workflowId": "80fab00617c84db5af989f985d0288a5",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/80fab00617c84db5af989f985d0288a5/triggers/manual/paths/invoke?api-version=1",
      "flow": "AUTH_LOGIN_START",
      "group": "auth",
      "role": "auth",
      "note": "Login start.",
      "signed": false,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "loginStart",
          "name": "loginStart",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": []
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": false
      }
    },
    {
      "key": "SUBMISSION_ECM_DOCS_PORTAL",
      "workflowId": "1041ed37ce924e3c886d891f23e8142c",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/1041ed37ce924e3c886d891f23e8142c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "SUBMISSION_ECM_DOCS_PORTAL",
      "group": "portal",
      "role": "write",
      "note": "ECM document submission.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "submit",
          "name": "submit",
          "userEmail": "dgo.probe@example.invalid",
          "operation": "create",
          "tag": "__DGO_PROBE__"
        },
        "expect": []
      },
      "governance": {
        "mutates": true,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "UPLOAD_ECM_DOCS_PORTAL",
      "workflowId": "f771d509dfb648b0b21eeec0a36614fa",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/f771d509dfb648b0b21eeec0a36614fa/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "UPLOAD_ECM_DOCS_PORTAL",
      "group": "portal",
      "role": "write",
      "note": "ECM document upload.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "upload",
          "name": "upload",
          "userEmail": "dgo.probe@example.invalid",
          "operation": "create",
          "tag": "__DGO_PROBE__"
        },
        "expect": []
      },
      "governance": {
        "mutates": true,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "INTAKE_SUBMISSION",
      "workflowId": "1ff7714c11a74fa4a876f8f6a79b64d2",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/1ff7714c11a74fa4a876f8f6a79b64d2/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "DOCUMENT SUBMISSION PORTAL",
      "group": "portal",
      "role": "write",
      "note": "Public document submission portal.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "submit",
          "name": "submit",
          "userEmail": "dgo.probe@example.invalid",
          "operation": "create",
          "tag": "__DGO_PROBE__"
        },
        "expect": []
      },
      "governance": {
        "mutates": true,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "EDTMS_NITDA_WRITE_API_INGESTION",
      "workflowId": "471875bf903545eda4d10e8a6243d858",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/471875bf903545eda4d10e8a6243d858/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "EDTMS NITDA_Write_API (Ingestion)",
      "group": "edtms",
      "role": "write",
      "note": "Registry ingestion write API.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "ingest",
          "name": "ingest",
          "userEmail": "dgo.probe@example.invalid",
          "operation": "create",
          "tag": "__DGO_PROBE__"
        },
        "expect": []
      },
      "governance": {
        "mutates": true,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "EDTMS_NITDA_READ_API_DASHBOARD_SYNC",
      "workflowId": "c1d8dba2fc84423891c6b78b0126278f",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c1d8dba2fc84423891c6b78b0126278f/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "EDTMS NITDA_Read_API (Central Registry Dashboard Sync)",
      "group": "edtms",
      "role": "read",
      "note": "Central registry dashboard sync.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "sync",
          "name": "sync",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": []
      },
      "governance": {
        "mutates": true,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "EDTMS_NITDA_UPDATE_TASK_RESOLUTION",
      "workflowId": "84f062159fe9422eb0195c251ca285b8",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/84f062159fe9422eb0195c251ca285b8/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "EDTMS NITDA_Update_Task (Resolution)",
      "group": "edtms",
      "role": "write",
      "note": "Task resolution update.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "resolve",
          "name": "resolve",
          "userEmail": "dgo.probe@example.invalid",
          "operation": "create",
          "tag": "__DGO_PROBE__"
        },
        "expect": []
      },
      "governance": {
        "mutates": true,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "ARCHIVE",
      "workflowId": "c2afaf028b50408995738b9e14c0662d",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c2afaf028b50408995738b9e14c0662d/triggers/manual/paths/invoke?api-version=1",
      "flow": "ARCHIVE",
      "group": "archive",
      "role": "write",
      "note": "Archive flow.",
      "signed": false,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "archive",
          "name": "archive",
          "userEmail": "dgo.probe@example.invalid",
          "operation": "create",
          "tag": "__DGO_PROBE__"
        },
        "expect": []
      },
      "governance": {
        "mutates": true,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": false
      }
    },
    {
      "key": "DISPATCH_OUTBOUND",
      "workflowId": "bc83d98acf474a088832d78f50085388",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/bc83d98acf474a088832d78f50085388/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "DYNAMIC GLOBAL ENDPOINT INTERFACE",
      "group": "derived",
      "role": "write",
      "note": "Outbound dispatch route on the dynamic dispatcher.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "dispatchOutbound",
          "name": "dispatchOutbound",
          "userEmail": "dgo.probe@example.invalid",
          "operation": "create",
          "tag": "__DGO_PROBE__"
        },
        "expect": []
      },
      "governance": {
        "mutates": true,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "CORRESPONDENCE_EMAIL_SEND",
      "workflowId": "7ee91bdefd3c449889d680c722a99d05",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/7ee91bdefd3c449889d680c722a99d05/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "send-email variant",
      "group": "derived",
      "role": "write",
      "note": "Second send-email endpoint.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "sendEmail",
          "name": "sendEmail",
          "userEmail": "dgo.probe@example.invalid",
          "operation": "create",
          "tag": "__DGO_PROBE__"
        },
        "expect": []
      },
      "governance": {
        "mutates": true,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "STATUS_UPDATE",
      "workflowId": "3cea46a4f06748cb8a680ee1532d73cb",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/3cea46a4f06748cb8a680ee1532d73cb/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "Status update (single and bulk)",
      "group": "derived",
      "role": "write",
      "note": "Status transition, single and bulk.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "statusUpdate",
          "name": "statusUpdate",
          "userEmail": "dgo.probe@example.invalid",
          "operation": "create",
          "tag": "__DGO_PROBE__"
        },
        "expect": []
      },
      "governance": {
        "mutates": true,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "GET_EMAILS",
      "workflowId": "3931e2ff995242b6b2c920c8b2209797",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/3931e2ff995242b6b2c920c8b2209797/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "GET EMAILS",
      "group": "derived",
      "role": "read",
      "note": "Inbound email list.",
      "signed": true,
      "expect": [
        "emails"
      ],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "getEmails",
          "name": "getEmails",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": [
          "emails"
        ]
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "GET_LETTERS",
      "workflowId": "f480ade951a1437c91604bee33279b0e",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/f480ade951a1437c91604bee33279b0e/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "Get Letters",
      "group": "derived",
      "role": "read",
      "note": "Letter register.",
      "signed": true,
      "expect": [
        "letters"
      ],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "getLetters",
          "name": "getLetters",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": [
          "letters"
        ]
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "GET_USERS",
      "workflowId": "607795813ee14d8abee6d1b4e8dd866b",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/607795813ee14d8abee6d1b4e8dd866b/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "Get Users",
      "group": "derived",
      "role": "read",
      "note": "User directory.",
      "signed": true,
      "expect": [
        "users"
      ],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "getUsers",
          "name": "getUsers",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": [
          "users"
        ]
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "GET_CATEGORIES",
      "workflowId": "9df45c5086ea42f2ab2b6ee9afae3f29",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/9df45c5086ea42f2ab2b6ee9afae3f29/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "Get Categories",
      "group": "derived",
      "role": "read",
      "note": "Category lookup.",
      "signed": true,
      "expect": [
        "categories"
      ],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "getCategories",
          "name": "getCategories",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": [
          "categories"
        ]
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "GET_DEPARTMENTS",
      "workflowId": "3c7094de10ce473e985e5cadcf66bc67",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/3c7094de10ce473e985e5cadcf66bc67/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "Get Departments",
      "group": "derived",
      "role": "read",
      "note": "Department lookup.",
      "signed": true,
      "expect": [
        "departments"
      ],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "getDepartments",
          "name": "getDepartments",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": [
          "departments"
        ]
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "GET_CORRESPONDENCE",
      "workflowId": "5729f50aa0fc4248be30ed4e9d7a7a4f",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/5729f50aa0fc4248be30ed4e9d7a7a4f/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "get correspondence (flat response)",
      "group": "derived",
      "role": "read",
      "note": "Flat correspondence response.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "getCorrespondence",
          "name": "getCorrespondence",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": []
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "ATTENTION_ITEMS",
      "workflowId": "4f733288d90e49a68d4d5715d9198d40",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/4f733288d90e49a68d4d5715d9198d40/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "DGO Attention Items",
      "group": "derived",
      "role": "read",
      "note": "Attention queue.",
      "signed": true,
      "expect": [
        "items"
      ],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "getAttentionItems",
          "name": "getAttentionItems",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": [
          "items"
        ]
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "BULK_OPS_GET_DOCS",
      "workflowId": "7995c1eb50d94d5daa2780e71391d874",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/7995c1eb50d94d5daa2780e71391d874/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "BULK OPS GET DOCS",
      "group": "derived",
      "role": "read",
      "note": "Bulk document listing.",
      "signed": true,
      "expect": [
        "docs"
      ],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "getDocs",
          "name": "getDocs",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": [
          "docs"
        ]
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "API_GET",
      "workflowId": "02a3a70f3dec4dcd9a85a244a60c65b9",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/02a3a70f3dec4dcd9a85a244a60c65b9/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "API_GET (ACK build)",
      "group": "derived",
      "role": "read",
      "note": "Generic getter from the ACK build.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "get",
          "name": "get",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": []
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "ASSIGN_ITEM_DIRECT",
      "workflowId": "5de1fc934e2944bb9cf9d9a0f9bd38e3",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/5de1fc934e2944bb9cf9d9a0f9bd38e3/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "assign-item direct build endpoint",
      "group": "derived",
      "role": "write",
      "note": "Direct assign-item endpoint.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "assignItem",
          "name": "assignItem",
          "userEmail": "dgo.probe@example.invalid",
          "operation": "create",
          "tag": "__DGO_PROBE__"
        },
        "expect": []
      },
      "governance": {
        "mutates": true,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "TASK_CREATED_RESPONDER",
      "workflowId": "cae7796c721b47bc9aa95159eeb16081",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/cae7796c721b47bc9aa95159eeb16081/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "task-created responder",
      "group": "derived",
      "role": "write",
      "note": "Task-created responder.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "taskCreated",
          "name": "taskCreated",
          "userEmail": "dgo.probe@example.invalid",
          "operation": "create",
          "tag": "__DGO_PROBE__"
        },
        "expect": []
      },
      "governance": {
        "mutates": true,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "EMAILS_COMPOSE_SELECT",
      "workflowId": "6d78b1940f4447b8b31b49657fe9c19c",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/6d78b1940f4447b8b31b49657fe9c19c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "emails, compose-select response variant",
      "group": "derived",
      "role": "read",
      "note": "Compose-select email variant.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "getEmails",
          "name": "getEmails",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": []
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "GET_EMAILS_CONTROL_DECK",
      "workflowId": "820c4a576cbb4a948d6a99dd85721e71",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/820c4a576cbb4a948d6a99dd85721e71/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "Get Emails (Control Deck variant)",
      "group": "derived",
      "role": "read",
      "note": "Control-deck email list.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "getEmails",
          "name": "getEmails",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": []
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "FETCH_ALL_STANDALONE",
      "workflowId": "31e02518075940d2bcfa9bdb0e9b0b8d",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/31e02518075940d2bcfa9bdb0e9b0b8d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "get all data",
      "group": "alias",
      "role": "read",
      "note": "Alias preserved from the standalone workbench.",
      "signed": true,
      "expect": [
        "tasks",
        "docs",
        "emails"
      ],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "fetchAll",
          "name": "fetchAll",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": [
          "tasks",
          "docs",
          "emails"
        ]
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "FETCH_ALL_MATRIX_02",
      "workflowId": "4a250f97181b4a28abc1d0fb0f7d4c4d",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/4a250f97181b4a28abc1d0fb0f7d4c4d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "FETCH_ALL (lineage snapshot)",
      "group": "alias",
      "role": "read",
      "note": "Fetch_All_Data_&_References_Matrix 02.",
      "signed": true,
      "expect": [
        "tasks",
        "docs",
        "emails"
      ],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "fetchAll",
          "name": "fetchAll",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": [
          "tasks",
          "docs",
          "emails"
        ]
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "FETCH_ALL_MATRIX_03",
      "workflowId": "2d576af599c0421eb37213634b85fc4b",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/2d576af599c0421eb37213634b85fc4b/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "Fetch_All_Data_&_References_Matrix (03)",
      "group": "alias",
      "role": "read",
      "note": "Fetch_All_Data_&_References_Matrix 03.",
      "signed": true,
      "expect": [
        "tasks",
        "docs",
        "emails"
      ],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "fetchAll",
          "name": "fetchAll",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": [
          "tasks",
          "docs",
          "emails"
        ]
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "FETCH_ALL_WITH_REFERENCES",
      "workflowId": "1d56be97cd184fd9b2facede12b17c34",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/1d56be97cd184fd9b2facede12b17c34/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "all data and references",
      "group": "alias",
      "role": "read",
      "note": "All data and references combined.",
      "signed": true,
      "expect": [
        "tasks",
        "docs",
        "emails",
        "users"
      ],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "fetchAll",
          "name": "fetchAll",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": [
          "tasks",
          "docs",
          "emails",
          "users"
        ]
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "FETCH_ACTIVITIES_STANDALONE",
      "workflowId": "85c556f10b8244ba9d839a2ebe240b91",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/85c556f10b8244ba9d839a2ebe240b91/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "SUPPLEMENTARY / SUBSIDIARY ACTIONS (multi-route)",
      "group": "alias",
      "role": "read",
      "note": "Activities through the subsidiary dispatcher.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "LIST-ACTIVITIES",
          "name": "LIST-ACTIVITIES",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": []
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "REFERENCE_DATA_LINEAGE",
      "workflowId": "d67f2acb3708449490eed561ee56efbe",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/d67f2acb3708449490eed561ee56efbe/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "REFERENCE_DATA (lineage snapshot)",
      "group": "alias",
      "role": "read",
      "note": "Second reference-data variant.",
      "signed": true,
      "expect": [
        "users",
        "categories",
        "departments"
      ],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "lookups",
          "name": "lookups",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": [
          "users",
          "categories",
          "departments"
        ]
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "SINGLE_ASSIGNMENT_DEPLOYED",
      "workflowId": "6b3bad3005b44bf6bced0f8074d3f2ed",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/6b3bad3005b44bf6bced0f8074d3f2ed/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "Deployed Create task",
      "group": "alias",
      "role": "write",
      "note": "Deployed Create task.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "singleassignment",
          "name": "singleassignment",
          "userEmail": "dgo.probe@example.invalid",
          "operation": "create",
          "tag": "__DGO_PROBE__"
        },
        "expect": []
      },
      "governance": {
        "mutates": true,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "BULK_ASSIGNMENT_REGEN",
      "workflowId": "c43388639d14452faef4ca3042a95b23",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c43388639d14452faef4ca3042a95b23/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "BULK_ASSIGN (REGEN build)",
      "group": "alias",
      "role": "write",
      "note": "Deployed Bulk Task Assignment_Create Task.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "bulkassignment",
          "name": "bulkassignment",
          "userEmail": "dgo.probe@example.invalid",
          "operation": "create",
          "tag": "__DGO_PROBE__"
        },
        "expect": []
      },
      "governance": {
        "mutates": true,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "EMAIL_DYNAMIC_ACTIONS_STANDALONE",
      "workflowId": "bc83d98acf474a088832d78f50085388",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/bc83d98acf474a088832d78f50085388/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "DYNAMIC GLOBAL ENDPOINT INTERFACE",
      "group": "alias",
      "role": "write",
      "note": "Email through the dynamic dispatcher.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "dispatchEmail",
          "name": "dispatchEmail",
          "userEmail": "dgo.probe@example.invalid",
          "operation": "create",
          "tag": "__DGO_PROBE__"
        },
        "expect": []
      },
      "governance": {
        "mutates": true,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "AI_DOC_ANALYSIS_LINEAGE",
      "workflowId": "20e3b003a57f47febae8a24ad5b9acd4",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/20e3b003a57f47febae8a24ad5b9acd4/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "AI_DOC_ANALYSIS (lineage snapshot)",
      "group": "alias",
      "role": "ai",
      "note": "Second doc-analysis variant.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "aiAnalyseEventDocs",
          "name": "aiAnalyseEventDocs",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": []
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "OTP_GENERATE_NO_PORT",
      "workflowId": "314aaf27593147089b38322e5ca25936",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com/powerautomate/automations/direct/workflows/314aaf27593147089b38322e5ca25936/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "OTP generate / send",
      "group": "alias",
      "role": "variant",
      "note": "No-port host variant of the same trigger.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "otpGenerate",
          "name": "otpGenerate",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": []
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "OTP_VERIFY_NO_PORT",
      "workflowId": "43879c5165de439680055ab4258b3f27",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com/powerautomate/automations/direct/workflows/43879c5165de439680055ab4258b3f27/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "OTP verify",
      "group": "alias",
      "role": "variant",
      "note": "No-port host variant of the same trigger.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "otpVerify",
          "name": "otpVerify",
          "userEmail": "dgo.probe@example.invalid",
          "code": "000000"
        },
        "expect": []
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    },
    {
      "key": "WEB_SEND_EMAIL_UNSIGNED",
      "workflowId": "2e37b6310842410eb15c4561f2b0c1eb",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/2e37b6310842410eb15c4561f2b0c1eb/triggers/manual/paths/invoke?api-version=1",
      "flow": "Send email notification",
      "group": "alias",
      "role": "variant",
      "note": "Unsigned form of Send email notification, exactly as the manifest carries it.",
      "signed": false,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "dispatchEmail",
          "name": "dispatchEmail",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": []
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": false
      }
    },
    {
      "key": "SINGLE_ASSIGNMENT_ALT_SIG",
      "workflowId": "f71397ff3ca145059dc8f78c04923e9f",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/f71397ff3ca145059dc8f78c04923e9f/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "flow": "SINGLE ASSIGN / create task and update activity",
      "group": "alias",
      "role": "variant",
      "note": "Second signature recorded for the same flow.",
      "signed": true,
      "expect": [],
      "sourcePreference": "R13 contract metadata + R12 live binding",
      "probe": {
        "body": {
          "action": "singleassignment",
          "name": "singleassignment",
          "userEmail": "dgo.probe@example.invalid"
        },
        "expect": []
      },
      "governance": {
        "mutates": false,
        "requiresDryRun": true,
        "redactInReports": true,
        "fullUrlIsBearerCredential": true
      }
    }
  ],
  "routes": [
    {
      "key": "SUBSIDIARY_ACTIONS",
      "action": "INIT",
      "write": true,
      "flow": "SUPPLEMENTARY / SUBSIDIARY ACTIONS (multi-route)"
    },
    {
      "key": "SUBSIDIARY_ACTIONS",
      "action": "REFRESH_EMAILS",
      "write": true,
      "flow": "SUPPLEMENTARY / SUBSIDIARY ACTIONS (multi-route)"
    },
    {
      "key": "SUBSIDIARY_ACTIONS",
      "action": "LOAD_EMAIL_DETAILS",
      "write": false,
      "flow": "SUPPLEMENTARY / SUBSIDIARY ACTIONS (multi-route)"
    },
    {
      "key": "SUBSIDIARY_ACTIONS",
      "action": "AI_ANALYSE_EMAIL",
      "write": true,
      "flow": "SUPPLEMENTARY / SUBSIDIARY ACTIONS (multi-route)"
    },
    {
      "key": "SUBSIDIARY_ACTIONS",
      "action": "CREATE_TASK",
      "write": true,
      "flow": "SUPPLEMENTARY / SUBSIDIARY ACTIONS (multi-route)"
    },
    {
      "key": "SUBSIDIARY_ACTIONS",
      "action": "UPDATE_TASK",
      "write": true,
      "flow": "SUPPLEMENTARY / SUBSIDIARY ACTIONS (multi-route)"
    },
    {
      "key": "SUBSIDIARY_ACTIONS",
      "action": "LOAD_EVENT_INFO",
      "write": false,
      "flow": "SUPPLEMENTARY / SUBSIDIARY ACTIONS (multi-route)"
    },
    {
      "key": "SUBSIDIARY_ACTIONS",
      "action": "AI_CHAT",
      "write": true,
      "flow": "SUPPLEMENTARY / SUBSIDIARY ACTIONS (multi-route)"
    },
    {
      "key": "SUBSIDIARY_ACTIONS",
      "action": "TRACK",
      "write": true,
      "flow": "SUPPLEMENTARY / SUBSIDIARY ACTIONS (multi-route)"
    },
    {
      "key": "SUBSIDIARY_ACTIONS",
      "action": "ACKNOWLEDGE",
      "write": true,
      "flow": "SUPPLEMENTARY / SUBSIDIARY ACTIONS (multi-route)"
    },
    {
      "key": "SUBSIDIARY_ACTIONS",
      "action": "GET_ALL",
      "write": false,
      "flow": "SUPPLEMENTARY / SUBSIDIARY ACTIONS (multi-route)"
    },
    {
      "key": "SUBSIDIARY_ACTIONS",
      "action": "GET_BOOTSTRAP",
      "write": false,
      "flow": "SUPPLEMENTARY / SUBSIDIARY ACTIONS (multi-route)"
    },
    {
      "key": "SUBSIDIARY_ACTIONS",
      "action": "LISTDOCS",
      "write": false,
      "flow": "SUPPLEMENTARY / SUBSIDIARY ACTIONS (multi-route)"
    },
    {
      "key": "SUBSIDIARY_ACTIONS",
      "action": "GETDOC",
      "write": false,
      "flow": "SUPPLEMENTARY / SUBSIDIARY ACTIONS (multi-route)"
    },
    {
      "key": "SUBSIDIARY_ACTIONS",
      "action": "BULKASSIGN",
      "write": true,
      "flow": "SUPPLEMENTARY / SUBSIDIARY ACTIONS (multi-route)"
    },
    {
      "key": "SUBSIDIARY_ACTIONS",
      "action": "CREATESUPPORTREQUEST",
      "write": true,
      "flow": "SUPPLEMENTARY / SUBSIDIARY ACTIONS (multi-route)"
    },
    {
      "key": "SUBSIDIARY_ACTIONS",
      "action": "GETREFERENCES",
      "write": false,
      "flow": "SUPPLEMENTARY / SUBSIDIARY ACTIONS (multi-route)"
    },
    {
      "key": "SUBSIDIARY_ACTIONS",
      "action": "LIST-ACTIVITIES",
      "write": false,
      "flow": "SUPPLEMENTARY / SUBSIDIARY ACTIONS (multi-route)"
    },
    {
      "key": "DYNAMIC_ACTIONS",
      "action": "dynamicGlobalAction",
      "write": true,
      "flow": "DYNAMIC GLOBAL ENDPOINT INTERFACE"
    },
    {
      "key": "DYNAMIC_ACTIONS",
      "action": "dispatchOutbound",
      "write": true,
      "flow": "DYNAMIC GLOBAL ENDPOINT INTERFACE"
    },
    {
      "key": "DYNAMIC_ACTIONS",
      "action": "archiveReference",
      "write": true,
      "flow": "DYNAMIC GLOBAL ENDPOINT INTERFACE"
    },
    {
      "key": "DYNAMIC_ACTIONS",
      "action": "transitionStatus",
      "write": true,
      "flow": "DYNAMIC GLOBAL ENDPOINT INTERFACE"
    },
    {
      "key": "DYNAMIC_ACTIONS",
      "action": "logAuditEvent",
      "write": true,
      "flow": "DYNAMIC GLOBAL ENDPOINT INTERFACE"
    },
    {
      "key": "DYNAMIC_ACTIONS",
      "action": "flagDocument",
      "write": true,
      "flow": "DYNAMIC GLOBAL ENDPOINT INTERFACE"
    },
    {
      "key": "DYNAMIC_ACTIONS",
      "action": "updateTask",
      "write": true,
      "flow": "DYNAMIC GLOBAL ENDPOINT INTERFACE"
    },
    {
      "key": "DYNAMIC_ACTIONS",
      "action": "createAssignment",
      "write": true,
      "flow": "DYNAMIC GLOBAL ENDPOINT INTERFACE"
    },
    {
      "key": "DYNAMIC_ACTIONS",
      "action": "emailToTask",
      "write": true,
      "flow": "DYNAMIC GLOBAL ENDPOINT INTERFACE"
    },
    {
      "key": "FETCH_ALL",
      "action": "fetchAll",
      "write": false,
      "flow": "get all data"
    },
    {
      "key": "FETCH_ACTIVITIES",
      "action": "LIST-ACTIVITIES",
      "write": false,
      "flow": "GET TASKS"
    },
    {
      "key": "REFERENCE_DATA",
      "action": "lookups",
      "write": false,
      "flow": "GET REFERENCES / LOOKUPS (users, categories, departments)"
    },
    {
      "key": "GET_DOCS",
      "action": "getDocs",
      "write": false,
      "flow": "GET DOCS"
    },
    {
      "key": "FETCH_EMAIL_ATTACHMENTS",
      "action": "fetchEmailAttachments",
      "write": false,
      "flow": "Get email attachments"
    },
    {
      "key": "SINGLE_ASSIGNMENT",
      "action": "singleassignment",
      "write": true,
      "flow": "SINGLE ASSIGN / create task and update activity"
    },
    {
      "key": "BULK_ASSIGNMENT",
      "action": "bulkassignment",
      "write": true,
      "flow": "optimized bulk assign"
    },
    {
      "key": "BULK_ASSIGNMENT_DIRECT",
      "action": "bulkassignment",
      "write": true,
      "flow": "BULK ASSIGN (hybrid single or bulk)"
    },
    {
      "key": "EMAIL",
      "action": "dispatchEmail",
      "write": true,
      "flow": "Send email notification"
    },
    {
      "key": "EMAIL_RELATED_TASK",
      "action": "emailtotaskassignment",
      "write": true,
      "flow": "CREATE TASK FOR EMAIL"
    },
    {
      "key": "AI_EMAIL_ANALYSIS",
      "action": "aiAnalyseEmail",
      "write": true,
      "flow": "AI over email and task context"
    },
    {
      "key": "AI_DOC_ANALYSIS",
      "action": "aiAnalyseEventDocs",
      "write": true,
      "flow": "Events processing \u2014 AI over event documents"
    },
    {
      "key": "AI_CHAT",
      "action": "aiChat",
      "write": true,
      "flow": "AI chat"
    },
    {
      "key": "OTP_GENERATE",
      "action": "otpGenerate",
      "write": true,
      "flow": "OTP generate / send"
    },
    {
      "key": "OTP_VERIFY",
      "action": "otpVerify",
      "write": true,
      "flow": "OTP verify"
    },
    {
      "key": "SCAN_INTAKE",
      "action": "upload",
      "write": true,
      "flow": "UPLOAD_ECM_DOCS_PORTAL"
    },
    {
      "key": "AUTH_LOGIN_START",
      "action": "loginStart",
      "write": true,
      "flow": "AUTH_LOGIN_START"
    },
    {
      "key": "SUBMISSION_ECM_DOCS_PORTAL",
      "action": "submit",
      "write": true,
      "flow": "SUBMISSION_ECM_DOCS_PORTAL"
    },
    {
      "key": "UPLOAD_ECM_DOCS_PORTAL",
      "action": "upload",
      "write": true,
      "flow": "UPLOAD_ECM_DOCS_PORTAL"
    },
    {
      "key": "INTAKE_SUBMISSION",
      "action": "submit",
      "write": true,
      "flow": "DOCUMENT SUBMISSION PORTAL"
    },
    {
      "key": "EDTMS_NITDA_WRITE_API_INGESTION",
      "action": "ingest",
      "write": true,
      "flow": "EDTMS NITDA_Write_API (Ingestion)"
    },
    {
      "key": "EDTMS_NITDA_READ_API_DASHBOARD_SYNC",
      "action": "sync",
      "write": false,
      "flow": "EDTMS NITDA_Read_API (Central Registry Dashboard Sync)"
    },
    {
      "key": "EDTMS_NITDA_UPDATE_TASK_RESOLUTION",
      "action": "resolve",
      "write": true,
      "flow": "EDTMS NITDA_Update_Task (Resolution)"
    },
    {
      "key": "ARCHIVE",
      "action": "archive",
      "write": true,
      "flow": "ARCHIVE"
    },
    {
      "key": "STATUS_UPDATE",
      "action": "statusUpdate",
      "write": true,
      "flow": "Status update (single and bulk)"
    },
    {
      "key": "GET_EMAILS",
      "action": "getEmails",
      "write": false,
      "flow": "GET EMAILS"
    },
    {
      "key": "GET_LETTERS",
      "action": "getLetters",
      "write": false,
      "flow": "Get Letters"
    },
    {
      "key": "GET_USERS",
      "action": "getUsers",
      "write": false,
      "flow": "Get Users"
    },
    {
      "key": "GET_CATEGORIES",
      "action": "getCategories",
      "write": false,
      "flow": "Get Categories"
    },
    {
      "key": "GET_DEPARTMENTS",
      "action": "getDepartments",
      "write": false,
      "flow": "Get Departments"
    },
    {
      "key": "GET_CORRESPONDENCE",
      "action": "getCorrespondence",
      "write": false,
      "flow": "get correspondence (flat response)"
    },
    {
      "key": "ATTENTION_ITEMS",
      "action": "getAttentionItems",
      "write": false,
      "flow": "DGO Attention Items"
    },
    {
      "key": "BULK_OPS_GET_DOCS",
      "action": "getDocs",
      "write": false,
      "flow": "BULK OPS GET DOCS"
    },
    {
      "key": "API_GET",
      "action": "get",
      "write": false,
      "flow": "API_GET (ACK build)"
    },
    {
      "key": "ASSIGN_ITEM_DIRECT",
      "action": "assignItem",
      "write": true,
      "flow": "assign-item direct build endpoint"
    },
    {
      "key": "TASK_CREATED_RESPONDER",
      "action": "taskCreated",
      "write": true,
      "flow": "task-created responder"
    },
    {
      "key": "EMAILS_COMPOSE_SELECT",
      "action": "getEmails",
      "write": false,
      "flow": "emails, compose-select response variant"
    },
    {
      "key": "GET_EMAILS_CONTROL_DECK",
      "action": "getEmails",
      "write": false,
      "flow": "Get Emails (Control Deck variant)"
    },
    {
      "key": "CORRESPONDENCE_EMAIL_SEND",
      "action": "sendEmail",
      "write": true,
      "flow": "send-email variant"
    },
    {
      "key": "DISPATCH_OUTBOUND",
      "action": "dispatchOutbound",
      "write": true,
      "flow": "DYNAMIC GLOBAL ENDPOINT INTERFACE"
    },
    {
      "key": "FETCH_ALL_STANDALONE",
      "action": "fetchAll",
      "write": false,
      "flow": "get all data"
    },
    {
      "key": "FETCH_ALL_MATRIX_02",
      "action": "fetchAll",
      "write": false,
      "flow": "FETCH_ALL (lineage snapshot)"
    },
    {
      "key": "FETCH_ALL_MATRIX_03",
      "action": "fetchAll",
      "write": false,
      "flow": "Fetch_All_Data_&_References_Matrix (03)"
    },
    {
      "key": "FETCH_ALL_WITH_REFERENCES",
      "action": "fetchAll",
      "write": false,
      "flow": "all data and references"
    },
    {
      "key": "FETCH_ACTIVITIES_STANDALONE",
      "action": "LIST-ACTIVITIES",
      "write": false,
      "flow": "SUPPLEMENTARY / SUBSIDIARY ACTIONS (multi-route)"
    },
    {
      "key": "REFERENCE_DATA_LINEAGE",
      "action": "lookups",
      "write": false,
      "flow": "REFERENCE_DATA (lineage snapshot)"
    },
    {
      "key": "SINGLE_ASSIGNMENT_DEPLOYED",
      "action": "singleassignment",
      "write": true,
      "flow": "Deployed Create task"
    },
    {
      "key": "BULK_ASSIGNMENT_REGEN",
      "action": "bulkassignment",
      "write": true,
      "flow": "BULK_ASSIGN (REGEN build)"
    },
    {
      "key": "EMAIL_DYNAMIC_ACTIONS_STANDALONE",
      "action": "dispatchEmail",
      "write": true,
      "flow": "DYNAMIC GLOBAL ENDPOINT INTERFACE"
    },
    {
      "key": "AI_DOC_ANALYSIS_LINEAGE",
      "action": "aiAnalyseEventDocs",
      "write": true,
      "flow": "AI_DOC_ANALYSIS (lineage snapshot)"
    },
    {
      "key": "OTP_GENERATE_NO_PORT",
      "action": "otpGenerate",
      "write": true,
      "flow": "OTP generate / send"
    },
    {
      "key": "OTP_VERIFY_NO_PORT",
      "action": "otpVerify",
      "write": true,
      "flow": "OTP verify"
    },
    {
      "key": "WEB_SEND_EMAIL_UNSIGNED",
      "action": "dispatchEmail",
      "write": true,
      "flow": "Send email notification"
    },
    {
      "key": "SINGLE_ASSIGNMENT_ALT_SIG",
      "action": "singleassignment",
      "write": true,
      "flow": "SINGLE ASSIGN / create task and update activity"
    }
  ],
  "routeSummary": {
    "SUBSIDIARY_ACTIONS": {
      "total": 18,
      "write": 10,
      "read": 8,
      "actions": [
        "INIT",
        "REFRESH_EMAILS",
        "LOAD_EMAIL_DETAILS",
        "AI_ANALYSE_EMAIL",
        "CREATE_TASK",
        "UPDATE_TASK",
        "LOAD_EVENT_INFO",
        "AI_CHAT",
        "TRACK",
        "ACKNOWLEDGE",
        "GET_ALL",
        "GET_BOOTSTRAP",
        "LISTDOCS",
        "GETDOC",
        "BULKASSIGN",
        "CREATESUPPORTREQUEST",
        "GETREFERENCES",
        "LIST-ACTIVITIES"
      ]
    },
    "DYNAMIC_ACTIONS": {
      "total": 9,
      "write": 9,
      "read": 0,
      "actions": [
        "dynamicGlobalAction",
        "dispatchOutbound",
        "archiveReference",
        "transitionStatus",
        "logAuditEvent",
        "flagDocument",
        "updateTask",
        "createAssignment",
        "emailToTask"
      ]
    },
    "FETCH_ALL": {
      "total": 1,
      "write": 0,
      "read": 1,
      "actions": [
        "fetchAll"
      ]
    },
    "FETCH_ACTIVITIES": {
      "total": 1,
      "write": 0,
      "read": 1,
      "actions": [
        "LIST-ACTIVITIES"
      ]
    },
    "REFERENCE_DATA": {
      "total": 1,
      "write": 0,
      "read": 1,
      "actions": [
        "lookups"
      ]
    },
    "GET_DOCS": {
      "total": 1,
      "write": 0,
      "read": 1,
      "actions": [
        "getDocs"
      ]
    },
    "FETCH_EMAIL_ATTACHMENTS": {
      "total": 1,
      "write": 0,
      "read": 1,
      "actions": [
        "fetchEmailAttachments"
      ]
    },
    "SINGLE_ASSIGNMENT": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "singleassignment"
      ]
    },
    "BULK_ASSIGNMENT": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "bulkassignment"
      ]
    },
    "BULK_ASSIGNMENT_DIRECT": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "bulkassignment"
      ]
    },
    "EMAIL": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "dispatchEmail"
      ]
    },
    "EMAIL_RELATED_TASK": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "emailtotaskassignment"
      ]
    },
    "AI_EMAIL_ANALYSIS": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "aiAnalyseEmail"
      ]
    },
    "AI_DOC_ANALYSIS": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "aiAnalyseEventDocs"
      ]
    },
    "AI_CHAT": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "aiChat"
      ]
    },
    "OTP_GENERATE": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "otpGenerate"
      ]
    },
    "OTP_VERIFY": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "otpVerify"
      ]
    },
    "SCAN_INTAKE": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "upload"
      ]
    },
    "AUTH_LOGIN_START": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "loginStart"
      ]
    },
    "SUBMISSION_ECM_DOCS_PORTAL": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "submit"
      ]
    },
    "UPLOAD_ECM_DOCS_PORTAL": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "upload"
      ]
    },
    "INTAKE_SUBMISSION": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "submit"
      ]
    },
    "EDTMS_NITDA_WRITE_API_INGESTION": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "ingest"
      ]
    },
    "EDTMS_NITDA_READ_API_DASHBOARD_SYNC": {
      "total": 1,
      "write": 0,
      "read": 1,
      "actions": [
        "sync"
      ]
    },
    "EDTMS_NITDA_UPDATE_TASK_RESOLUTION": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "resolve"
      ]
    },
    "ARCHIVE": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "archive"
      ]
    },
    "STATUS_UPDATE": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "statusUpdate"
      ]
    },
    "GET_EMAILS": {
      "total": 1,
      "write": 0,
      "read": 1,
      "actions": [
        "getEmails"
      ]
    },
    "GET_LETTERS": {
      "total": 1,
      "write": 0,
      "read": 1,
      "actions": [
        "getLetters"
      ]
    },
    "GET_USERS": {
      "total": 1,
      "write": 0,
      "read": 1,
      "actions": [
        "getUsers"
      ]
    },
    "GET_CATEGORIES": {
      "total": 1,
      "write": 0,
      "read": 1,
      "actions": [
        "getCategories"
      ]
    },
    "GET_DEPARTMENTS": {
      "total": 1,
      "write": 0,
      "read": 1,
      "actions": [
        "getDepartments"
      ]
    },
    "GET_CORRESPONDENCE": {
      "total": 1,
      "write": 0,
      "read": 1,
      "actions": [
        "getCorrespondence"
      ]
    },
    "ATTENTION_ITEMS": {
      "total": 1,
      "write": 0,
      "read": 1,
      "actions": [
        "getAttentionItems"
      ]
    },
    "BULK_OPS_GET_DOCS": {
      "total": 1,
      "write": 0,
      "read": 1,
      "actions": [
        "getDocs"
      ]
    },
    "API_GET": {
      "total": 1,
      "write": 0,
      "read": 1,
      "actions": [
        "get"
      ]
    },
    "ASSIGN_ITEM_DIRECT": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "assignItem"
      ]
    },
    "TASK_CREATED_RESPONDER": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "taskCreated"
      ]
    },
    "EMAILS_COMPOSE_SELECT": {
      "total": 1,
      "write": 0,
      "read": 1,
      "actions": [
        "getEmails"
      ]
    },
    "GET_EMAILS_CONTROL_DECK": {
      "total": 1,
      "write": 0,
      "read": 1,
      "actions": [
        "getEmails"
      ]
    },
    "CORRESPONDENCE_EMAIL_SEND": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "sendEmail"
      ]
    },
    "DISPATCH_OUTBOUND": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "dispatchOutbound"
      ]
    },
    "FETCH_ALL_STANDALONE": {
      "total": 1,
      "write": 0,
      "read": 1,
      "actions": [
        "fetchAll"
      ]
    },
    "FETCH_ALL_MATRIX_02": {
      "total": 1,
      "write": 0,
      "read": 1,
      "actions": [
        "fetchAll"
      ]
    },
    "FETCH_ALL_MATRIX_03": {
      "total": 1,
      "write": 0,
      "read": 1,
      "actions": [
        "fetchAll"
      ]
    },
    "FETCH_ALL_WITH_REFERENCES": {
      "total": 1,
      "write": 0,
      "read": 1,
      "actions": [
        "fetchAll"
      ]
    },
    "FETCH_ACTIVITIES_STANDALONE": {
      "total": 1,
      "write": 0,
      "read": 1,
      "actions": [
        "LIST-ACTIVITIES"
      ]
    },
    "REFERENCE_DATA_LINEAGE": {
      "total": 1,
      "write": 0,
      "read": 1,
      "actions": [
        "lookups"
      ]
    },
    "SINGLE_ASSIGNMENT_DEPLOYED": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "singleassignment"
      ]
    },
    "BULK_ASSIGNMENT_REGEN": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "bulkassignment"
      ]
    },
    "EMAIL_DYNAMIC_ACTIONS_STANDALONE": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "dispatchEmail"
      ]
    },
    "AI_DOC_ANALYSIS_LINEAGE": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "aiAnalyseEventDocs"
      ]
    },
    "OTP_GENERATE_NO_PORT": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "otpGenerate"
      ]
    },
    "OTP_VERIFY_NO_PORT": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "otpVerify"
      ]
    },
    "WEB_SEND_EMAIL_UNSIGNED": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "dispatchEmail"
      ]
    },
    "SINGLE_ASSIGNMENT_ALT_SIG": {
      "total": 1,
      "write": 1,
      "read": 0,
      "actions": [
        "singleassignment"
      ]
    }
  },
  "probes": {
    "FETCH_ALL": {
      "body": {
        "action": "fetchAll",
        "name": "fetchAll",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": [
        "tasks",
        "docs",
        "emails"
      ]
    },
    "FETCH_ACTIVITIES": {
      "body": {
        "action": "LIST-ACTIVITIES",
        "name": "LIST-ACTIVITIES",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": [
        "activities"
      ]
    },
    "REFERENCE_DATA": {
      "body": {
        "action": "lookups",
        "name": "lookups",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": [
        "users",
        "categories",
        "departments"
      ]
    },
    "GET_DOCS": {
      "body": {
        "action": "getDocs",
        "name": "getDocs",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": [
        "docs"
      ]
    },
    "FETCH_EMAIL_ATTACHMENTS": {
      "body": {
        "action": "fetchEmailAttachments",
        "name": "fetchEmailAttachments",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": []
    },
    "SINGLE_ASSIGNMENT": {
      "body": {
        "action": "singleassignment",
        "name": "singleassignment",
        "userEmail": "dgo.probe@example.invalid",
        "operation": "create",
        "tag": "__DGO_PROBE__"
      },
      "expect": []
    },
    "BULK_ASSIGNMENT": {
      "body": {
        "action": "bulkassignment",
        "name": "bulkassignment",
        "userEmail": "dgo.probe@example.invalid",
        "operation": "create",
        "tag": "__DGO_PROBE__"
      },
      "expect": []
    },
    "BULK_ASSIGNMENT_DIRECT": {
      "body": {
        "action": "bulkassignment",
        "name": "bulkassignment",
        "userEmail": "dgo.probe@example.invalid",
        "operation": "create",
        "tag": "__DGO_PROBE__"
      },
      "expect": []
    },
    "DYNAMIC_ACTIONS": {
      "body": {
        "action": "dynamicGlobalAction",
        "name": "dynamicGlobalAction",
        "userEmail": "dgo.probe@example.invalid",
        "operation": "create",
        "tag": "__DGO_PROBE__"
      },
      "expect": []
    },
    "SUBSIDIARY_ACTIONS": {
      "body": {
        "action": "INIT",
        "name": "INIT",
        "userEmail": "dgo.probe@example.invalid",
        "operation": "create",
        "tag": "__DGO_PROBE__"
      },
      "expect": []
    },
    "EMAIL": {
      "body": {
        "action": "dispatchEmail",
        "name": "dispatchEmail",
        "userEmail": "dgo.probe@example.invalid",
        "operation": "create",
        "tag": "__DGO_PROBE__"
      },
      "expect": []
    },
    "EMAIL_RELATED_TASK": {
      "body": {
        "action": "emailtotaskassignment",
        "name": "emailtotaskassignment",
        "userEmail": "dgo.probe@example.invalid",
        "operation": "create",
        "tag": "__DGO_PROBE__"
      },
      "expect": []
    },
    "AI_EMAIL_ANALYSIS": {
      "body": {
        "action": "aiAnalyseEmail",
        "name": "aiAnalyseEmail",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": []
    },
    "AI_DOC_ANALYSIS": {
      "body": {
        "action": "aiAnalyseEventDocs",
        "name": "aiAnalyseEventDocs",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": []
    },
    "AI_CHAT": {
      "body": {
        "action": "aiChat",
        "name": "aiChat",
        "userEmail": "dgo.probe@example.invalid",
        "message": "__DGO_PROBE__"
      },
      "expect": [
        "reply"
      ]
    },
    "OTP_GENERATE": {
      "body": {
        "action": "otpGenerate",
        "name": "otpGenerate",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": []
    },
    "OTP_VERIFY": {
      "body": {
        "action": "otpVerify",
        "name": "otpVerify",
        "userEmail": "dgo.probe@example.invalid",
        "code": "000000"
      },
      "expect": []
    },
    "SCAN_INTAKE": {
      "body": {
        "action": "upload",
        "name": "upload",
        "userEmail": "dgo.probe@example.invalid",
        "operation": "create",
        "tag": "__DGO_PROBE__"
      },
      "expect": []
    },
    "AUTH_LOGIN_START": {
      "body": {
        "action": "loginStart",
        "name": "loginStart",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": []
    },
    "SUBMISSION_ECM_DOCS_PORTAL": {
      "body": {
        "action": "submit",
        "name": "submit",
        "userEmail": "dgo.probe@example.invalid",
        "operation": "create",
        "tag": "__DGO_PROBE__"
      },
      "expect": []
    },
    "UPLOAD_ECM_DOCS_PORTAL": {
      "body": {
        "action": "upload",
        "name": "upload",
        "userEmail": "dgo.probe@example.invalid",
        "operation": "create",
        "tag": "__DGO_PROBE__"
      },
      "expect": []
    },
    "INTAKE_SUBMISSION": {
      "body": {
        "action": "submit",
        "name": "submit",
        "userEmail": "dgo.probe@example.invalid",
        "operation": "create",
        "tag": "__DGO_PROBE__"
      },
      "expect": []
    },
    "EDTMS_NITDA_WRITE_API_INGESTION": {
      "body": {
        "action": "ingest",
        "name": "ingest",
        "userEmail": "dgo.probe@example.invalid",
        "operation": "create",
        "tag": "__DGO_PROBE__"
      },
      "expect": []
    },
    "EDTMS_NITDA_READ_API_DASHBOARD_SYNC": {
      "body": {
        "action": "sync",
        "name": "sync",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": []
    },
    "EDTMS_NITDA_UPDATE_TASK_RESOLUTION": {
      "body": {
        "action": "resolve",
        "name": "resolve",
        "userEmail": "dgo.probe@example.invalid",
        "operation": "create",
        "tag": "__DGO_PROBE__"
      },
      "expect": []
    },
    "ARCHIVE": {
      "body": {
        "action": "archive",
        "name": "archive",
        "userEmail": "dgo.probe@example.invalid",
        "operation": "create",
        "tag": "__DGO_PROBE__"
      },
      "expect": []
    },
    "DISPATCH_OUTBOUND": {
      "body": {
        "action": "dispatchOutbound",
        "name": "dispatchOutbound",
        "userEmail": "dgo.probe@example.invalid",
        "operation": "create",
        "tag": "__DGO_PROBE__"
      },
      "expect": []
    },
    "CORRESPONDENCE_EMAIL_SEND": {
      "body": {
        "action": "sendEmail",
        "name": "sendEmail",
        "userEmail": "dgo.probe@example.invalid",
        "operation": "create",
        "tag": "__DGO_PROBE__"
      },
      "expect": []
    },
    "STATUS_UPDATE": {
      "body": {
        "action": "statusUpdate",
        "name": "statusUpdate",
        "userEmail": "dgo.probe@example.invalid",
        "operation": "create",
        "tag": "__DGO_PROBE__"
      },
      "expect": []
    },
    "GET_EMAILS": {
      "body": {
        "action": "getEmails",
        "name": "getEmails",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": [
        "emails"
      ]
    },
    "GET_LETTERS": {
      "body": {
        "action": "getLetters",
        "name": "getLetters",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": [
        "letters"
      ]
    },
    "GET_USERS": {
      "body": {
        "action": "getUsers",
        "name": "getUsers",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": [
        "users"
      ]
    },
    "GET_CATEGORIES": {
      "body": {
        "action": "getCategories",
        "name": "getCategories",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": [
        "categories"
      ]
    },
    "GET_DEPARTMENTS": {
      "body": {
        "action": "getDepartments",
        "name": "getDepartments",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": [
        "departments"
      ]
    },
    "GET_CORRESPONDENCE": {
      "body": {
        "action": "getCorrespondence",
        "name": "getCorrespondence",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": []
    },
    "ATTENTION_ITEMS": {
      "body": {
        "action": "getAttentionItems",
        "name": "getAttentionItems",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": [
        "items"
      ]
    },
    "BULK_OPS_GET_DOCS": {
      "body": {
        "action": "getDocs",
        "name": "getDocs",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": [
        "docs"
      ]
    },
    "API_GET": {
      "body": {
        "action": "get",
        "name": "get",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": []
    },
    "ASSIGN_ITEM_DIRECT": {
      "body": {
        "action": "assignItem",
        "name": "assignItem",
        "userEmail": "dgo.probe@example.invalid",
        "operation": "create",
        "tag": "__DGO_PROBE__"
      },
      "expect": []
    },
    "TASK_CREATED_RESPONDER": {
      "body": {
        "action": "taskCreated",
        "name": "taskCreated",
        "userEmail": "dgo.probe@example.invalid",
        "operation": "create",
        "tag": "__DGO_PROBE__"
      },
      "expect": []
    },
    "EMAILS_COMPOSE_SELECT": {
      "body": {
        "action": "getEmails",
        "name": "getEmails",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": []
    },
    "GET_EMAILS_CONTROL_DECK": {
      "body": {
        "action": "getEmails",
        "name": "getEmails",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": []
    },
    "FETCH_ALL_STANDALONE": {
      "body": {
        "action": "fetchAll",
        "name": "fetchAll",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": [
        "tasks",
        "docs",
        "emails"
      ]
    },
    "FETCH_ALL_MATRIX_02": {
      "body": {
        "action": "fetchAll",
        "name": "fetchAll",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": [
        "tasks",
        "docs",
        "emails"
      ]
    },
    "FETCH_ALL_MATRIX_03": {
      "body": {
        "action": "fetchAll",
        "name": "fetchAll",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": [
        "tasks",
        "docs",
        "emails"
      ]
    },
    "FETCH_ALL_WITH_REFERENCES": {
      "body": {
        "action": "fetchAll",
        "name": "fetchAll",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": [
        "tasks",
        "docs",
        "emails",
        "users"
      ]
    },
    "FETCH_ACTIVITIES_STANDALONE": {
      "body": {
        "action": "LIST-ACTIVITIES",
        "name": "LIST-ACTIVITIES",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": []
    },
    "REFERENCE_DATA_LINEAGE": {
      "body": {
        "action": "lookups",
        "name": "lookups",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": [
        "users",
        "categories",
        "departments"
      ]
    },
    "SINGLE_ASSIGNMENT_DEPLOYED": {
      "body": {
        "action": "singleassignment",
        "name": "singleassignment",
        "userEmail": "dgo.probe@example.invalid",
        "operation": "create",
        "tag": "__DGO_PROBE__"
      },
      "expect": []
    },
    "BULK_ASSIGNMENT_REGEN": {
      "body": {
        "action": "bulkassignment",
        "name": "bulkassignment",
        "userEmail": "dgo.probe@example.invalid",
        "operation": "create",
        "tag": "__DGO_PROBE__"
      },
      "expect": []
    },
    "EMAIL_DYNAMIC_ACTIONS_STANDALONE": {
      "body": {
        "action": "dispatchEmail",
        "name": "dispatchEmail",
        "userEmail": "dgo.probe@example.invalid",
        "operation": "create",
        "tag": "__DGO_PROBE__"
      },
      "expect": []
    },
    "AI_DOC_ANALYSIS_LINEAGE": {
      "body": {
        "action": "aiAnalyseEventDocs",
        "name": "aiAnalyseEventDocs",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": []
    },
    "OTP_GENERATE_NO_PORT": {
      "body": {
        "action": "otpGenerate",
        "name": "otpGenerate",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": []
    },
    "OTP_VERIFY_NO_PORT": {
      "body": {
        "action": "otpVerify",
        "name": "otpVerify",
        "userEmail": "dgo.probe@example.invalid",
        "code": "000000"
      },
      "expect": []
    },
    "WEB_SEND_EMAIL_UNSIGNED": {
      "body": {
        "action": "dispatchEmail",
        "name": "dispatchEmail",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": []
    },
    "SINGLE_ASSIGNMENT_ALT_SIG": {
      "body": {
        "action": "singleassignment",
        "name": "singleassignment",
        "userEmail": "dgo.probe@example.invalid"
      },
      "expect": []
    }
  },
  "rejected": [
    {
      "workflowId": "20e6340941ce4b1bbb87b43c9102a777",
      "flow": "Get email attachments",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/20e6340941ce4b1bbb87b43c9102a777/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "sig": "\u00abredacted\u00bb",
      "reason": "signature carries a character outside the base64url alphabet. Paste artefact.",
      "correctUrl": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/20e6340941ce4b1bbb87b43c9102a777/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb"
    },
    {
      "workflowId": "a942d230337c4ddfa9a386e92bbd048b",
      "flow": "CREATE TASK FOR EMAIL",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a942d230337c4ddfa9a386e92bbd048b/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "sig": "\u00abredacted\u00bb",
      "reason": "signature is 40 characters; a Power Automate SAS signature is 43. Truncated in transit.",
      "correctUrl": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a942d230337c4ddfa9a386e92bbd048b/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb"
    },
    {
      "workflowId": "20e6340941ce4b1bbb87b43c9102a777",
      "flow": "Get email attachments",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/20e6340941ce4b1bbb87b43c9102a777/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "sig": "aoDNRVjvGpUWGq2zB7H5JG10xQTEFhFLt1PTxmpCX6Y=",
      "reason": "signature carries a character outside the base64url alphabet. Paste artefact.",
      "correctUrl": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/20e6340941ce4b1bbb87b43c9102a777/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb"
    },
    {
      "workflowId": "a942d230337c4ddfa9a386e92bbd048b",
      "flow": "CREATE TASK FOR EMAIL",
      "url": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a942d230337c4ddfa9a386e92bbd048b/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb",
      "sig": "KAItnmgczUUEDkdJTQvhBbPTZ3IB8paPPMqz0A7U",
      "reason": "signature is 40 characters; a Power Automate SAS signature is 43. Truncated in transit.",
      "correctUrl": "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a942d230337c4ddfa9a386e92bbd048b/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb"
    }
  ],
  "audit": {
    "keyCount": 56,
    "routeCount": 81,
    "readKeyCount": 23,
    "writeKeyCount": 23,
    "unsignedKeys": [
      "AUTH_LOGIN_START",
      "ARCHIVE",
      "WEB_SEND_EMAIL_UNSIGNED"
    ],
    "missingUrlKeys": [],
    "duplicateUrls": {
      "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/31e02518075940d2bcfa9bdb0e9b0b8d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb": [
        "FETCH_ALL",
        "FETCH_ALL_STANDALONE"
      ],
      "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/bc83d98acf474a088832d78f50085388/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb": [
        "DYNAMIC_ACTIONS",
        "DISPATCH_OUTBOUND",
        "EMAIL_DYNAMIC_ACTIONS_STANDALONE"
      ],
      "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/85c556f10b8244ba9d839a2ebe240b91/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb": [
        "SUBSIDIARY_ACTIONS",
        "FETCH_ACTIVITIES_STANDALONE"
      ],
      "https://defaultca6a4b3f912349bcbcb927085ebbf1.a1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/f771d509dfb648b0b21eeec0a36614fa/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=\u00abredacted\u00bb": [
        "SCAN_INTAKE",
        "UPLOAD_ECM_DOCS_PORTAL"
      ]
    },
    "groups": [
      "alias",
      "archive",
      "auth",
      "core",
      "derived",
      "edtms",
      "portal"
    ],
    "activeSignedKeys": 53,
    "rejectedCount": 4
  }
};
