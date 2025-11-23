import { SectionTitle } from '@/components/ui/SectionTitle';

const steps = [
  {
    step: '01',
    title: 'Làm bài test đầu vào',
    description: 'Hệ thống AI sẽ đánh giá chính xác năng lực hiện tại của bạn qua một bài thi thử ngắn.',
  },
  {
    step: '02',
    title: 'Nhận lộ trình cá nhân hóa',
    description: 'Dựa trên kết quả, AI sẽ xây dựng một kế hoạch học tập riêng, tập trung vào các kỹ năng bạn cần cải thiện.',
  },
  {
    step: '03',
    title: 'Luyện tập & theo dõi tiến bộ',
    description: 'Làm bài test, học từ vựng và nhận phản hồi chi tiết từ AI. Mọi tiến bộ đều được ghi nhận trên dashboard.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-secondary/50 py-12 md:py-24">
      <div className="container">
        <SectionTitle
          title="Hành trình chinh phục IELTS của bạn"
          subtitle="Chỉ với 3 bước đơn giản, MyELTS sẽ đồng hành cùng bạn từ điểm xuất phát đến band điểm mục tiêu."
        />
        <div className="relative mt-16 grid grid-cols-1 gap-12 md:grid-cols-3">
          <div className="absolute top-1/2 left-0 hidden h-px w-full -translate-y-1/2 bg-border md:block" />
          {steps.map((item, index) => (
            <div key={index} className="relative flex flex-col items-center text-center">
              <div className="z-10 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg shadow-primary/10 border-2 border-primary-soft">
                <span className="font-headline text-3xl font-bold text-primary-dark">{item.step}</span>
              </div>
              <h3 className="mt-6 font-headline text-xl font-semibold text-text-main">{item.title}</h3>
              <p className="mt-2 text-text-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
