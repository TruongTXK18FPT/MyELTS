# Roadmap Ideas Can Co Hien Tai

## 1) Muc tieu
- Khong cho nguoi hoc tu nhap current band thu cong.
- Bat buoc danh gia dau vao truoc khi tao roadmap.
- Dung ket qua diagnostic de lap lo trinh hoc theo skill gap thuc te.
- Tao vong lap hoc tap ro rang: danh gia -> lap ke hoach -> hoc -> danh gia lai -> dieu chinh.

## 2) User flow de xuat (must-have)
1. Nguoi hoc vao Test Center.
2. Nguoi hoc lam Diagnostic Placement Test (20 cau, 4 ky nang).
3. He thong tinh estimated overall band + band tung ky nang.
4. Nguoi hoc bam Generate roadmap from this result.
5. Roadmap tao theo:
   - target band
   - available time per week
   - weak skills tu diagnostic
6. Moi tuan co task cu the, co trang thai hoan thanh.
7. Cuoi tuan he thong goi y dieu chinh khoi luong hoc neu tre tien do.

## 3) Trang thai hien tai trong codebase
### Da co
- Diagnostic test page: src/app/tests/diagnostic/page.tsx
- Diagnostic test UI + scoring logic: src/components/tests/DiagnosticPlacementTest.tsx
- Bo cau hoi + ham cham band: src/lib/diagnostic-placement-test.ts
- The Diagnostic duoc dua vao Test Center: src/components/tests/TestOverviewCards.tsx
- AI roadmap flow da doi input theo diagnostic: src/ai/flows/personalized-roadmap-generation.ts

### Chua co (can lam tiep)
- Luu ket qua diagnostic vao database theo user.
- API submit diagnostic va lay ket qua gan nhat.
- Roadmap page doc ket qua diagnostic that (khong chi query params).
- Rule gate: neu chua co diagnostic thi khong cho generate roadmap.
- Weekly progress persistence cho task roadmap.
- Auto-replan theo completion rate va score trend.

## 4) Nghiệp vu can co ngay cho roadmap
- Rule 1: Diagnostic la bat buoc cho user moi.
- Rule 2: Neu diagnostic qua 30 ngay, yeu cau re-test de cap nhat band.
- Rule 3: Roadmap phai co toi thieu 1 task do luong moi tuan (mini test/mock section).
- Rule 4: Moi tuan phai co task cho tat ca 4 ky nang, nhung weak skills duoc uu tien gio hoc cao hon.
- Rule 5: Neu completion < 60% trong 2 tuan lien tiep, he thong giam tai 20% va doi chien luoc.
- Rule 6: Neu completion > 85% va diem tang, tang do kho 10-15%.

## 5) Data contract de xay tiep
### DiagnosticResult
- userId
- takenAt
- overallBand
- listeningBand
- readingBand
- writingBand
- speakingBand
- weakSkills
- strongSkills
- rawAnswers (optional, de audit)

### RoadmapInput (sau diagnostic)
- diagnosticOverallBand
- diagnosticSkillBands
- targetBandScore
- availableTimePerWeek
- skillGaps
- studyMaterialsPreference

### RoadmapOutput (nen nang cap)
- estimatedTimeline
- weeklyPlans[]
  - weekIndex
  - focusSkills[]
  - tasks[]
  - targetHours
  - successCriteria
- suggestedResources[]

## 6) API de xay trong sprint gan nhat
- POST /api/tests/diagnostic/submit
  - Input: answers
  - Output: DiagnosticResult
- GET /api/tests/diagnostic/latest
  - Output: DiagnosticResult | null
- POST /api/roadmap/generate
  - Input: target band + available hours + preference
  - Logic: merge latest diagnostic result truoc khi goi AI flow
- GET /api/roadmap/current
  - Output: roadmap hien tai cua user

## 7) KPI can theo doi
- Ty le user hoan thanh diagnostic test.
- Ty le user tao roadmap sau diagnostic.
- Completion rate task roadmap theo tuan.
- Do chenh giua estimated band va ket qua mock test sau 2-4 tuan.
- Ty le user quay lai tuan 2 va tuan 4.

## 8) Acceptance criteria MVP
- User moi khong the tao roadmap neu chua lam diagnostic.
- Diagnostic tra ve estimated overall band va 4 skill bands.
- Roadmap generation dung du lieu diagnostic thay vi current band tu nhap.
- User xem duoc task tuan 1 voi uu tien weak skills.
- Typecheck va lint pass.

## 9) Ke hoach thuc thi ngan han
### Milestone A (1-2 ngay)
- Luu ket qua diagnostic vao DB.
- Tao API latest diagnostic.
- Cap nhat roadmap page de lay latest diagnostic.

### Milestone B (2-3 ngay)
- Tao API generate roadmap thong nhat.
- Persist weekly roadmap tasks.
- Them cap nhat trang thai task.

### Milestone C (2-3 ngay)
- Them weekly review + auto-replan rule co ban.
- Day metric len dashboard.
