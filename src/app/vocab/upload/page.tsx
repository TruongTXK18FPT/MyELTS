'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UploadCloud, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const vocabSchema = z.object({
  word: z.string().min(1, 'Từ vựng không được để trống'),
  grammar: z.string().optional(),
  pronunciation: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
});

type VocabFormValues = z.infer<typeof vocabSchema>;

export default function VocabUploadPage() {
  const router = useRouter();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<VocabFormValues>({
    resolver: zodResolver(vocabSchema)
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: VocabFormValues) => {
    try {
      setLoading(true);
      let imageUrl = null;

      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('folder', 'myelts/vocab');

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const result = await uploadRes.json();
          imageUrl = result.url;
        }
      }

      const vocabRes = await fetch('/api/vocab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, image: imageUrl })
      });

      if (!vocabRes.ok) throw new Error('Thêm thất bại');

      setSuccess(true);
      reset();
      setImageFile(null);
      setPreview(null);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error(error);
      alert('Đã xảy ra lỗi khi thêm từ vựng.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl mx-auto p-4 py-8">
      <Link href="/profile" className="inline-flex items-center text-primary mb-6 hover:underline">
        <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
      </Link>

      <Card className="shadow-2xl shadow-primary/5">
        <CardHeader>
          <CardTitle className="text-3xl text-center text-primary flex items-center justify-center gap-2">
            <UploadCloud /> Thêm từ vựng mới
          </CardTitle>
        </CardHeader>
        <CardContent>
          {success && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center justify-center gap-2">
              <CheckCircle /> Đã thêm từ vựng thành công!
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Từ vựng *</label>
                  <Input {...register('word')} placeholder="Ví dụ: Elaborate" />
                  {errors.word && <p className="text-red-500 text-xs mt-1">{errors.word.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Phiên âm</label>
                  <Input {...register('pronunciation')} placeholder="/ɪˈlæb.ə.rət/" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Loại từ (Ngữ pháp)</label>
                  <Input {...register('grammar')} placeholder="Verb / Adjective" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Chủ đề (Thể loại)</label>
                  <Input {...register('category')} placeholder="Environment, Education..." />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium mb-1 block">Hình ảnh minh họa</label>
                <div className="border-2 border-dashed border-primary/30 rounded-xl p-4 text-center cursor-pointer hover:bg-primary/5 transition-colors relative" onClick={() => document.getElementById('imageUpload')?.click()}>
                  {preview ? (
                    <img src={preview} alt="Preview" className="mx-auto max-h-48 rounded-lg object-contain" />
                  ) : (
                    <div className="py-12 space-y-2">
                      <UploadCloud className="w-12 h-12 text-primary/50 mx-auto" />
                      <p className="text-sm text-muted-foreground">Nhấn để chọn ảnh</p>
                    </div>
                  )}
                  <input type="file" id="imageUpload" className="hidden" accept="image/*" onChange={handleImageChange} />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Ghi chú (Tùy chọn)</label>
                  <Textarea {...register('notes')} placeholder="Nghĩa tiếng Việt, ví dụ câu sử dụng..." className="resize-none" rows={3} />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full text-lg py-6 rounded-xl shadow-lg hover:shadow-primary/25" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Thêm vào từ điển'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
