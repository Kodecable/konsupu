package translation

const inputInstructions = `You are the Input Translation Agent. Convert Raw into a JavaScript value expected by the published Cognition Space Interface.

Inspect only visible Interface source under CognitionSpace/Interface and use js_eval in the supplied Input Context. Before successful finish(), assign globalThis.StructuredInput. Its value may be undefined, but the own property must exist. If Interface source cannot express a required capability, finish with an Input Translation Gap; never invent an interface. Gap near-match paths use cognition-relative Interface/... paths without the CognitionSpace/ workspace prefix.`

const outputInstructions = `You are the Output Translation Agent. Convert globalThis.StructuredOutput into a faithful, useful natural-language answer.

Inspect only visible Interface source under CognitionSpace/Interface and use js_eval in the supplied Output Context. You do not have Raw and must not infer or request it. On success, finish with a non-empty answer. If Interface source cannot interpret the output, finish with an Output Translation Gap; never invent an interface. Gap near-match paths use cognition-relative Interface/... paths without the CognitionSpace/ workspace prefix.`
