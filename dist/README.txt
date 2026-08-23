FLOW STUDIO
Generate Power Automate actions and paste them into the modern designer.
DGO Digital Operations — National Information Technology Development Agency


WHAT IS IN HERE

  flow-studio.html            The tool. Double-click it. Chrome or Edge.
                              No server, no install, no network.

  flow-studio-handbook.html   How to use it. Opens in any browser.
  flow-studio-handbook.pdf    The same, for circulation and printing. Needs
                              no network at all; set in standard document
                              faces rather than the web page's own.

  examples/                   Starter plans. Open one with the tool's
                              "Open plan" button (the up-arrow, top left).
                                dgo-endpoint-handler.plan.json  (6 actions)
                                guarded-write.plan.json  (4 actions)
                                acknowledgement-email.plan.json  (4 actions)


START HERE

  1. Open flow-studio.html in Chrome or Edge.
  2. Top left, choose "Start from a blueprint..." and pick an endpoint.
  3. Press "Copy for the designer" along the bottom.
  4. In Power Automate, click the + where the actions belong and choose
     "Paste an action".


THINGS WORTH KNOWING BEFORE YOU START

  Firefox cannot receive the paste. Firefox does not give web pages
  clipboard read access, so the Power Automate designer cannot read what
  this tool copied. Use Chrome or Edge.

  Several actions arrive wrapped in a Scope. One paste carries exactly one
  root action. Delete the Scope afterwards if you do not want it — the
  designer keeps its contents.

  Connector actions paste without a connection. This tool has no access to
  your tenant's connections. Pick one on each connector action after
  pasting. That is expected, not a fault.

  Triggers cannot be pasted at all. The designer's paste path creates
  actions only. Add the trigger in the designer yourself.

  If you doubt the output, press "Check payload". Copy a real Scope from
  your own designer, paste it in, and the tool will name every difference
  between what your designer produced and what it generates.


PRIVACY

  Nothing here talks to a network. Plans are kept in your browser's local
  storage and go nowhere else. The handbook HTML loads display fonts from
  Google when online and falls back to system fonts when not. The PDF
  needs no network at any point.


REBUILDING

  From the repository:

      node tools/build-standalone.mjs    the tool
      node tools/build-package.mjs       everything in this folder

  Do not edit flow-studio.html by hand — it is generated. Edit the sources
  under core/power-automate/ and rebuild.
