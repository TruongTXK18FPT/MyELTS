export type GrammarSeedEntry = {
  title: string;
  grammarType: string;
  level: string;
  explanation: string;
  usageGuide: string;
  structurePattern: string;
  exampleSentence: string;
  storyExample: string;
  practiceHint: string;
  tags: string[];
};

export const grammarSeedEntries: GrammarSeedEntry[] = [
  {
    title: 'Present Simple',
    grammarType: 'Tense',
    level: 'A1-A2',
    explanation:
      'Present Simple diễn tả thói quen, sự thật hiển nhiên và lịch trình cố định.',
    usageGuide:
      'Dùng trạng từ tần suất như always, usually, often để nhấn mạnh thói quen. Với ngôi thứ ba số ít, động từ thêm -s hoặc -es.',
    structurePattern:
      'Khẳng định: S + V(s/es) + O. | Phủ định: S + do/does not + V + O. | Nghi vấn: Do/Does + S + V + O?',
    exampleSentence: 'She studies English every evening after dinner.',
    storyExample:
      'Lan wakes up at 5:30, reviews vocabulary for 20 minutes, and then goes to school by bus.',
    practiceHint:
      'Viết 5 câu về lịch sinh hoạt hằng ngày của bạn, chú ý chia động từ đúng với chủ ngữ.',
    tags: ['habit', 'daily routine', 'fact'],
  },
  {
    title: 'Present Continuous',
    grammarType: 'Tense',
    level: 'A1-A2',
    explanation:
      'Present Continuous diễn tả hành động đang xảy ra tại thời điểm nói hoặc kế hoạch gần trong tương lai.',
    usageGuide:
      'Thường đi với now, right now, at the moment. Dùng để mô tả bối cảnh hiện tại trong bài nói IELTS.',
    structurePattern:
      'Khẳng định: S + am/is/are + V-ing + O. | Phủ định: S + am/is/are not + V-ing + O. | Nghi vấn: Am/Is/Are + S + V-ing + O?',
    exampleSentence: 'I am preparing my speaking notes right now.',
    storyExample:
      'At the library, Minh is listening to a podcast while his friend is taking notes.',
    practiceHint:
      'Mô tả 3 hoạt động đang diễn ra xung quanh bạn ở thời điểm hiện tại.',
    tags: ['action now', 'temporary situation'],
  },
  {
    title: 'Present Perfect',
    grammarType: 'Tense',
    level: 'A2-B1',
    explanation:
      'Present Perfect diễn tả trải nghiệm, kết quả liên quan hiện tại hoặc hành động bắt đầu trong quá khứ và còn tiếp diễn.',
    usageGuide:
      'Dùng với for, since, already, yet, just, ever, never. Không dùng mốc thời gian quá khứ cụ thể như yesterday.',
    structurePattern:
      'Khẳng định: S + have/has + V3/ed + O. | Phủ định: S + have/has not + V3/ed + O. | Nghi vấn: Have/Has + S + V3/ed + O?',
    exampleSentence: 'She has improved her writing score since last month.',
    storyExample:
      'Nam has practiced speaking every day for six weeks, so he feels more confident now.',
    practiceHint:
      'Viết 4 câu với for/since và 2 câu về trải nghiệm dùng ever/never.',
    tags: ['experience', 'result', 'duration'],
  },
  {
    title: 'Past Simple',
    grammarType: 'Tense',
    level: 'A1-A2',
    explanation: 'Past Simple diễn tả hành động đã kết thúc trong quá khứ tại một thời điểm xác định.',
    usageGuide:
      'Đi với yesterday, last week, in 2020, two days ago. Động từ có quy tắc thêm -ed, bất quy tắc cần học thuộc.',
    structurePattern:
      'Khẳng định: S + V2/ed + O. | Phủ định: S + did not + V + O. | Nghi vấn: Did + S + V + O?',
    exampleSentence: 'We visited our grandparents last weekend.',
    storyExample:
      'Yesterday, I missed the bus, walked to school, and arrived ten minutes late.',
    practiceHint: 'Kể lại một ngày cuối tuần gần nhất bằng 6-8 câu ở thì quá khứ đơn.',
    tags: ['finished action', 'past time'],
  },
  {
    title: 'Past Continuous',
    grammarType: 'Tense',
    level: 'A2-B1',
    explanation:
      'Past Continuous diễn tả hành động đang diễn ra tại một thời điểm trong quá khứ hoặc bị chen ngang bởi hành động khác.',
    usageGuide:
      'Thường đi với while, when. Dùng để tạo bối cảnh khi kể chuyện trong Speaking Part 2.',
    structurePattern:
      'Khẳng định: S + was/were + V-ing + O. | Phủ định: S + was/were not + V-ing + O. | Nghi vấn: Was/Were + S + V-ing + O?',
    exampleSentence: 'I was revising grammar when the power went out.',
    storyExample:
      'While we were waiting for the teacher, a student was practicing presentation skills.',
    practiceHint: 'Viết 4 câu có while/when để mô tả hai hành động trong quá khứ.',
    tags: ['background action', 'interruption'],
  },
  {
    title: 'Future Forms',
    grammarType: 'Tense',
    level: 'A2-B1',
    explanation:
      'Nhóm thì tương lai gồm will, be going to, và Present Continuous cho kế hoạch đã sắp xếp.',
    usageGuide:
      'Will cho quyết định tức thì hoặc dự đoán; be going to cho ý định rõ hoặc dấu hiệu đã thấy; Present Continuous cho lịch hẹn cụ thể. Mỗi nhóm có phủ định và nghi vấn riêng, ví dụ phủ định của will là will not (won\'t), không phải am/is/are going to.',
    structurePattern:
      'Khẳng định (will): S + will + V. | Phủ định (will): S + will not + V. | Nghi vấn (will): Will + S + V? | Khẳng định (be going to): S + am/is/are going to + V. | Phủ định (be going to): S + am/is/are not going to + V. | Nghi vấn (be going to): Am/Is/Are + S + going to + V? | Khẳng định (Present Continuous - arrangement): S + am/is/are + V-ing + time expression. | Phủ định (Present Continuous - arrangement): S + am/is/are not + V-ing + time expression. | Nghi vấn (Present Continuous - arrangement): Am/Is/Are + S + V-ing + time expression?',
    exampleSentence: 'I am going to join a mock speaking test this Sunday.',
    storyExample:
      'Our study group will meet on Friday, and we are going to review conditionals together.',
    practiceHint:
      'Tạo 6 câu dự định tương lai, trong đó có ít nhất 2 câu dùng will và 2 câu dùng going to.',
    tags: ['prediction', 'plan', 'arrangement'],
  },
  {
    title: 'Modal Verbs',
    grammarType: 'Modal',
    level: 'A2-B2',
    explanation:
      'Modal verbs như can, could, should, must, might diễn tả khả năng, lời khuyên, nghĩa vụ và mức độ chắc chắn.',
    usageGuide:
      'Sau modal luôn là động từ nguyên mẫu. Dùng should để đưa lời khuyên trong Writing Task 2.',
    structurePattern:
      'Khẳng định: S + modal + V(base). | Phủ định: S + modal + not + V(base). | Nghi vấn: Modal + S + V(base)?',
    exampleSentence: 'Students should balance study time and rest to avoid burnout.',
    storyExample:
      'To improve teamwork, members must listen actively and might need to compromise.',
    practiceHint: 'Viết 5 câu khuyên bạn học của bạn sử dụng should hoặc should not.',
    tags: ['advice', 'obligation', 'possibility'],
  },
  {
    title: 'Countable and Uncountable Nouns',
    grammarType: 'Noun',
    level: 'A1-A2',
    explanation:
      'Danh từ đếm được dùng với a/an và số nhiều; danh từ không đếm được không đi với a/an và thường dùng lượng từ.',
    usageGuide:
      'Dùng many/few cho danh từ đếm được; much/little cho danh từ không đếm được.',
    structurePattern:
      'Khẳng định: There is/are + a/an/many/much + noun. | Phủ định: There is not much + uncountable noun. / There are not many + plural noun. | Nghi vấn: Is there much + uncountable noun? / Are there many + plural noun?',
    exampleSentence: 'We need more information and fewer unnecessary details.',
    storyExample:
      'In the survey, there were many responses but very little reliable data.',
    practiceHint: 'Phân loại 12 danh từ theo hai nhóm đếm được và không đếm được rồi đặt câu.',
    tags: ['quantifier', 'noun'],
  },
  {
    title: 'Articles a, an, the',
    grammarType: 'Determiner',
    level: 'A1-A2',
    explanation:
      'Mạo từ xác định và không xác định giúp người nghe hiểu mức độ cụ thể của danh từ.',
    usageGuide:
      'Dùng a/an khi đề cập lần đầu một danh từ số ít đếm được; dùng the khi đối tượng đã xác định.',
    structurePattern:
      'Khẳng định: S + V + a/an + singular noun (lần đầu). / S + V + the + specific noun. | Phủ định: S + be not + a/an/the + noun. | Nghi vấn: Is/Are + S + a/an/the + noun?',
    exampleSentence: 'I saw a documentary, and the documentary changed my perspective.',
    storyExample:
      'A student entered the room. The student looked nervous before the interview.',
    practiceHint: 'Chọn đúng a, an, the cho 10 câu và giải thích lý do.',
    tags: ['article', 'specificity'],
  },
  {
    title: 'Comparatives and Superlatives',
    grammarType: 'Adjective',
    level: 'A2-B1',
    explanation:
      'So sánh hơn dùng để so hai đối tượng, so sánh nhất dùng để nhấn mạnh mức cao nhất trong một nhóm.',
    usageGuide:
      'Tính từ ngắn thêm -er/-est; tính từ dài dùng more/most. Chú ý các dạng bất quy tắc như good-better-best.',
    structurePattern:
      'Khẳng định: A + be + adj-er/more adj + than B. / A + be + the + adj-est/most adj. | Phủ định: A + be not as/so + adj + as B. | Nghi vấn: Be + A + adj-er/more adj + than B?',
    exampleSentence: 'Online courses are more flexible than traditional classes.',
    storyExample:
      'Among all team members, Hoa is the most organized and the quickest note-taker.',
    practiceHint: 'Viết 5 câu so sánh về hai phương pháp học IELTS.',
    tags: ['comparison', 'adjective'],
  },
  {
    title: 'Gerund and Infinitive',
    grammarType: 'Verb Pattern',
    level: 'B1-B2',
    explanation:
      'Một số động từ đi với V-ing, một số đi với to V, và một số có thể đi với cả hai nhưng đổi nghĩa.',
    usageGuide:
      'Ví dụ enjoy + V-ing, decide + to V, stop + V-ing hoặc stop + to V mang nghĩa khác nhau.',
    structurePattern:
      'Khẳng định: S + enjoy + V-ing. / S + decide + to V. / S + stop + V-ing. | Phủ định: S + do/does not enjoy + V-ing. / S + decide not to + V. | Nghi vấn: Do/Does + S + enjoy + V-ing? / Did + S + decide to + V?',
    exampleSentence: 'She decided to rewrite her essay after reading the feedback.',
    storyExample:
      'I stopped checking social media to focus, then stopped feeling distracted.',
    practiceHint:
      'Tạo bảng 3 cột: động từ + V-ing, động từ + to V, động từ dùng được cả hai.',
    tags: ['verb pattern', 'gerund', 'infinitive'],
  },
  {
    title: 'Passive Voice',
    grammarType: 'Voice',
    level: 'B1-B2',
    explanation:
      'Câu bị động nhấn mạnh đối tượng chịu tác động thay vì tác nhân gây hành động.',
    usageGuide:
      'Dùng khi tác nhân không quan trọng hoặc không rõ. Chuyển thì đúng theo cấu trúc be + V3.',
    structurePattern:
      'Khẳng định: S + be + V3/ed (+ by O). | Phủ định: S + be + not + V3/ed (+ by O). | Nghi vấn: Be + S + V3/ed (+ by O)?',
    exampleSentence: 'The final report was submitted before the deadline.',
    storyExample:
      'During the event, all instructions were given in English to simulate real IELTS tasks.',
    practiceHint: 'Chuyển 8 câu chủ động sang bị động ở nhiều thì khác nhau.',
    tags: ['voice', 'formal writing'],
  },
  {
    title: 'Relative Clauses',
    grammarType: 'Clause',
    level: 'B1-B2',
    explanation:
      'Mệnh đề quan hệ dùng who, which, that, where, whose để bổ sung thông tin cho danh từ.',
    usageGuide:
      'Dùng defining clause để xác định đối tượng, non-defining clause để thêm thông tin phụ với dấu phẩy.',
    structurePattern:
      'Khẳng định: Noun + who/which/that + clause. | Phủ định: Noun + who/which/that + do/does not + V. | Nghi vấn: Be + this/that + noun + who/which/that + clause?',
    exampleSentence: 'The mentor who guided me helped me organize my ideas clearly.',
    storyExample:
      'The library, which was renovated last year, now has a quiet room for speaking practice.',
    practiceHint: 'Viết 6 câu mô tả người, đồ vật, địa điểm bằng mệnh đề quan hệ.',
    tags: ['relative pronoun', 'complex sentence'],
  },
  {
    title: 'Conditionals 0-1-2-3',
    grammarType: 'Conditional',
    level: 'B1-B2',
    explanation:
      'Câu điều kiện diễn tả sự thật, khả năng thực tế, tình huống giả định hiện tại và giả định trái với quá khứ.',
    usageGuide:
      'Chọn loại câu điều kiện theo mức độ thực tế của tình huống. Không dùng will ở mệnh đề if loại 1 thông thường.',
    structurePattern:
      'Khẳng định: Type 0: If + present, present. | Type 1: If + present, will + V. | Type 2: If + past, would + V. | Type 3: If + past perfect, would have + V3. | Phủ định: If + present, will not + V. / If + past, would not + V. / If + past perfect, would not have + V3. | Nghi vấn: Will + S + V if + present? / Would + S + V if + past? / Would + S + have + V3 if + past perfect?',
    exampleSentence: 'If I had started earlier, I would have finished the essay on time.',
    storyExample:
      'If the team practices every day, they will improve quickly; if they practiced more, they would feel less anxious.',
    practiceHint: 'Viết 2 câu cho mỗi loại điều kiện và phân tích bối cảnh sử dụng.',
    tags: ['if clause', 'hypothesis'],
  },
  {
    title: 'Reported Speech',
    grammarType: 'Reporting',
    level: 'B1-B2',
    explanation:
      'Câu tường thuật dùng để thuật lại lời nói mà không trích dẫn trực tiếp.',
    usageGuide:
      'Lùi thì khi động từ tường thuật ở quá khứ, đổi đại từ và trạng từ thời gian phù hợp.',
    structurePattern:
      'Khẳng định: S + said (that) + clause. / S + told + O + that + clause. | Phủ định: S + said (that) + S + did not + V. | Nghi vấn: S + asked + if/whether + clause. / S + asked + wh-word + clause.',
    exampleSentence: 'The teacher said that we needed to revise linking words.',
    storyExample:
      'My friend told me that she had completed two mock tests the previous day.',
    practiceHint: 'Chuyển 8 câu trực tiếp sang gián tiếp, bao gồm câu hỏi và mệnh lệnh.',
    tags: ['reported speech', 'tense shift'],
  },
  {
    title: 'Question Tags',
    grammarType: 'Question Form',
    level: 'A2-B1',
    explanation:
      'Question tag dùng cuối câu để xác nhận thông tin hoặc duy trì hội thoại tự nhiên.',
    usageGuide:
      'Mệnh đề chính khẳng định thì tag phủ định, và ngược lại. Động từ trợ phải tương ứng thì của mệnh đề chính.',
    structurePattern:
      'Khẳng định + tag phủ định: Main clause (affirmative), auxiliary + not + pronoun? | Phủ định + tag khẳng định: Main clause (negative), auxiliary + pronoun? | Nghi vấn xác nhận: Wh-question, auxiliary + not + pronoun?',
    exampleSentence: "You have finished the task, haven't you?",
    storyExample:
      "We are meeting at 8 a.m., aren't we, before the practice session starts?",
    practiceHint: 'Viết 10 câu có tag questions ở các thì khác nhau.',
    tags: ['conversation', 'confirmation'],
  },
  {
    title: 'Prepositions of Time and Place',
    grammarType: 'Preposition',
    level: 'A1-A2',
    explanation:
      'Giới từ chỉ thời gian và nơi chốn thường gây nhầm lẫn như in/on/at.',
    usageGuide:
      'At cho thời điểm cụ thể, on cho ngày/thứ, in cho tháng/năm/khoảng thời gian dài và không gian bao quát.',
    structurePattern:
      'Khẳng định: S + V + at/on/in + time/place. | Phủ định: S + do/does not + V + at/on/in + time/place. | Nghi vấn: Do/Does + S + V + at/on/in + time/place?',
    exampleSentence: 'The seminar starts at 9 a.m. on Monday in room B12.',
    storyExample:
      'Our class meets in the language lab on Fridays at 2 p.m.',
    practiceHint: 'Điền in/on/at cho 20 câu về lịch học và địa điểm.',
    tags: ['preposition', 'time', 'place'],
  },
  {
    title: 'Conjunctions and Linkers',
    grammarType: 'Connector',
    level: 'B1-B2',
    explanation:
      'Liên từ và từ nối giúp câu mạch lạc, tăng coherence trong viết và nói.',
    usageGuide:
      'Dùng because, although, however, therefore, moreover đúng vị trí và dấu câu.',
    structurePattern:
      'Khẳng định: Clause + conjunction + clause. / Linker, clause. | Phủ định: Clause + conjunction + clause with not. | Nghi vấn: Why/How + auxiliary + S + V + conjunction + clause?',
    exampleSentence: 'Although the topic was difficult, she organized her ideas clearly.',
    storyExample:
      'He practiced daily; therefore, he delivered his presentation confidently.',
    practiceHint: 'Viết đoạn văn 120 từ dùng ít nhất 6 linker khác nhau.',
    tags: ['coherence', 'writing'],
  },
  {
    title: 'Relative Pronouns and Relative Adverbs',
    grammarType: 'Clause',
    level: 'B1-B2',
    explanation:
      'Ngoài who/which/that còn có where/when/why để nối thông tin về nơi chốn, thời gian, lý do.',
    usageGuide:
      'Where thay cho in which, when thay cho at which trong văn phong tự nhiên.',
    structurePattern:
      'Khẳng định: Noun + where/when/why + clause. | Phủ định: Noun + where/when/why + S + do/does not + V. | Nghi vấn: Be + this/that + noun + where/when/why + clause?',
    exampleSentence: 'This is the reason why many learners prefer online feedback.',
    storyExample:
      'We returned to the cafe where we first planned our IELTS study roadmap.',
    practiceHint: 'Viết 5 câu có where/when/why và 5 câu có who/which/that.',
    tags: ['relative clause', 'academic writing'],
  },
  {
    title: 'Wish and If Only',
    grammarType: 'Wish Structure',
    level: 'B2',
    explanation:
      'Wish và If only diễn tả mong muốn trái với hiện tại, quá khứ hoặc mong thay đổi trong tương lai.',
    usageGuide:
      'Wish + past simple cho hiện tại, wish + past perfect cho quá khứ, wish + would cho điều muốn thay đổi.',
    structurePattern:
      'Khẳng định: S + wish/if only + past simple/past perfect/would + V. | Phủ định: S + wish/if only + S + did not + V. / S + wish/if only + S + had not + V3. | Nghi vấn: Do/Does + S + wish + (that) + clause?',
    exampleSentence: 'I wish I had reviewed grammar more carefully before the test.',
    storyExample:
      'If only I were more patient, I would make fewer mistakes in speaking practice.',
    practiceHint: 'Viết 6 câu bắt đầu bằng I wish hoặc If only ở 3 dạng khác nhau.',
    tags: ['regret', 'hypothetical'],
  },
  {
    title: 'Inversion for Emphasis',
    grammarType: 'Advanced Structure',
    level: 'B2-C1',
    explanation:
      'Đảo ngữ được dùng để nhấn mạnh trong văn viết trang trọng.',
    usageGuide:
      'Các mẫu phổ biến: Never have I..., Rarely do we..., Not only... but also...',
    structurePattern:
      'Khẳng định nhấn mạnh: Negative adverbial + auxiliary + subject + verb. | Phủ định thông thường để đối chiếu: Subject + auxiliary + not + verb. | Nghi vấn tu từ: Never/Rarely + auxiliary + subject + verb ...?',
    exampleSentence: 'Rarely do students receive such detailed feedback in real time.',
    storyExample:
      'Not only did she finish early, but she also helped her teammates revise their drafts.',
    practiceHint: 'Viết 5 câu đảo ngữ với never, rarely, little, only then, not until.',
    tags: ['advanced grammar', 'emphasis'],
  },
  {
    title: 'Cleft Sentences',
    grammarType: 'Advanced Structure',
    level: 'B2-C1',
    explanation:
      'Cleft sentence giúp nhấn mạnh một thành phần cụ thể trong câu.',
    usageGuide:
      'Mẫu thường gặp: It is/was ... that/who ... và What ... is/was ...',
    structurePattern:
      'Khẳng định: It is/was + focused element + that/who + clause. / What + clause + is/was + focused element. | Phủ định: It is/was not + focused element + that/who + clause. | Nghi vấn: Is/Was it + focused element + that/who + clause?',
    exampleSentence: 'It was her consistent practice that improved her speaking score.',
    storyExample:
      'What I need most is a clear weekly plan and steady discipline.',
    practiceHint: 'Chuyển 6 câu bình thường thành cleft sentence để nhấn mạnh ý.',
    tags: ['emphasis', 'complex sentence'],
  },
  {
    title: 'Present Perfect Continuous',
    grammarType: 'Tense',
    level: 'B1-B2',
    explanation:
      'Present Perfect Continuous nhấn mạnh quá trình của hành động bắt đầu trong quá khứ và còn kéo dài đến hiện tại.',
    usageGuide:
      'Thường dùng với for, since, all day, recently. Tập trung vào tính liên tục thay vì kết quả hoàn thành.',
    structurePattern:
      'Khẳng định: S + have/has been + V-ing + O. | Phủ định: S + have/has not been + V-ing + O. | Nghi vấn: Have/Has + S + been + V-ing + O?',
    exampleSentence: 'She has been practicing pronunciation for two hours.',
    storyExample:
      'Our group has been preparing for the speaking mock test since early morning, so everyone is exhausted but confident.',
    practiceHint:
      'Viết 6 câu mô tả hoạt động kéo dài gần đây, phân biệt khi nào dùng Present Perfect và Present Perfect Continuous.',
    tags: ['duration', 'ongoing process', 'tense contrast'],
  },
  {
    title: 'Past Perfect',
    grammarType: 'Tense',
    level: 'B1-B2',
    explanation:
      'Past Perfect diễn tả hành động xảy ra trước một hành động khác trong quá khứ.',
    usageGuide:
      'Dùng để làm rõ thứ tự thời gian trong kể chuyện, đặc biệt ở Speaking Part 2 và Writing Task 1 dạng timeline.',
    structurePattern:
      'Khẳng định: S + had + V3/ed + O. | Phủ định: S + had not + V3/ed + O. | Nghi vấn: Had + S + V3/ed + O?',
    exampleSentence: 'By the time the class started, I had finished my homework.',
    storyExample:
      'When we arrived at the station, the train had already left, so we had to change our plan.',
    practiceHint:
      'Viết 5 cặp câu gồm một hành động xảy ra trước và một hành động xảy ra sau trong quá khứ.',
    tags: ['sequence', 'narrative', 'past reference'],
  },
  {
    title: 'Past Perfect Continuous',
    grammarType: 'Tense',
    level: 'B2',
    explanation:
      'Past Perfect Continuous diễn tả quá trình hành động kéo dài trước một mốc quá khứ.',
    usageGuide:
      'Dùng khi muốn nhấn mạnh thời lượng hoặc nguyên nhân dẫn đến kết quả trong quá khứ.',
    structurePattern:
      'Khẳng định: S + had been + V-ing + O. | Phủ định: S + had not been + V-ing + O. | Nghi vấn: Had + S + been + V-ing + O?',
    exampleSentence: 'They had been waiting for over an hour before the interview began.',
    storyExample:
      'I had been studying all night, so I felt sleepy during the morning lecture.',
    practiceHint:
      'Tạo 4 câu nêu nguyên nhân-kết quả trong quá khứ bằng Past Perfect Continuous và Past Simple.',
    tags: ['past duration', 'cause and effect'],
  },
  {
    title: 'Future Continuous',
    grammarType: 'Tense',
    level: 'B1-B2',
    explanation:
      'Future Continuous diễn tả hành động sẽ đang diễn ra tại một thời điểm xác định trong tương lai.',
    usageGuide:
      'Thường đi với mốc thời gian tương lai như this time tomorrow, at 8 p.m. next Friday.',
    structurePattern:
      'Khẳng định: S + will be + V-ing + O. | Phủ định: S + will not be + V-ing + O. | Nghi vấn: Will + S + be + V-ing + O?',
    exampleSentence: 'This time next week, we will be taking our mock listening test.',
    storyExample:
      'At 9 p.m. tonight, my classmates will be reviewing vocabulary while I will be drafting my essay.',
    practiceHint:
      'Viết 5 câu dự đoán hoạt động đang diễn ra ở các mốc thời gian tương lai cụ thể.',
    tags: ['future time frame', 'prediction'],
  },
  {
    title: 'Future Perfect',
    grammarType: 'Tense',
    level: 'B2',
    explanation:
      'Future Perfect diễn tả hành động sẽ hoàn thành trước một mốc thời gian trong tương lai.',
    usageGuide:
      'Dùng với by + mốc thời gian, by the time + clause để nhấn mạnh kết quả hoàn tất.',
    structurePattern:
      'Khẳng định: S + will have + V3/ed + O. | Phủ định: S + will not have + V3/ed + O. | Nghi vấn: Will + S + have + V3/ed + O?',
    exampleSentence: 'By next month, I will have completed three full IELTS tests.',
    storyExample:
      'By the time the exam starts, our study team will have revised all grammar chapters.',
    practiceHint:
      'Viết 6 câu với by/by the time để mô tả mục tiêu học tập trong tương lai.',
    tags: ['completion', 'future deadline'],
  },
  {
    title: 'Future Perfect Continuous',
    grammarType: 'Tense',
    level: 'B2-C1',
    explanation:
      'Future Perfect Continuous diễn tả thời lượng của hành động kéo dài tới một mốc tương lai.',
    usageGuide:
      'Thường dùng để nói về quãng thời gian tích lũy: for three years, for six months by next June.',
    structurePattern:
      'Khẳng định: S + will have been + V-ing + O + for/since + time. | Phủ định: S + will not have been + V-ing + O + for/since + time. | Nghi vấn: Will + S + have been + V-ing + O + for/since + time?',
    exampleSentence: 'By July, she will have been teaching English for ten years.',
    storyExample:
      'By the end of this course, we will have been practicing weekly presentations for four months.',
    practiceHint:
      'Viết 4 câu nêu thời lượng hoạt động tích lũy đến một mốc tương lai.',
    tags: ['future duration', 'advanced tense'],
  },
  {
    title: 'Subject-Verb Agreement',
    grammarType: 'Sentence Accuracy',
    level: 'A2-B2',
    explanation:
      'Sự hòa hợp chủ ngữ-động từ yêu cầu động từ chia đúng theo số ít/số nhiều và cấu trúc chủ ngữ.',
    usageGuide:
      'Chú ý các chủ ngữ đặc biệt: each, everyone, a number of, the number of, along with, as well as.',
    structurePattern:
      'Khẳng định: Singular subject + singular verb. / Plural subject + plural verb. | Phủ định: Singular subject + does not + V. / Plural subject + do not + V. | Nghi vấn: Does + singular subject + V? / Do + plural subject + V?',
    exampleSentence: 'Each participant has a separate feedback sheet.',
    storyExample:
      'A number of students are joining the webinar, but the number of available seats is limited.',
    practiceHint:
      'Làm 20 câu sửa lỗi chia động từ theo chủ ngữ, ưu tiên các cấu trúc dễ nhầm.',
    tags: ['accuracy', 'common mistakes', 'editing'],
  },
  {
    title: 'Noun Clauses',
    grammarType: 'Clause',
    level: 'B1-B2',
    explanation:
      'Mệnh đề danh ngữ đóng vai trò như danh từ trong câu: làm chủ ngữ, tân ngữ hoặc bổ ngữ.',
    usageGuide:
      'Bắt đầu bằng that, whether, if, wh-words. Dùng để mở rộng ý và tăng độ học thuật trong Writing Task 2.',
    structurePattern:
      'Khẳng định: What/That + clause + verb. / Subject + verb + that/whether/wh-clause. | Phủ định: Subject + do/does not + verb + that/whether/wh-clause. | Nghi vấn: Do/Does + subject + verb + whether/if/wh-clause?',
    exampleSentence: 'What the lecturer suggested was extremely practical for exam preparation.',
    storyExample:
      'I realized that effective planning mattered more than studying for long hours without focus.',
    practiceHint:
      'Viết 8 câu dùng noun clauses ở các vị trí khác nhau trong câu.',
    tags: ['complex sentence', 'academic writing'],
  },
  {
    title: 'Adverbial Clauses',
    grammarType: 'Clause',
    level: 'B1-B2',
    explanation:
      'Mệnh đề trạng ngữ diễn tả thời gian, nguyên nhân, mục đích, điều kiện hoặc tương phản.',
    usageGuide:
      'Dùng because, although, while, since, so that, unless để tạo liên kết logic giữa các ý.',
    structurePattern:
      'Khẳng định: Main clause + because/although/while + clause. / Because/Although + clause, main clause. | Phủ định: Main clause + because/although/while + clause with not. | Nghi vấn: Why/When/How + auxiliary + subject + verb + (adverbial clause)?',
    exampleSentence: 'Although the task looked simple, it required careful analysis.',
    storyExample:
      'We left early so that we could review the test format before the exam started.',
    practiceHint:
      'Viết đoạn văn 130 từ kết hợp ít nhất 5 loại adverbial clauses khác nhau.',
    tags: ['logic', 'cohesion', 'clause variety'],
  },
  {
    title: 'Participle Clauses',
    grammarType: 'Clause Reduction',
    level: 'B2-C1',
    explanation:
      'Participle clauses rút gọn mệnh đề để câu gọn hơn và mang tính học thuật hơn.',
    usageGuide:
      'Dùng V-ing cho nghĩa chủ động, V3/ed cho nghĩa bị động, having + V3 cho hành động hoàn thành trước.',
    structurePattern:
      'Khẳng định: V-ing clause, main clause. / V3/ed clause, main clause. / Having + V3, main clause. | Phủ định: Not + V-ing clause, main clause. / Not having + V3, main clause. | Nghi vấn: Did + subject + verb after + V-ing clause? (dùng trong câu đầy đủ có mệnh đề rút gọn).',
    exampleSentence: 'Having reviewed the data, the researcher revised the conclusion.',
    storyExample:
      'Encouraged by her teacher, she kept practicing and eventually reached her target band score.',
    practiceHint:
      'Rút gọn 10 câu phức thành participle clauses mà vẫn giữ nguyên nghĩa.',
    tags: ['sentence reduction', 'advanced writing'],
  },
  {
    title: 'Mixed Conditionals',
    grammarType: 'Conditional',
    level: 'B2-C1',
    explanation:
      'Mixed conditionals kết hợp các loại điều kiện để diễn tả mối liên hệ giữa quá khứ và hiện tại.',
    usageGuide:
      'Loại thường gặp: If + past perfect, would + V (hiện tại). Hoặc If + past simple, would have + V3 (quá khứ).',
    structurePattern:
      'Khẳng định: If + past perfect, would + V. / If + past simple, would have + V3. | Phủ định: If + past perfect, would not + V. / If + past simple, would not have + V3. | Nghi vấn: Would + S + V if + past perfect? / Would + S + have + V3 if + past simple?',
    exampleSentence: 'If I had managed my time better, I would feel less stressed now.',
    storyExample:
      'If she were more confident, she would have answered the interviewer more fluently yesterday.',
    practiceHint:
      'Viết 6 câu mixed conditionals và giải thích quan hệ thời gian giữa hai mệnh đề.',
    tags: ['advanced conditional', 'time relationship'],
  },
];
