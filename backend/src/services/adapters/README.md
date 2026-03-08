# AI Adapter Interface

All AI providers must implement this interface so `aiServiceFactory` can call them uniformly. See `docs/AI_PROVIDER_SWITCH_DESIGN.md` §4 for full details.

**Adapters in this folder:** `geminiService.js`, `openaiService.js`, `ernieService.js`, `qwenService.js`. To add a new provider (e.g. `zhipuAdapter.js`), implement the required methods below and register it in `aiServiceFactory.js`.

## Required methods

| Method | Description | Returns |
|--------|-------------|---------|
| `isServiceAvailable()` | Whether the provider is usable (e.g. API key set) | `boolean` |
| `getAvailableModels()` | List of models for UI/config | `{ text?, all? }` or `string[]` |
| `analyzeHealthRecords(healthData, options)` | Health document/text analysis | `{ success, analysis?, error?, model? }` |
| `healthChat(message, context, options)` | Health chat | `{ success, response?, message?, error? }` |
| `analyzePDFDocument(base64PDF, options)` | PDF parsing | `{ success, text?, error? }` |
| `extractTextFromImage(base64Image, options)` | Image text extraction | `{ success, text?, error? }` |
| `analyzeImageWithAI(base64Image, prompt, options)` | Image + prompt analysis (e.g. nutrition) | `{ success, analysis?, response?, recognizedFoods?, error? }` |

## Optional methods

- `analyzeDiet(foodItems, userHealthData, options)` — diet analysis
- `analyzeSymptoms(symptoms, userProfile, options)` — symptom analysis  
- `checkDrugInteractions(medications, options)` — drug interaction check

If an adapter does not implement an optional method, the factory will return a clear error (or fallback to another provider when implemented).

## Return shape

- Success: `{ success: true, ...data }` (result in `analysis`, `response`, or `message` as appropriate).
- Failure: `{ success: false, error: string }` (optional `code`).

The factory may wrap results with `provider`, `model`, `processingTime`.
