'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, AlertTriangle, Check, Heart } from 'lucide-react'
import Link from 'next/link'

export default function PostPage() {
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [diseases, setDiseases] = useState([])
  const [filteredDiseases, setFilteredDiseases] = useState([])
  const [tags, setTags] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const [formData, setFormData] = useState({
    category_id: '',
    disease_id: '',
    standpoint: '',
    stage: '',
    tagIds: [],
    trouble: '',
    hack: '',
    message: '',
    nickname: '',
    age_range: '',
    gender: '',
    email: '',
    agreed: false
  })

  useEffect(() => {
    fetchCategories()
    fetchDiseases()
    fetchTags()
  }, [])

  useEffect(() => {
    if (formData.category_id) {
      setFilteredDiseases(diseases.filter(d => d.category_id === formData.category_id))
    } else {
      setFilteredDiseases([])
    }
  }, [formData.category_id, diseases])

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('display_order')
    setCategories(data || [])
  }

  async function fetchDiseases() {
    const { data } = await supabase.from('diseases').select('*')
    setDiseases(data || [])
  }

  async function fetchTags() {
    const { data } = await supabase.from('tags').select('*').order('display_order')
    setTags(data || [])
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      if (name === 'category_id') updated.disease_id = ''
      return updated
    })
  }

  const handleTagToggle = (tagId) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    if (!formData.disease_id || !formData.standpoint) {
      setMessage('病名と立場は必須です')
      return
    }
    if (!formData.trouble) {
      setMessage('「直面した困りごと」は必須です')
      return
    }
    if (!formData.agreed) {
      setMessage('免責事項に同意してください')
      return
    }

    setSubmitting(true)

    try {
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert([{
          disease_id: formData.disease_id,
          standpoint: formData.standpoint,
          stage: formData.stage || null,
          trouble: formData.trouble,
          hack: formData.hack || null,
          message: formData.message || null,
          nickname: formData.nickname || '匿名',
          age_range: formData.age_range || null,
          gender: formData.gender || null,
          email: formData.email || null
        }])
        .select()

      if (postError) throw postError

      const newPostId = postData[0].id

      if (formData.tagIds.length > 0) {
        const tagRows = formData.tagIds.map(tagId => ({ post_id: newPostId, tag_id: tagId }))
        await supabase.from('post_tags').insert(tagRows)
      }

      setMessage('投稿ありがとうございます！管理者の確認後、掲示板に公開されます。')
      setTimeout(() => router.push('/'), 2000)
    } catch (error) {
      console.error('Error submitting post:', error)
      setMessage('投稿に失敗しました。もう一度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <Link href="/" className="text-slate-400 hover:text-slate-600">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h2 className="text-lg font-bold text-slate-700">新しい体験を共有する</h2>
          </div>

          <div className="mx-6 mt-6 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-slate-700">
            <strong>📝 投稿について：</strong> 投稿内容は管理者の確認後に公開されます。
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">病気のカテゴリ <span className="text-red-500">*</span></label>
                <select
                  name="category_id"
                  required
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="">選択してください</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">病名 <span className="text-red-500">*</span></label>
                <select
                  name="disease_id"
                  required
                  disabled={!formData.category_id}
                  value={formData.disease_id}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white disabled:bg-slate-100"
                >
                  <option value="">
                    {formData.category_id ? '病名を選択してください' : 'まずカテゴリを選択'}
                  </option>
                  {filteredDiseases.map(d => (
                    <option key={d.id} value={d.id}>{d.primary_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">立場 <span className="text-red-500">*</span></label>
                <select
                  name="standpoint"
                  required
                  value={formData.standpoint}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="">選択してください</option>
                  <option value="患者本人">患者本人</option>
                  <option value="家族">家族</option>
                  <option value="友人・知人">友人・知人</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">当時の時期</label>
                <select
                  name="stage"
                  value={formData.stage}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="">選択しない</option>
                  <option value="診断直後">診断直後</option>
                  <option value="治療中">治療中</option>
                  <option value="寛解・経過観察">寛解・経過観察</option>
                  <option value="終末期">終末期</option>
                  <option value="その他">その他</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">関連するテーマ（複数選択可）</label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      formData.tagIds.includes(tag.id)
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-orange-500" /> 直面した困りごと・辛かったこと <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="trouble"
                  required
                  rows={3}
                  placeholder="例：抗がん剤の副作用で水すら苦く感じ、何を食べても美味しくなかった。"
                  value={formData.trouble}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-teal-700 mb-1 flex items-center gap-1">
                  <Check className="w-4 h-4" /> やってみて良かった工夫・解決策
                </label>
                <p className="text-xs text-slate-500 mb-2">※特定の薬やサプリメントの推奨・宣伝は禁止されています。</p>
                <textarea
                  name="hack"
                  rows={4}
                  placeholder="例：レモン水や氷を口に含むとスッキリした。"
                  value={formData.hack}
                  onChange={handleChange}
                  className="w-full border border-teal-300 bg-teal-50/30 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-orange-700 mb-1 flex items-center gap-1">
                  <Heart className="w-4 h-4" /> 同じ境遇の人へ一言
                </label>
                <textarea
                  name="message"
                  rows={2}
                  placeholder="例：食べられない自分を責めないでください。"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full border border-orange-200 bg-orange-50/30 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">ニックネーム（任意）</label>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleChange}
                  placeholder="未入力の場合は「匿名」"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">メールアドレス（任意・非公開）</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="削除連絡用（非公開）"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">年齢層（任意）</label>
                <select
                  name="age_range"
                  value={formData.age_range}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">選択しない</option>
                  <option value="10代以下">10代以下</option>
                  <option value="20代">20代</option>
                  <option value="30代">30代</option>
                  <option value="40代">40代</option>
                  <option value="50代">50代</option>
                  <option value="60代">60代</option>
                  <option value="70代以上">70代以上</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">性別（任意）</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">選択しない</option>
                  <option value="男性">男性</option>
                  <option value="女性">女性</option>
                  <option value="回答しない">回答しない</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-100 p-4 rounded-lg border border-slate-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agreed}
                  onChange={(e) => setFormData({ ...formData, agreed: e.target.checked })}
                  className="mt-1 w-4 h-4"
                />
                <span className="text-sm text-slate-700 leading-relaxed">
                  <strong>免責事項および投稿ルールに同意します。</strong><br />
                  本サイトの情報は個人の体験であり、医学的なアドバイスではありません。治療に関する決定は必ず主治医に相談してください。また、特定の治療法やサプリメント等の推奨・販売誘導、個人や医療機関を特定できる情報の投稿を行わないことに同意します。
                </span>
              </label>
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-sm ${message.includes('失敗') || message.includes('必須') || message.includes('同意') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 rounded-xl font-bold text-lg transition-colors shadow-sm ${
                submitting ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}
            >
              {submitting ? '投稿中...' : '体験を投稿する'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
