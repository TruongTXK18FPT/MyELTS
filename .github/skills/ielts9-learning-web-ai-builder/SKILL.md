---
name: ielts9-learning-web-ai-builder
description: "Design and build AI-powered learning web apps in Next.js with strong frontend design, backend logic, prompt engineering, and voice pipelines. Use when implementing full-skill IELTS platforms for Writing, Speaking, and Listening, plus vocabulary and adaptive feedback with natural IELTS 9-level English."
argument-hint: "Describe learner profile, target IELTS band, skill priority (Writing/Speaking/Listening), voice requirements, and timeline."
---

# IELTS 9 Learning Web AI Builder

## What This Skill Produces
- A production-ready implementation plan and execution workflow for an AI learning web app.
- A Next.js-first blueprint for App Router, server boundaries, and API orchestration.
- A full-skill learning architecture for Writing, Speaking, and Listening.
- A voice AI pipeline design for recording, transcription, scoring, and spoken feedback.
- Frontend experience specs and component strategy.
- Backend data model, API contracts, and service logic.
- Prompt engineering artifacts for tutoring, feedback, skill drills, and test generation.
- Quality gates for UX, reliability, safety, and language quality.

## Use This Skill When
- You need both frontend design and backend logic in one workflow.
- You are building with Next.js and want clear architecture choices for AI features.
- You need complete learning flows for Writing, Speaking, and Listening.
- You need voice-enabled AI interactions for practice and feedback.
- You want prompt design that sounds natural, precise, and human at IELTS 9-level English.
- You want a repeatable process from concept to shipping.

## Default Focus Profile
- Product type: Full-skill IELTS learning platform.
- Framework: Next.js (App Router) with strongly typed frontend and backend boundaries.
- Core loop: Learn -> practice -> evaluate -> feedback -> review -> mastery.
- Priority outcomes:
  - Writing coherence and task response quality
  - Speaking fluency, pronunciation, and lexical range
  - Listening accuracy, comprehension speed, and confidence

## Default Next.js Stack Direction
- Routing and rendering: App Router with server components by default.
- Data writes: Server Actions for trusted mutations where suitable.
- APIs and integrations: Route Handlers for AI and voice service boundaries.
- Auth and authorization: session-based access control for learner data.
- Persistence: relational schema for attempts, scores, and learning traces.
- Async orchestration: queued or background flow for long-running voice processing.

## Inputs To Collect First
1. Outcome: What should learners achieve in 2 to 8 weeks?
2. Audience: CEFR or IELTS level, age, context (self-study, school, exam prep).
3. Skill priority: Writing, Speaking, Listening weight and progression order.
4. Voice requirements: recording quality, transcription language, latency budget.
5. Feature scope: Must-have vs nice-to-have.
6. AI boundaries: What AI can decide vs what must remain deterministic.
7. Constraints: Timeline, budget, privacy, performance, and deployment target.

## Workflow

### Step 1: Define Learning Slice And Success Metrics
1. Pick one narrow user story that delivers measurable value.
2. Define success metrics:
   - Task completion rate
   - Learning gain proxy
   - Writing rubric movement (Task Response, Coherence, Lexical Resource, Grammar)
   - Speaking rubric movement (Fluency, Pronunciation, Grammar, Vocabulary)
   - Listening accuracy and response-time trend
   - Vocabulary retention after 24 hours and 7 days
   - Session length
   - Error rate
3. Freeze acceptance criteria before coding.

Decision point:
- If requirements are vague, write two scope options:
  - MVP in 1 week
  - Standard in 2 to 4 weeks
Choose one before implementation.

### Step 2: Design Next.js Frontend Experience
1. Map user journey: landing -> onboarding -> skill task -> feedback -> progress.
2. Choose visual direction and interaction model.
3. Define route-level contracts for each major view:
   - Required data
   - Loading state
   - Empty state
   - Error state
4. Build component map:
   - Layout components
   - Domain components
   - Reusable UI primitives
5. Plan the three skill modules:
   - Writing: prompt editor, draft submission, rubric feedback panel
   - Speaking: recorder, transcript view, pronunciation insights, replay
   - Listening: audio player, question block, answer review and explanation
6. Ensure mobile-first behavior, keyboard accessibility, and clear audio controls.

Quality checks:
- Clear hierarchy and readable typography.
- No dead-end screens.
- Every async action has loading and error feedback.
- Works on mobile and desktop.
- Recording UX is explicit about microphone state and permissions.

### Step 3: Architect Next.js Backend Logic
1. Model core entities:
   - User
   - Learner profile
   - Vocabulary term and metadata (definition, POS, CEFR level, examples)
   - Skill task (writing prompt, speaking cue card, listening item)
   - Deck, lesson, and test items
   - Attempts, review events, and scores
   - Voice asset metadata (duration, transcript version, scoring version)
   - Review schedule and mastery state
   - Feedback history
2. Define API contracts before handlers:
   - Input schema
   - Output schema
   - Error schema
