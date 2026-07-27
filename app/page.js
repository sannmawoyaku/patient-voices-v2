'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Search, PlusCircle, AlertTriangle, Heart, Flag, MessageSquare, Check, Tag, X } from 'lucide-react'
import Link from 'next/link'

const REPORT_REASONS = [
  '個人や医療機関が特定できる情報が含まれている',
  '特定の薬・サプリメント・治療法の宣伝や販売誘導',
  '誹謗中傷・攻撃的な内容',
  'スパム・関係のない投稿',
  'その他'
]

export default function Home() {
  const [posts, setPosts] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [likedPosts, setLikedPosts] = useState([])
  const [reportTargetId, setReportTargetId] = useState(null)
  const [reportReason, setReportReason] = useState('')
  const [reportDetail, setReportDetail] = useState('')

  useEffect(() => {
    fetchTags()
    fetchPosts()
    const stored = localStorage.getItem('likedPosts')
    if (stored) setLikedPosts(JSON.parse(stored))
  }, [])

  async function fetchTags() {
    const result = await supabase.from('tags').select('*').order('display_order')
    setTags(result.data || [])
  }

  async function fetchPosts() {
    setLoading(true)
    try {
      const result = await supabase
        .from('posts')
        .select('*, diseases ( primary_name, synonyms, categories ( name ) ), post_tags ( tags ( id, name ) )')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      if (result.error) throw result.error
      setPosts(result.data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLike(postId) {
    const post = posts.find(p => p.id === postId)
    const alreadyLiked = likedPosts.includes(postId)
    const currentLikes = post.likes || 0
    const newLikes = alreadyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1

    const result = await supabase
      .from('posts')
      .update({ likes: newLikes })
      .eq('id', postId)

    if (!result.error) {
      setPosts(posts.map(p => p.id === postId ? { ...p, likes: newLikes } : p))
      const updated = alreadyLiked
        ? likedPosts.filter(id => id !== postId)
        : [...likedPosts, postId]
      setLikedPosts(updated)
      localStorage.setItem('likedPosts', JSON.stringify(updated))
    }
  }

  function openReportModal(postId) {
    setReportTargetId(postId)
    setReportReason('')
    setReportDetail('')
  }

  function closeReportModal() {
    setReportTargetId(null)
    setReportReason('')
    setReportDetail('')
  }

  async function submitReport() {
    if (!reportReason && !reportDetail.trim()) return

    const combinedReason = reportDetail.trim()
      ? (reportReason ? reportReason + '：' + reportDetail.trim() : reportDetail.trim())
      : reportReason

    const result = await supabase.from('reports').insert([{ post_id: reportTargetId, reason: combinedReason }])
    if (!result.error) {
      alert('通報を受け付けました。ご協力ありがとうございます。')
    }
    closeReportModal()
  }

  const filteredPosts = posts.filter((post) => {
    if (selectedTag) {
      const postTagNames = (post.post_tags || []).map(pt => pt.tags ? pt.tags.name : '')
      if (postTagNames.indexOf(selectedTag) === -1) return false
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const diseaseName = post.diseases ? (post.diseases.primary_name || '').toLowerCase() : ''
      const synonyms = post.diseases && post.diseases.synonyms ? post.diseases.synonyms.join(' ').toLowerCase() : ''
      const trouble = (post.trouble || '').toLowerCase()
      const hack = (post.hack || '').toLowerCase()
      const message = (post.message || '').toLowerCase()

      return diseaseName.indexOf(term) !== -1 || synonyms.indexOf(term) !== -1 ||
             trouble.indexOf(term) !== -1 || hack.indexOf(term) !== -1 || message.indexOf(term) !== -1
    }

    return true
  })

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="bg-teal-600 text-white sticky top-0 z-10 shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-wider">患者の声</h1>
          </div>
          <Link href="/post" className="bg-white text-teal-600 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-1 hover:bg-teal-50 transition-colors">
            <PlusCircle className="w-4 h-4" />
            体験を投稿
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
            <Search className="text-slate-400 w-5 h-5 flex-shrink-0" />
            <input
              type="text"
              placeholder="病名や悩み（例：味覚障害、旅行）で検索..."
              className="w-full outline-none text-slate-700 bg-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag('')}
              className={selectedTag === ''
                ? 'px-3 py-1.5 rounded-full text-sm font-medium border bg-teal-600 text-white border-teal-600'
                : 'px-3 py-1.5 rounded-full text-sm font-medium border bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}
            >
              すべて
            </button>
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(tag.name)}
                className={selectedTag === tag.name
                  ? 'px-3 py-1.5 rounded-full text-sm font-medium border bg-teal-600 text-white border-teal-600'
                  : 'px-3 py-1.5 rounded-full text-sm font-medium border bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}
              >
                {tag.name}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-center py-10 text-slate-400">読み込み中...</p>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white p-10 rounded-xl text-center text-slate-500 border border-slate-100">
              <p>該当する投稿がまだありません。</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => {
                const isLiked = likedPosts.includes(post.id)
                return (
                  <article key={post.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex flex-wrap justify-between items-center gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-teal-700 bg-teal-100 px-3 py-1 rounded-full text-sm">
                          {post.diseases ? post.diseases.primary_name : '病名未記載'}
                        </span>
                        <span className="text-xs text-slate-500 bg-white border px-2 py-1 rounded-md">
                          {post.standpoint}{post.stage ? (' / ' + post.stage) : ''}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(post.created_at).toLocaleDateString('ja-JP')}
                      </div>
                    </div>

                    {post.post_tags && post.post_tags.length > 0 && (
                      <div className="px-5 pt-3 flex flex-wrap gap-2">
                        {post.post_tags.map((pt) => (
                          <span key={pt.tags ? pt.tags.id : Math.random()} className="flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                            <Tag className="w-3 h-3" /> {pt.tags ? pt.tags.name : ''}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="p-5 space-y-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-400 mb-1 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4 text-orange-400" /> 直面した困りごと
                        </h3>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{post.trouble}</p>
                      </div>

                      {post.hack && (
                        <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
                          <h3 className="text-sm font-bold text-teal-700 mb-2 flex items-center gap-1">
                            <Check className="w-4 h-4" /> やってみて良かった工夫
                          </h3>
                          <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{post.hack}</p>
                        </div>
                      )}

                      {post.message && (
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                          <h3 className="text-sm font-bold text-orange-700 mb-1 flex items-center gap-1">
                            <Heart className="w-4 h-4" /> 同じ境遇の人へ
                          </h3>
                          <p className="text-slate-700 italic leading-relaxed whitespace-pre-wrap">{post.message}</p>
                        </div>
                      )}

                      <div className="text-xs text-slate-400 pt-1">
                        投稿者: {post.nickname || '匿名'}
                        {post.age_range ? (' / ' + post.age_range) : ''}
                        {post.gender ? (' / ' + post.gender) : ''}
                      </div>
                    </div>

                    <div className="px-5 py-3 border-t border-slate-50 flex justify-between items-center bg-white">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={isLiked
                          ? 'flex items-center gap-1 text-sm font-medium text-rose-500'
                          : 'flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-rose-500'}
                      >
                        <Heart className={isLiked ? 'w-4 h-4 fill-rose-500' : 'w-4 h-4'} />
                        役に立った ({post.likes || 0})
                      </button>
                      <button
                        onClick={() => openReportModal(post.id)}
                        className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        <Flag className="w-3 h-3" /> 通報する
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {reportTargetId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">この投稿を通報する</h3>
              <button onClick={closeReportModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <label key={reason} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="reportReason"
                    checked={reportReason === reason}
                    onChange={() => setReportReason(reason)}
                  />
                  {reason}
                </label>
              ))}
            </div>

            <textarea
              placeholder="詳細（任意）"
              value={reportDetail}
              onChange={(e) => setReportDetail(e.target.value)}
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            <div className="flex gap-2">
              <button
                onClick={closeReportModal}
                className="flex-1 py-2 rounded-lg border border-slate-300 text-slate-600 font-medium hover:bg-slate-50"
              >
                キャンセル
              </button>
              <button
                onClick={submitReport}
                disabled={!reportReason && !reportDetail.trim()}
                className={(!reportReason && !reportDetail.trim())
                  ? 'flex-1 py-2 rounded-lg bg-slate-200 text-slate-400 font-bold cursor-not-allowed'
                  : 'flex-1 py-2 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600'}
              >
                通報する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