3. Implement validation, auth, and authorization first.
4. Add transactional boundaries for write operations.
5. Log structured events for key learner actions.

Decision point:
- If feature requires high-trust scoring, use deterministic rubric logic first, then AI explanation second.
- If feature is exploratory or creative, allow AI-first generation with strict post-validation.
- If review scheduling impacts progression, calculate scheduling deterministically and use AI only for explanations and examples.
- If voice scoring is inconsistent, store raw transcript and deterministic sub-scores for auditability.

Quality checks:
- No endpoint without input validation.
- No write endpoint without auth check.
- All critical operations are idempotent or guarded.
- Errors are typed and observable.
- Voice processing jobs are retry-safe and traceable by attempt ID.

### Step 4: Engineer AI Prompts By Skill
1. Define one prompt contract per capability:
   - Goal
   - Inputs
   - Output schema
   - Refusal and safety behavior
2. Build modality-specific prompt sets:
   - Writing: rubric scoring, high-impact revision hints, model answer bands
   - Speaking: fluency and pronunciation feedback from transcript and timing features
   - Listening: explanation generation tied to transcript evidence or script excerpts
   - Vocabulary: context-rich examples and spaced-repetition hints
3. Use layered prompts:
   - System policy
   - Task instruction
   - Context payload
   - Output format constraints
4. Add guardrails:
   - Prompt injection resistance
   - Sensitive-data filtering
   - Hallucination reduction via grounding
5. Add deterministic evaluators for output quality:
   - Schema validity
   - Topical relevance
   - Tone and level appropriateness
6. Store prompt versions and compare outcomes.

Decision point:
- If output must be graded, enforce JSON schema and rubric tags.
- If output is conversational, allow richer prose but still run safety checks.
- If speech signals are noisy, prefer confidence-aware feedback and request re-recording when needed.

Quality checks:
- Prompt output is parseable when structured output is required.
- No unsafe policy violations.
- Content matches learner level and learning objective.
- English is clear, natural, and nuanced.
- Skill feedback references concrete learner evidence, not generic advice.

### Step 5: Build Voice AI Flow
1. Capture microphone input with explicit permission and device checks.
2. Pre-process and upload audio securely with attempt metadata.
3. Transcribe with confidence scoring and segmentation.
4. Run scoring pipeline (deterministic + AI explanation layers).
5. Return transcript, rubric sub-scores, and prioritized action items.
6. Generate spoken feedback where useful with text-to-speech.

Decision point:
- If latency target is strict, stream partial transcript and defer deep scoring.
- If privacy constraints are strict, avoid storing raw audio beyond a short retention window.

Quality checks:
- Fallback path exists when mic permission is denied.
- Transcript and scoring versions are stored for reproducibility.
- Voice output remains intelligible on mobile devices.

### Step 6: Integrate Frontend, Backend, And AI
1. Connect UI actions to typed backend actions.
2. Add optimistic UI only where rollback is safe.
3. Handle retries and user-visible fallback flows.
4. Capture telemetry at each major step for debugging and learning analytics.
5. Run end-to-end flows with realistic seeded data.

Integration checks:
- Review queue updates immediately after submission.
- Mastery changes are explainable from attempt history.
- Generated example sentences match the learner level and target term meaning.
- Writing, speaking, and listening scores roll up to a unified learner profile.

### Step 7: Validate Before Shipping
1. Product validation:
   - Core user story completes end-to-end
   - Learning feedback is understandable and actionable
   - Writing, speaking, and listening modules all complete the full loop
2. Technical validation:
   - No blocking type or lint issues
   - Key flows covered by tests
   - Voice pipeline handles retries and timeout boundaries
3. AI validation:
   - Stable outputs under prompt variations
   - Safe behavior for adversarial inputs
   - Cross-skill consistency in tone and scoring strictness
4. Language validation:
   - Grammar and cohesion at near-native quality
   - Concise, respectful, learner-appropriate tone

Exit criteria:
- Feature meets acceptance criteria.
- Known risks are documented with mitigations.
- Monitoring and rollback plan exist.

## Output Format For Each Run
1. Build brief in 8 to 12 bullets.
2. Next.js implementation plan with frontend, backend, and voice AI tasks.
3. Prompt contract examples for Writing, Speaking, Listening, and Vocabulary.
4. Test and validation checklist, including audio and latency checks.
5. Next milestone recommendation.

## Anti-Patterns To Avoid
- Starting UI implementation without route or data contracts.
- Shipping AI features without schema validation or safety checks.
- Mixing business rules inside prompt text instead of deterministic code.
- Treating voice scoring as a black box without transcript-level auditability.
- Over-designing before proving one vertical slice.

## Example Requests
- Build a Next.js IELTS app with full Writing, Speaking, and Listening modules and voice feedback.
- Add speaking practice with recording, transcription, pronunciation scoring, and spoken coaching.
- Create writing correction with rubric-based scores and revision plans at IELTS band 9 quality.
- Design listening drills with adaptive difficulty and AI explanations grounded in transcript evidence.
